// Notifica cambios en los proyectos vía Pusher para actualizar la web y el
// panel admin en tiempo real, sin que nadie tenga que recargar la página.
import Pusher from 'pusher';

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER;

export const isPusherConfigured = Boolean(
  PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER
);

const pusher = isPusherConfigured
  ? new Pusher({
      appId: PUSHER_APP_ID!,
      key: PUSHER_KEY!,
      secret: PUSHER_SECRET!,
      cluster: PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export async function notifyProjectsUpdated() {
  if (!pusher) {
    console.warn(
      '[realtime] Pusher no está configurado en el servidor (faltan PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET o PUSHER_CLUSTER en el .env)'
    );
    return;
  }
  try {
    await pusher.trigger('projects', 'updated', {});
    console.info('[realtime] aviso de cambio enviado a Pusher');
  } catch (err) {
    console.error('Error notificando el cambio en tiempo real', err);
  }
}
