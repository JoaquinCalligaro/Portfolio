import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardClass } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { MorphGlyph } from './MorphGlyph';
import {
  SPRING,
  collapsed,
  enterTransition,
  expandTransition,
  expanded,
} from './motion';
import { isDirty, type EditorItem } from './useListEditor';

type ItemCardProps = {
  item: EditorItem;
  index: number;
  total: number;
  itemLabel: string;
  confirmText?: string;
  showHide: boolean;
  compact?: boolean;
  children: ReactNode;
  after?: ReactNode;
  onSave: () => void;
  onMove: (direction: -1 | 1) => void;
  onToggleHidden: () => void;
  onRemove: () => void;
};

const TONE = {
  info: 'text-gray-300',
  ok: 'text-emerald-300',
  error: 'text-red-300',
} as const;

export function ItemCard({
  item,
  index,
  total,
  itemLabel,
  confirmText,
  showHide,
  compact,
  children,
  after,
  onSave,
  onMove,
  onToggleHidden,
  onRemove,
}: ItemCardProps) {
  const body = useRef<HTMLDivElement>(null);
  const dirty = isDirty(item);

  useEffect(() => {
    if (!item.fresh) return;
    const el = body.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.querySelector<HTMLElement>('input:not([type=hidden]), textarea')?.focus({
      preventScroll: true,
    });
  }, [item.fresh]);

  return (
    <m.li
      layout="position"
      initial={{ ...collapsed, y: 16 }}
      animate={{ ...expanded, y: 0 }}
      exit={{ ...collapsed, transition: expandTransition }}
      transition={{ ...enterTransition, layout: SPRING }}
      className="list-none overflow-hidden px-0.5"
    >
      <article
        aria-label={`Tarjeta de ${itemLabel} ${index + 1}`}
        className={cn(
          cardClass,
          'mb-4 p-4 transition-opacity duration-500 sm:p-5',
          item.hidden && 'opacity-60'
        )}
      >
        <div ref={body} className={cn('space-y-3', compact && 'space-y-2')}>
          {children}
        </div>
        {after}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={onSave} disabled={!dirty || item.busy}>
            Guardar
          </Button>
          <span
            role="status"
            aria-live="polite"
            className={cn(
              'text-sm',
              item.status ? TONE[item.status.tone] : 'text-gray-300'
            )}
          >
            {item.status?.text ?? (dirty ? 'Cambios sin guardar' : '')}
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Subir"
                  aria-disabled={index === 0}
                  className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                  onClick={() => onMove(-1)}
                >
                  <MorphGlyph name="up" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Subir</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Bajar"
                  aria-disabled={index === total - 1}
                  className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                  onClick={() => onMove(1)}
                >
                  <MorphGlyph name="down" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bajar</TooltipContent>
            </Tooltip>
            {showHide && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-pressed={item.hidden}
                    aria-label={item.hidden ? 'Mostrar en el sitio' : 'Ocultar del sitio'}
                    onClick={onToggleHidden}
                  >
                    <MorphGlyph name={item.hidden ? 'eyeOff' : 'eye'} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {item.hidden ? 'Mostrar en el sitio' : 'Ocultar del sitio'}
                </TooltipContent>
              </Tooltip>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label={`Borrar ${itemLabel}`}
                  disabled={item.busy}
                >
                  <MorphGlyph name="trash" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Borrar {itemLabel}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirmText ?? `¿Borrar este ${itemLabel}? No se puede deshacer.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove}>Borrar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </span>
        </div>
      </article>
    </m.li>
  );
}
