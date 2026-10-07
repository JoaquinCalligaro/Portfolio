// Escucha cambios en los proyectos (vía Pusher) y refresca en vivo el
// contenedor marcado con data-realtime-sync="projects", sin recargar la página.
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

async function syncProjects() {
  const current = document.querySelector('[data-realtime-sync="projects"]');
  if (!current) return;

  try {
    const res = await fetch(window.location.pathname + window.location.search, {
      cache: 'no-store',
    });
    const html = await res.text();
    const fresh = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector('[data-realtime-sync="projects"]');

    if (fresh) {
      current.replaceWith(fresh);
      executeScripts(fresh);

      // Re-inicializar el botón "Ver más" (si existe en este contenedor),
      // ya que sus listeners se pierden al reemplazar el DOM.
      const reinitShowMore = (window as unknown as Record<string, unknown>)
        .initShowMore as
        | ((id: string, opts: Record<string, string>) => void)
        | undefined;
      if (typeof reinitShowMore === 'function') {
        reinitShowMore('show-more-projects', {
          targetId: 'extra-projects',
          hiddenClass: 'hidden',
        });
      }
    }
  } catch (err) {
    console.error('No se pudo actualizar en tiempo real', err);
  }
}

if (KEY && CLUSTER) {
  // @ts-expect-error bandera global simple, no necesita tipado
  window.__REALTIME_PROJECTS_ENABLED__ = true;
  const pusher = new Pusher(KEY, { cluster: CLUSTER });
  const channel = pusher.subscribe('projects');
  channel.bind('updated', syncProjects);
}
