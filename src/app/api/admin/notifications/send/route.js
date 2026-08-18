import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, body } = await req.json();

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return NextResponse.json({ error: 'SMTP credentials not configured' }, { status: 500 });
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0 });
    }

    const emails = users.map(u => u.email);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlBody = body.replace(/\n/g, '<br>');

    // Send emails (using BCC to avoid showing all emails)
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Automatix" <support@automatix.com>',
      to: process.env.SMTP_FROM || 'support@automatix.com',
      bcc: emails,
      subject: subject,
      text: body,
      html: `<div>${htmlBody}</div>`,
    });

    return NextResponse.json({ success: true, sentCount: emails.length });

  } catch (error) {
    console.error('Email Blast Error:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
