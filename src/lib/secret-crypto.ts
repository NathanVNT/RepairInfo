import crypto from 'node:crypto';

const ENCRYPTION_PREFIX = 'enc:v1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SESSION_SECRET ||
    'atelier-dev-secret-change-me';

  return crypto.createHash('sha256').update(secret).digest();
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

export function encryptSecret(plainText: string): string {
  const raw = String(plainText ?? '');
  if (!raw) return '';
  if (isEncryptedSecret(raw)) return raw;

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const ivB64 = iv.toString('base64url');
  const tagB64 = authTag.toString('base64url');
  const dataB64 = encrypted.toString('base64url');

  return `${ENCRYPTION_PREFIX}:${ivB64}.${tagB64}.${dataB64}`;
}

export function decryptSecret(value: string): string {
  const raw = String(value ?? '');
  if (!raw) return '';
  if (!isEncryptedSecret(raw)) return raw;

  try {
    const payload = raw.slice(`${ENCRYPTION_PREFIX}:`.length);
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64) return '';

    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    const encrypted = Buffer.from(dataB64, 'base64url');

    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}
