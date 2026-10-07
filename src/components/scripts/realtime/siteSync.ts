// Escucha cambios del contenido (vía Pusher) y refresca en vivo todos los
// contenedores marcados con data-realtime-sync="<nombre>", sin recargar la página.
import Pusher from 'pusher-js';

const KEY = import.meta.env.PUBLIC_PUSHER_KEY;
const CLUSTER = import.meta.env.PUBLIC_PUSHER_CLUSTER;

function executeScripts(container: Element) {
  container.querySelectorAll('script').forEach((oldScript) => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach((attr) =>
      newScript.setAttribute(attr.name, attr.value)
    );
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

let running = false;
let pending = false;

async function syncSite() {
  // Si llegan varios avisos juntos, se encadena una sola actualización más.
  if (running) {
    pending = true;
    return;
  }
  running = true;

  try {
    const res = await fetch(window.location.pathname + window.location.search, {
      cache: 'no-store',
    });
    const freshDoc = new DOMParser().parseFromString(
      await res.text(),
      'text/html'
    );

    let replaced = false;
    document.querySelectorAll('[data-realtime-sync]').forEach((current) => {
      const name = current.getAttribute('data-realtime-sync');
      const fresh = freshDoc.querySelector(`[data-realtime-sync="${name}"]`);
      if (!fresh) return;

      // Las tarjetas nuevas no necesitan la animación de entrada.
      fresh
        .querySelectorAll('.tech-card-enter')
        .forEach((el) => el.classList.remove('tech-card-enter'));

      current.replaceWith(fresh);
      executeScripts(fresh);
      replaced = true;
    });

    if (!replaced) return;

    if (freshDoc.title) document.title = freshDoc.title;

    // Re-aplica el idioma actual a los textos nuevos.
    window.dispatchEvent(
      new CustomEvent('langChange', {
        detail: document.documentElement.lang || 'ES',
      })
    );

    // Re-inicializa el botón "Ver todos" (sus listeners se pierden al reemplazar el DOM).
    const reinitShowMore = (window as unknown as Record<string, unknown>)
      .initShowMore as
      ((id: string, opts: Record<string, string>) => void) | undefined;
    if (typeof reinitShowMore === 'function') {
      reinitShowMore('show-more-projects', {
        targetId: 'extra-projects',
        hiddenClass: 'hidden',
      });
    }
  } catch (err) {
    console.error('[realtime] No se pudo actualizar en vivo', err);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      void syncSite();
    }
  }
}

if (KEY && CLUSTER) {
  // @ts-expect-error bandera global simple, no necesita tipado
  window.__REALTIME_SITE_ENABLED__ = true;

  // Cambios hechos desde esta misma pestaña: se actualiza al instante.
  window.addEventListener('site:changed', syncSite);

  // Cambios hechos desde otro dispositivo o pestaña: llegan por Pusher.
  const pusher = new Pusher(KEY, { cluster: CLUSTER });
  pusher.connection.bind('state_change', (states: { current: string }) => {
    console.info(`[realtime] conexión: ${states.current}`);
  });
  pusher.connection.bind('error', (err: unknown) => {
    console.error('[realtime] error de conexión', err);
  });

  const channel = pusher.subscribe('site');
  channel.bind('updated', () => {
    console.info('[realtime] cambio recibido, actualizando...');
    void syncSite();
  });
}
