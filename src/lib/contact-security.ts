// Defensas del formulario de contacto: limpieza de texto, límite de envíos y captcha.
import { env } from './env';

export const LIMITS = { name: 50, email: 100, message: 1000 } as const;

// Convierte cualquier HTML en texto plano (el editor envía HTML).
export function toPlainText(input: string): string {
  return input
    .replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

// Para nombre y asunto: sin saltos de línea (evita inyectar cabeceras de mail).
export function toSingleLine(input: string): string {
  return toPlainText(input).replace(/[\r\n]+/g, ' ').trim();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidEmail(email: string): boolean {
  return (
    email.length <= LIMITS.email &&
    /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(email)
  );
}

// Límite de envíos por IP: 3 cada 10 minutos (memoria del servidor).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

// Verifica el captcha de Cloudflare Turnstile.
export async function verifyTurnstile(
  token: string,
  ip: string
): Promise<boolean> {
  const secret = env('TURNSTILE_SECRET_KEY');
  if (!secret) return true; // sin clave configurada no se exige (modo desarrollo)
  if (!token) return false;
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
