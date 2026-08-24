import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { targetType, recipientEmail, category, subject, body, channels = ['email'] } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Subject and body are required.' }, { status: 400 });
    }

    // Resolve target users
    let users = [];
    const now = new Date();

    if (targetType === 'SINGLE') {
      if (!recipientEmail) {
        return NextResponse.json({ error: 'Recipient email is required for direct emails.' }, { status: 400 });
      }
      const singleUser = await prisma.user.findUnique({
        where: { email: recipientEmail.trim() },
        select: { id: true, email: true, name: true, subscriptionTier: true, quotaTier: true, subscriptionExpiresAt: true }
      });
      if (!singleUser) {
        return NextResponse.json({ error: `No user found with email: ${recipientEmail}` }, { status: 404 });
      }
      users = [singleUser];
    } else if (targetType === 'PAID') {
      users = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          subscriptionTier: { in: ['professional', 'enterprise', 'Professional', 'Enterprise'] }
        },
        select: { id: true, email: true, name: true, subscriptionTier: true, quotaTier: true, subscriptionExpiresAt: true }
      });
    } else if (targetType === 'FREE') {
      users = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          subscriptionTier: { in: ['free', 'starter', 'Free', 'Starter'] }
        },
        select: { id: true, email: true, name: true, subscriptionTier: true, quotaTier: true, subscriptionExpiresAt: true }
      });
    } else if (targetType === 'GRACE') {
      users = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          storageStatus: 'GRACE_PERIOD'
        },
        select: { id: true, email: true, name: true, subscriptionTier: true, quotaTier: true, subscriptionExpiresAt: true }
      });
    } else {
      // ALL
      users = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: { id: true, email: true, name: true, subscriptionTier: true, quotaTier: true, subscriptionExpiresAt: true }
      });
    }

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found matching the selected audience criteria.' }, { status: 400 });
    }

    const appUrl = process.env.NEXTAUTH_URL || 'https://automatix.agency';
    let sentCount = 0;

    // Send to each user with dynamic token replacement
    for (const user of users) {
      const userName = user.name || 'Valued User';
      const userEmail = user.email;
      const subTier = user.subscriptionTier || 'Starter';
      const quotaTier = user.quotaTier || '50 MB Free';
      const expiryDate = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'N/A';

      // Token substitution
      const personalizedSubject = subject
        .replace(/\{\{USER_NAME\}\}/g, userName)
        .replace(/\{\{USER_EMAIL\}\}/g, userEmail)
        .replace(/\{\{SUBSCRIPTION_TIER\}\}/g, subTier)
        .replace(/\{\{STORAGE_TIER\}\}/g, quotaTier)
        .replace(/\{\{EXPIRY_DATE\}\}/g, expiryDate)
        .replace(/\{\{APP_URL\}\}/g, appUrl);

      const personalizedBody = body
        .replace(/\{\{USER_NAME\}\}/g, userName)
        .replace(/\{\{USER_EMAIL\}\}/g, userEmail)
        .replace(/\{\{SUBSCRIPTION_TIER\}\}/g, subTier)
        .replace(/\{\{STORAGE_TIER\}\}/g, quotaTier)
        .replace(/\{\{EXPIRY_DATE\}\}/g, expiryDate)
        .replace(/\{\{APP_URL\}\}/g, appUrl);

      // 1. Email Channel
      if (channels.includes('email') && user.email) {
        const formattedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 30px 15px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #0d0d0d; border: 1px solid #222222; border-radius: 12px; overflow: hidden; }
              .header { padding: 24px; border-bottom: 1px solid #1a1a1a; background: #111111; }
              .logo { font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
              .logo span { color: #3b82f6; }
              .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #d1d5db; }
              .content p { margin-top: 0; margin-bottom: 16px; }
              .highlight-box { background: #141414; border: 1px solid #262626; border-radius: 8px; padding: 16px; margin: 20px 0; }
              .btn { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 13px; margin-top: 10px; }
              .footer { padding: 20px 24px; background-color: #080808; border-top: 1px solid #1a1a1a; font-size: 11px; color: #6b7280; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Automa<span>tix</span></div>
              </div>
              <div class="content">
                ${personalizedBody.includes('<') ? personalizedBody : personalizedBody.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
                <div style="margin-top: 24px;">
                  <a href="${appUrl}/dashboard" class="btn">Open Automatix Portal</a>
                </div>
              </div>
              <div class="footer">
                This is an official communication from Automatix Platform Services.<br/>
                Automatix Automation Cloud &bull; Solapur, Maharashtra, India
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          await sendMail({
            to: user.email,
            subject: personalizedSubject,
            text: personalizedBody,
            html: formattedHtml,
          });
          sentCount++;
        } catch (mailErr) {
          console.error(`Failed to send email to ${user.email}:`, mailErr);
        }
      }

      // 2. Notification Channel
      if (channels.includes('notification')) {
        try {
          // Clean HTML tags for short dropdown summary
          const plainTextBody = personalizedBody
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();

          const shortSnippet = plainTextBody.length > 140 ? plainTextBody.slice(0, 140) + '...' : plainTextBody;

          await prisma.notification.create({
            data: {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              userId: user.id,
              type: category || 'ANNOUNCEMENT',
              message: `${personalizedSubject}: ${shortSnippet}`,
              metadata: {
                subject: personalizedSubject,
                htmlContent: personalizedBody,
                category: category || 'ANNOUNCEMENT'
              },
              status: 'UNREAD',
              updatedAt: new Date()
            }
          });
        } catch (notifErr) {
          console.error(`Failed to create notification for ${user.id}:`, notifErr);
        }
      }
    }

    // Log the communication in AdminEmailLog
    await prisma.adminEmailLog.create({
      data: {
        category: category || 'ANNOUNCEMENT',
        subject,
        body,
        targetType,
        recipientEmail: targetType === 'SINGLE' ? recipientEmail : null,
        sentCount,
        sentBy: session.user.email || 'Admin',
      }
    });

    return NextResponse.json({
      success: true,
      sentCount,
      totalTargeted: users.length
    });
  } catch (error) {
    console.error('Admin Email Dispatch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
