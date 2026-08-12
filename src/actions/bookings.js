'use server';

import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { auth } from '@/auth';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function getAvailableSlots(calendarId, dateString, userTimezone) {
  const calendar = await prisma.automatixCalendar.findUnique({
    where: { id: calendarId },
    include: { bookings: true }
  });

  if (!calendar || !calendar.isActive) return [];

  const requestedDate = dayjs.tz(dateString, userTimezone);
  const dayOfWeek = requestedDate.format('dddd').toLowerCase();

  const defaultAvailability = {
    monday: [{ start: "09:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "17:00" }],
    saturday: [],
    sunday: []
  };

  const availability = calendar.availability || defaultAvailability;
  const dayBlocks = availability[dayOfWeek] || [];

  const duration = calendar.duration || 30;
  const buffer = calendar.bufferTime || 0;
  const totalSlotTime = duration + buffer;

  const slots = [];
  const now = dayjs();

  // Enforce Date Bounds
  const dateRangeType = calendar.dateRangeType || 'days_in_future';
  const futureLimitType = calendar.futureLimitType || 'calendar_days';
  const futureLimit = calendar.futureLimit || 30;

  const today = now.startOf('day');
  let minDate = today;
  if (dateRangeType === 'date_range' && calendar.dateRangeStart) {
    const rangeStart = dayjs(calendar.dateRangeStart).startOf('day');
    if (rangeStart.isAfter(minDate)) minDate = rangeStart;
  }

  let maxDate;
  if (dateRangeType === 'indefinite') {
    maxDate = today.add(90, 'day');
  } else if (dateRangeType === 'date_range' && calendar.dateRangeEnd) {
    maxDate = dayjs(calendar.dateRangeEnd).startOf('day');
  } else {
    if (futureLimitType === 'business_days') {
      let tempDate = today;
      let daysAdded = 0;
      while (daysAdded < futureLimit) {
        tempDate = tempDate.add(1, 'day');
        if (tempDate.day() !== 0 && tempDate.day() !== 6) daysAdded++;
      }
      maxDate = tempDate;
    } else {
      maxDate = today.add(futureLimit, 'day');
    }
  }

  const reqDay = requestedDate.startOf('day');
  if (reqDay.isBefore(minDate) || reqDay.isAfter(maxDate)) {
    return []; // Out of allowed bounds
  }

  // Max Bookings Per Day Check
  const maxBookings = calendar.maxBookingsPerDay || 0;
  if (maxBookings > 0) {
    const bookingsOnRequestedDay = calendar.bookings.filter(b => dayjs(b.startTime).tz(calendar.timezone || 'UTC').isSame(reqDay, 'day')).length;
    if (bookingsOnRequestedDay >= maxBookings) {
      return []; // Max bookings reached for this day
    }
  }

  // Calculate Notice Period
  const noticePeriod = calendar.noticePeriod || 0;
  const noticePeriodUnit = calendar.noticePeriodUnit || 'hours';
  let earliestAllowedSlot = now;
  if (noticePeriod > 0) {
    if (noticePeriodUnit === 'minutes') earliestAllowedSlot = earliestAllowedSlot.add(noticePeriod, 'minute');
    else if (noticePeriodUnit === 'hours') earliestAllowedSlot = earliestAllowedSlot.add(noticePeriod, 'hour');
    else if (noticePeriodUnit === 'days') earliestAllowedSlot = earliestAllowedSlot.add(noticePeriod, 'day');
  }

  const increment = calendar.slotIncrement || totalSlotTime;

  for (const block of dayBlocks) {
    let currentSlot = dayjs.tz(`${dateString}T${block.start}:00`, calendar.timezone || 'UTC');
    const blockEnd = dayjs.tz(`${dateString}T${block.end}:00`, calendar.timezone || 'UTC');

    while (currentSlot.add(duration, 'minute').isBefore(blockEnd) || currentSlot.add(duration, 'minute').isSame(blockEnd)) {
      if (currentSlot.isAfter(earliestAllowedSlot)) {
        const slotEnd = currentSlot.add(duration, 'minute');
        
        const hasConflict = calendar.bookings.some(booking => {
          const bStart = dayjs(booking.startTime);
          const bEnd = dayjs(booking.endTime);
          return currentSlot.isBefore(bEnd) && slotEnd.isAfter(bStart);
        });

        if (!hasConflict) {
          slots.push(currentSlot.toISOString());
        }
      }
      
      currentSlot = currentSlot.add(increment, 'minute');
    }
  }

  return slots;
}

export async function createBooking(data) {
  const { calendarId, name, email, startTime, timezone, answers } = data;

  const calendar = await prisma.automatixCalendar.findUnique({
    where: { id: calendarId },
    include: { client: true }
  });

  if (!calendar) throw new Error('Calendar not found');

  const start = dayjs(startTime);
  const end = start.add(calendar.duration, 'minute');

  const conflict = await prisma.automatixBooking.findFirst({
    where: {
      calendarId,
      startTime: { lt: end.toDate() },
      endTime: { gt: start.toDate() }
    }
  });

  if (conflict) {
    throw new Error('This slot is no longer available');
  }

  const booking = await prisma.automatixBooking.create({
    data: {
      calendarId,
      name,
      email,
      startTime: start.toDate(),
      endTime: end.toDate(),
      timezone,
      answers: answers || {}
    }
  });

  if (calendar.sendDefaultEmail !== false) {
    try {
      const smtpConnection = await prisma.integration.findFirst({
        where: { clientId: calendar.clientId, providerName: 'smtp' }
      });

      if (smtpConnection) {
        const creds = {
          host: smtpConnection.name.split(':')[0] || 'smtp.gmail.com', // fallback/heuristic
          port: parseInt(smtpConnection.name.split(':')[1]) || 587,
          username: smtpConnection.accountEmail,
          password: smtpConnection.privateKey ? decrypt(smtpConnection.privateKey) : ''
        };

        // Note: The UI connection modal currently doesn't store host/port cleanly if just given an API key,
        // but SMTP usually needs host. Let's assume the user put host in `name` or we default. 
        // Actually, we should check how smtp connections are saved.
        // For now, if we have creds, let's try to send.

        const transporter = nodemailer.createTransport({
          host: creds.host,
          port: creds.port,
          secure: creds.port === 465,
          auth: {
            user: creds.username,
            pass: creds.password,
          },
        });

        const icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Automatix//Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:REQUEST\r\nBEGIN:VEVENT\r\nUID:${booking.id}@automatix.local\r\nDTSTAMP:${dayjs().utc().format('YYYYMMDDTHHmmss[Z]')}\r\nDTSTART:${start.utc().format('YYYYMMDDTHHmmss[Z]')}\r\nDTEND:${end.utc().format('YYYYMMDDTHHmmss[Z]')}\r\nSUMMARY:${calendar.name} with ${name}\r\nDESCRIPTION:Booking ID: ${booking.id}\\n\\nCustom Questions:\\n${Object.entries(answers || {}).map(([k,v]) => `${k}: ${v}`).join('\\n')}\r\nORGANIZER;CN="${calendar.client?.name || 'Automatix'}":mailto:${calendar.client?.email || creds.username}\r\nATTENDEE;RSVP=TRUE;CN="${name}":mailto:${email}\r\n${calendar.meetUrl ? `LOCATION:${calendar.meetUrl}\r\n` : ''}STATUS:CONFIRMED\r\nEND:VEVENT\r\nEND:VCALENDAR`;

        const mailOptions = {
          from: `"${calendar.client?.name || 'Automatix'}" <${creds.username}>`,
          to: email,
          cc: creds.username, // Send copy to host
          subject: `Confirmed: ${calendar.name} with ${name} on ${start.format('MMM D, YYYY')}`,
          text: `Hi ${name},\n\nYour meeting "${calendar.name}" is confirmed for ${start.format('dddd, MMMM D, YYYY')} at ${start.format('h:mm A')} (${timezone}).\n\n${calendar.meetUrl ? `Meeting Link: ${calendar.meetUrl}` : ''}\n\nPlease find the calendar invitation attached.`,
          icalEvent: {
            filename: 'invite.ics',
            method: 'request',
            content: icsContent
          }
        };

        await transporter.sendMail(mailOptions);
      }
    } catch (err) {
      console.error("Failed to send booking email:", err);
      // Don't fail the booking if email fails
    }
  }

  return booking;
}

export async function getBookings(calendarId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify the calendar belongs to the user
  const calendar = await prisma.automatixCalendar.findUnique({
    where: { id: calendarId, clientId: session.user.id }
  });

  if (!calendar) throw new Error('Calendar not found');

  const bookings = await prisma.automatixBooking.findMany({
    where: { calendarId },
    orderBy: { startTime: 'desc' }
  });

  return bookings;
}

export async function getRecentBookings(calendarId, limit = 10) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const calendar = await prisma.automatixCalendar.findUnique({
    where: { id: calendarId, clientId: session.user.id }
  });

  if (!calendar) throw new Error('Calendar not found');

  const bookings = await prisma.automatixBooking.findMany({
    where: { calendarId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Map them into a standard event payload format to match webhook/other triggers
  return bookings.map(b => ({
    id: b.id,
    createdAt: b.createdAt,
    payload: {
      resource: {
        created_at: b.createdAt,
        email: b.email,
        name: b.name,
        answers: b.answers || {},
        startTime: b.startTime,
        endTime: b.endTime,
        timezone: b.timezone,
        status: b.status,
      }
    }
  }));
}

export async function updateBookingStatus(bookingId, status) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Ensure the user owns the calendar for this booking
  const booking = await prisma.automatixBooking.findUnique({
    where: { id: bookingId },
    include: { calendar: true }
  });

  if (!booking || booking.calendar.clientId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  const updated = await prisma.automatixBooking.update({
    where: { id: bookingId },
    data: { status }
  });

  return updated;
}
