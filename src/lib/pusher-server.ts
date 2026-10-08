// Notifica cambios en el contenido del sitio vía Pusher para actualizar la web y el
// panel admin en tiempo real, sin que nadie tenga que recargar la página.
import Pusher from 'pusher';
import { env } from './env';

const clean = (value: string | undefined) =>
  value?.trim().replace(/^["']|["']$/g, '') ?? '';

const config = {
  PUSHER_APP_ID: clean(env('PUSHER_APP_ID')),
  PUSHER_KEY: clean(env('PUSHER_KEY')),
  PUSHER_SECRET: clean(env('PUSHER_SECRET')),
  PUSHER_CLUSTER: clean(env('PUSHER_CLUSTER')),
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const isPusherConfigured = missing.length === 0;

const pusher = isPusherConfigured
  ? new Pusher({
      appId: config.PUSHER_APP_ID,
      key: config.PUSHER_KEY,
      secret: config.PUSHER_SECRET,
      cluster: config.PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

export type RealtimeResult = { ok: boolean; error?: string };

export async function notifySiteUpdated(): Promise<RealtimeResult> {
  if (!pusher) {
    const error = `Faltan en el .env del servidor: ${missing.join(', ')}`;
    console.warn(`[realtime] ${error}`);
    return { ok: false, error };
  }

  try {
    await pusher.trigger('site', 'updated', {});
    console.info('[realtime] aviso de cambio enviado a Pusher');
    return { ok: true };
  } catch (err) {
    const details = err as { message?: string; status?: number; body?: string };
    const error = [details.message, details.status, details.body]
      .filter(Boolean)
      .join(' - ');
    console.error('[realtime] Pusher rechazó el aviso:', error);
    return { ok: false, error };
  }
}
