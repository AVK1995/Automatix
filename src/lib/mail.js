import nodemailer from 'nodemailer';

export async function sendResetEmail(toEmail, setupLink) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP credentials not configured. Skipping email send.');
    return;
  }
  
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
    text: `You have requested to reset your password. Please click the link below to set a new password:\n\n${setupLink}\n\nIf you did not request this, please ignore this email.`,
    html: `<p>You have requested to reset your password. Please click the link below to set a new password:</p><p><a href="${setupLink}">${setupLink}</a></p><p>If you did not request this, please ignore this email.</p>`,
  });
}
