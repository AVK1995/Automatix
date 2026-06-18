import crypto from 'crypto';

export function verifyMetaSignature(rawBody, signatureHeader) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // Bypass if secret is not configured (e.g., local dev)
  
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const signature = signatureHeader.slice(7);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (e) {
    return false;
  }
}

export function verifyCalendlySignature(rawBody, signatureHeader) {
  const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!secret) return true; 

  if (!signatureHeader) return false;

  // Header format: t=<timestamp>,v1=<signature>
  const parts = signatureHeader.split(',');
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));

  if (!tPart || !v1Part) return false;

  const t = tPart.split('=')[1];
  const v1 = v1Part.split('=')[1];

  // Prevent replay attacks (e.g., > 3 minutes old)
  const threeMinutes = 3 * 60 * 1000;
  if (Date.now() - parseInt(t, 10) > threeMinutes) {
    return false;
  }

  const dataToSign = `${t}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (e) {
    return false;
  }
}
