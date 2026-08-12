import crypto from 'crypto';

// The AUTH_SECRET from our .env is used as the master key.
// It should be a strong, random 32-byte string.
// We hash it with SHA-256 to ensure it's exactly 32 bytes for AES-256-GCM.
function getMasterKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not defined in environment variables.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a string using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} The encrypted string in the format "iv:authTag:encryptedData" (hex encoded).
 */
export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = getMasterKey();
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted string.
 * @param {string} hash - The encrypted string in the format "iv:authTag:encryptedData".
 * @returns {string} The original plaintext.
 */
export function decrypt(hash) {
  if (!hash) return null;
  
  const parts = hash.split(':');
  if (parts.length !== 3) {
    // If it's not in the expected format, it might be unencrypted legacy data.
    // In production, we'd want to handle this gracefully, but for security, 
    // it's better to fail or assume it's unencrypted if we strictly enforce it.
    // For backward compatibility during migration, we'll return it as-is.
    return hash;
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getMasterKey();
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
