import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const defaultHtmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Reset - Automatix</title>
<style>
  body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #ffffff; padding: 40px 16px; margin: 0; }
  .container { max-width: 520px; margin: 0 auto; background-color: #0e0e0e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px 32px; text-align: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); }
  .logo-table { margin: 0 auto 24px auto; }
  .logo-text { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; vertical-align: middle; }
  .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }
  .text { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 28px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3); }
  .security-box { background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 16px; margin: 28px 0 20px 0; text-align: left; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
  .footer { margin-top: 28px; font-size: 11px; color: #52525b; line-height: 1.5; }
</style>
</head>
<body>
  <div class="container">
    <table border="0" cellpadding="0" cellspacing="0" align="center" class="logo-table">
      <tr>
        <td style="vertical-align: middle; padding-right: 10px;">
          <svg viewBox="0 0 100 100" width="28" height="28" style="display: block;">
            <defs>
              <linearGradient id="mailLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f8fafc" />
                <stop offset="50%" stop-color="#cbd5e1" />
                <stop offset="100%" stop-color="#64748b" />
              </linearGradient>
            </defs>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M41.5 15L15 90h18l7.5-22.5h20L67.5 90h18L58.5 15h-17zM45 45l5-15 5 15h-10z" fill="url(#mailLogoGrad)" />
          </svg>
        </td>
        <td class="logo-text">Automatix</td>
      </tr>
    </table>

    <h1 class="title">Reset Your Password</h1>
    <div class="text">
      We received a request to reset the password for <strong>{{USER_EMAIL}}</strong>.<br/><br/>
      Click the button below to securely set up a new password for your account.
    </div>

    <a href="{{SETUP_LINK}}" class="btn" target="_blank">Reset Password</a>

    <div class="security-box">
      <strong>Security Notice:</strong> This link will expire in 24 hours. If you did not request this email, you can safely ignore it.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Automatix Inc. High-Performance Workflow Automation.
    </div>
  </div>
</body>
</html>
`;

export async function sendResetEmail(toEmail, setupLink) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP credentials not configured. Skipping email send.');
    return;
  }
  
  // Fetch custom template if exists
  let customHtml = defaultHtmlTemplate;
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
    if (settings?.resetEmailTemplate?.trim()) {
      customHtml = settings.resetEmailTemplate;
    }
  } catch (error) {
    console.warn('Failed to fetch platform settings for email template, using default.');
  }

  const finalHtml = customHtml.replace(/\{\{SETUP_LINK\}\}/g, setupLink).replace(/\{\{USER_EMAIL\}\}/g, toEmail);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Automatix" <support@automatix.com>',
    to: toEmail,
    subject: 'Password Reset - Automatix',
    text: `You have requested to reset your password. Please copy and paste this link to set a new password: ${setupLink}`,
    html: finalHtml,
  });
}

export async function sendMail({ to, subject, text, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP credentials not configured. Skipping email send.');
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Automatix" <support@automatix.com>',
    to,
    subject,
    text: text || '',
    html: html || '',
  });
}
