import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const defaultHtmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 40px 20px; }
  .container { max-w-xl; margin: 0 auto; background-color: #111; border: 1px solid #333; border-radius: 12px; padding: 32px; text-align: center; }
  .logo { font-size: 24px; font-weight: bold; margin-bottom: 24px; letter-spacing: -1px; }
  .logo span { color: #8B5CF6; }
  .text { font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 32px; }
  .btn { display: inline-block; background-color: #8B5CF6; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; }
  .footer { margin-top: 32px; font-size: 12px; color: #52525b; }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">Automa<span>tix</span></div>
    <div class="text">
      We received a request to reset the password for <strong>{{USER_EMAIL}}</strong>.<br/><br/>
      Click the button below to securely set up a new password for your account.
    </div>
    <a href="{{SETUP_LINK}}" class="btn">Reset Password</a>
    <div class="footer">If you did not request this email, you can safely ignore it.</div>
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
