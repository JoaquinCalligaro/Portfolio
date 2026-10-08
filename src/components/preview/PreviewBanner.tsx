import { useState } from 'react';
import { m } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { MotionRoot } from '@/components/admin/react/MotionRoot';
import { ICON_PATHS } from '@/components/admin/react/icons';
import { enterTransition } from '@/components/admin/react/motion';
import { request } from '@/components/admin/react/api';

type RawDraft = {
  section: string;
  id?: string;
  parentId?: string;
  values: Record<string, unknown>;
  hidden?: boolean;
};

const ENDPOINTS: Record<string, { url: string; parentField?: string }> = {
  profile: { url: '/api/admin/profile' },
  socialLinks: { url: '/api/admin/social-links' },
  techCategories: { url: '/api/admin/tech-categories' },
  techs: { url: '/api/admin/techs', parentField: 'categoryId' },
  education: { url: '/api/admin/education' },
  projects: { url: '/api/admin/projects' },
};

// Guarda cada borrador con las mismas rutas que los formularios del panel.
async function saveDrafts(drafts: RawDraft[]) {
  const seen = new Set<string>();
  for (const draft of drafts) {
    const key = JSON.stringify(draft);
    if (seen.has(key)) continue;
    seen.add(key);
    const target = ENDPOINTS[draft.section];
    if (!target) continue;
    const body: Record<string, unknown> = { ...draft.values };
    if (draft.section === 'profile') {
      const result = await request(target.url, 'PATCH', body);
      if (!result.ok) return result.error ?? 'No se pudo guardar';
      continue;
    }
    if (typeof draft.hidden === 'boolean' && draft.id) body.hidden = draft.hidden;
    if (draft.id) {
      const result = await request(`${target.url}/${draft.id}`, 'PATCH', body);
      if (!result.ok) return result.error ?? 'No se pudo guardar';
    } else {
      if (target.parentField) body[target.parentField] = draft.parentId ?? '';
      const result = await request(target.url, 'POST', body);
      if (!result.ok) return result.error ?? 'No se pudo guardar';
    }
  }
  return null;
}


// Cierra la pestaña de la vista previa; si el navegador no lo permite,
// vuelve al panel.
function closePreview() {
  window.close();
  window.setTimeout(() => {
    if (!window.closed) window.location.href = '/admin';
  }, 150);
}

export default function PreviewBanner({ drafts = [] }: { drafts?: RawDraft[] }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');

  const save = async () => {
    setState('saving');
    setError('');
    const failure = await saveDrafts(drafts);
    if (failure) {
      setError(failure);
      setState('idle');
      return;
    }
    setState('saved');
    // Avisa al panel (otra pestaña) para que descarte lo que ya se guardó.
    try {
      const channel = new BroadcastChannel('admin-preview');
      channel.postMessage('saved');
      channel.close();
    } catch {
      // Sin BroadcastChannel el panel simplemente sigue mostrando el borrador.
    }
    window.setTimeout(closePreview, 900);
  };

  return (
    <MotionRoot>
      <m.div
        role="status"
        aria-live="polite"
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        transition={enterTransition}
        className="fixed inset-x-0 top-0 z-[60] flex h-11 items-center justify-between gap-3 border-b border-amber-400/30 bg-gray-950/85 px-4 text-sm text-gray-200 backdrop-blur-md"
      >
        <p className="m-0 flex min-w-0 items-center gap-2.5">
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400/60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
          </span>
          <MorphIcon
            icon={ICON_PATHS.eye}
            size={18}
            strokeWidth={1.75}
            reducedMotion="user"
            className="shrink-0 text-amber-300"
          />
          <span className="truncate">
            <strong className="font-semibold text-amber-300">
              Vista previa
            </strong>
            <span className="hidden text-gray-300 sm:inline">
              {' '}
              · Los cambios todavía no están publicados en el portfolio.
            </span>
            <span className="text-gray-300 sm:hidden"> · Borrador</span>
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
        {error && (
          <span role="alert" className="hidden max-w-60 truncate text-xs text-red-300 sm:inline">
            {error}
          </span>
        )}
        {drafts.length > 0 && (
          <button
            type="button"
            onClick={() => void save()}
            disabled={state !== 'idle'}
            className="inline-flex min-h-8 cursor-pointer items-center rounded-md bg-amber-400 px-3 text-xs font-semibold text-gray-950 transition-colors hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none disabled:cursor-default disabled:opacity-70"
          >
            {state === 'saving'
              ? 'Guardando…'
              : state === 'saved'
                ? '¡Guardado!'
                : 'Guardar cambios'}
          </button>
        )}
        <button
          type="button"
          onClick={closePreview}
          className="inline-flex min-h-8 shrink-0 cursor-pointer items-center rounded-md border border-cyan-400/40 px-3 text-xs font-medium text-cyan-200 transition-colors duration-500 hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          Cerrar vista previa
        </button>
        </div>
      </m.div>
    </MotionRoot>
  );
}
