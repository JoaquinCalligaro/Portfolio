import { m } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { MotionRoot } from '@/components/admin/react/MotionRoot';
import { ICON_PATHS } from '@/components/admin/react/icons';
import { enterTransition } from '@/components/admin/react/motion';

// Cierra la pestaña de la vista previa; si el navegador no lo permite,
// vuelve al panel.
function closePreview() {
  window.close();
  window.setTimeout(() => {
    if (!window.closed) window.location.href = '/admin';
  }, 150);
}

export default function PreviewBanner() {
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
        <button
          type="button"
          onClick={closePreview}
          className="inline-flex min-h-8 shrink-0 cursor-pointer items-center rounded-md border border-cyan-400/40 px-3 text-xs font-medium text-cyan-200 transition-colors duration-500 hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          Cerrar vista previa
        </button>
      </m.div>
    </MotionRoot>
  );
}
