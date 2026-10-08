import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

// El secreto TOTP se guarda cifrado (AES-256-GCM): si alguien lee la base de
// datos, sin SESSION_SECRET no puede generar códigos. Formato: iv.tag.datos (base64url).
export function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(`admin-2fa:${secret}`).digest();
}

export function encryptSecret(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString('base64url'))
    .join('.');
}

export function decryptSecret(payload: string, secret: string): string {
  const [iv, tag, data] = payload
    .split('.')
    .map((part) => Buffer.from(part, 'base64url'));
  if (!iv || !tag || !data) throw new Error('INVALID_PAYLOAD');
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
