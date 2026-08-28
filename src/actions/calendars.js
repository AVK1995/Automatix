'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCalendars() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const calendars = await prisma.automatixCalendar.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  return calendars;
}

export async function getCalendarById(id) {
  const session = await auth();
  
  // Notice we don't strictly require session here if we are fetching for the public booking page.
  // But for security, we'll check if the client asking for it is the owner OR it's a public request.
  const calendar = await prisma.automatixCalendar.findUnique({
    where: { id },
  });
  
  if (!calendar) throw new Error('Calendar not found');
  
  // If it's a logged in user fetching for builder, verify ownership
  if (session?.user?.id && calendar.clientId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  return calendar;
}

export async function createCalendar(data) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const newCalendar = await prisma.automatixCalendar.create({
    data: {
      clientId: session.user.id,
      name: data.name,
      internalName: data.internalName,
      description: data.description,
      logoUrl: data.logoUrl,
      timezone: data.timezone,
      meetUrl: data.meetUrl,
      sendDefaultEmail: data.sendDefaultEmail !== undefined ? data.sendDefaultEmail : true,
      duration: data.duration !== undefined ? data.duration : 30,
      bufferTime: data.bufferTime !== undefined ? data.bufferTime : 0,
      futureLimit: data.futureLimit !== undefined ? data.futureLimit : 30,
      dateRangeType: data.dateRangeType !== undefined ? data.dateRangeType : 'days_in_future',
      futureLimitType: data.futureLimitType !== undefined ? data.futureLimitType : 'calendar_days',
      dateRangeStart: data.dateRangeStart ? new Date(data.dateRangeStart) : null,
      dateRangeEnd: data.dateRangeEnd ? new Date(data.dateRangeEnd) : null,
      noticePeriod: data.noticePeriod !== undefined ? data.noticePeriod : 0,
      noticePeriodUnit: data.noticePeriodUnit !== undefined ? data.noticePeriodUnit : 'hours',
      slotIncrement: data.slotIncrement !== undefined ? data.slotIncrement : 30,
      maxBookingsPerDay: data.maxBookingsPerDay !== undefined ? data.maxBookingsPerDay : null,
      availability: data.availability,
      platform: data.platform,
      redirectUrl: data.redirectUrl,
      themeColor: data.themeColor,
      buttonStyle: data.buttonStyle,
      fontFamily: data.fontFamily || 'Plus Jakarta Sans',
      bgTheme: data.bgTheme || 'obsidian',
      customBgColor: data.customBgColor || null,
      customCardColor: data.customCardColor || null,
      customTextColor: data.customTextColor || null,
      themeGradient: data.themeGradient || null,
      questions: data.questions || [],
      emailTemplate: data.emailTemplate || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  revalidatePath('/dashboard/calendars');
  return newCalendar;
}

export async function updateCalendar(id, data) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const updatedCalendar = await prisma.automatixCalendar.update({
    where: { id, clientId: session.user.id },
    data: {
      name: data.name,
      internalName: data.internalName,
      description: data.description,
      logoUrl: data.logoUrl,
      timezone: data.timezone,
      meetUrl: data.meetUrl,
      sendDefaultEmail: data.sendDefaultEmail !== undefined ? data.sendDefaultEmail : true,
      duration: data.duration,
      bufferTime: data.bufferTime,
      futureLimit: data.futureLimit,
      dateRangeType: data.dateRangeType,
      futureLimitType: data.futureLimitType,
      dateRangeStart: data.dateRangeStart ? new Date(data.dateRangeStart) : (data.dateRangeStart === null ? null : undefined),
      dateRangeEnd: data.dateRangeEnd ? new Date(data.dateRangeEnd) : (data.dateRangeEnd === null ? null : undefined),
      noticePeriod: data.noticePeriod,
      noticePeriodUnit: data.noticePeriodUnit,
      slotIncrement: data.slotIncrement,
      maxBookingsPerDay: data.maxBookingsPerDay === null ? null : data.maxBookingsPerDay,
      availability: data.availability,
      platform: data.platform,
      redirectUrl: data.redirectUrl,
      themeColor: data.themeColor,
      buttonStyle: data.buttonStyle,
      fontFamily: data.fontFamily !== undefined ? data.fontFamily : undefined,
      bgTheme: data.bgTheme !== undefined ? data.bgTheme : undefined,
      customBgColor: data.customBgColor !== undefined ? data.customBgColor : undefined,
      customCardColor: data.customCardColor !== undefined ? data.customCardColor : undefined,
      customTextColor: data.customTextColor !== undefined ? data.customTextColor : undefined,
      themeGradient: data.themeGradient !== undefined ? data.themeGradient : undefined,
      questions: data.questions,
      emailTemplate: data.emailTemplate !== undefined ? data.emailTemplate : undefined,
      isActive: data.isActive,
    },
  });

  revalidatePath('/dashboard/calendars');
  return updatedCalendar;
}

export async function deleteCalendar(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.automatixCalendar.delete({
    where: { id, clientId: session.user.id },
  });

  revalidatePath('/dashboard/calendars');
  return { success: true };
}
