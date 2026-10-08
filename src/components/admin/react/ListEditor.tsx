import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { ItemCard } from './ItemCard';
import { MorphGlyph } from './MorphGlyph';
import { statusTransition } from './motion';
import {
  openPreview,
  readDrafts,
  syncDrafts,
  type PreviewDraft,
} from './preview';
import {
  isDirty,
  useListEditor,
  type Adapter,
  type EditorItem,
  type InitialItem,
  type Values,
} from './useListEditor';

export type FieldContext = {
  item: EditorItem;
  set: (field: string, value: string | boolean) => void;
};

type ListEditorProps = {
  endpoint?: string;
  parentField?: string;
  parentId?: string;
  adapter?: Adapter;
  blank: Values;
  initial: InitialItem[];
  itemLabel: string;
  addLabel: string;
  emptyText: string;
  confirmText?: string;
  showHide?: boolean;
  compact?: boolean;
  renderFields: (context: FieldContext) => ReactNode;
  renderAfter?: (item: EditorItem) => ReactNode;
  // Sección que se previsualiza con el botón "Previsualizar" de cada tarjeta.
  previewSection?: PreviewDraft['section'];
  // Arma el borrador a mano (cuando una tarjeta no equivale a un registro).
  buildPreview?: (item: EditorItem, items: EditorItem[]) => PreviewDraft;
};

export function ListEditor({
  endpoint,
  parentField,
  parentId,
  adapter,
  blank,
  initial,
  itemLabel,
  addLabel,
  emptyText,
  confirmText,
  showHide = true,
  compact,
  renderFields,
  renderAfter,
  previewSection,
  buildPreview,
}: ListEditorProps) {
  const editor = useListEditor({
    endpoint,
    parentField,
    parentId,
    adapter,
    blank,
    initial,
  });

  const toDraft = (
    item: EditorItem,
    items: EditorItem[]
  ): PreviewDraft | null =>
    buildPreview
      ? buildPreview(item, items)
      : previewSection
        ? {
            section: previewSection,
            id: item.id || undefined,
            parentId: parentId || undefined,
            values: item.values,
            hidden: item.hidden,
          }
        : null;

  // Cambios sin guardar de este editor (compartidos con la vista previa).
  const prefix = `${previewSection ?? 'bio'}:${parentId ?? ''}:`;
  const restored = useRef(false);

  useEffect(() => {
    // Con borrador armado a mano (biografía) las tarjetas viajan en `items`.
    const drafts = Object.values(readDrafts(prefix));
    const entries = buildPreview
      ? (drafts.find((d) => d.items)?.items ?? [])
      : drafts;
    restored.current = true;
    editor.restore(
      entries.map((d) => ({
        id: d.id ?? '',
        values: d.values as Values,
        hidden: d.hidden,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  useEffect(() => {
    if (!restored.current) return;
    const pending: Record<string, PreviewDraft> = {};
    const blankKey = JSON.stringify(blank);
    const touched = editor.items.filter((item) =>
      item.fresh ? JSON.stringify(item.values) !== blankKey : isDirty(item)
    );
    const items = touched.map((item) => ({
      id: item.id,
      values: item.values,
      hidden: item.hidden,
    }));
    for (const item of touched) {
      const draft = toDraft(item, editor.items);
      if (draft) {
        pending[item.id || item.key] = buildPreview
          ? { ...draft, items }
          : draft;
      }
    }
    syncDrafts(prefix, pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.items, prefix]);

  return (
    <div>
      <AnimatePresence initial={false}>
        {editor.items.length === 0 && (
          <m.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={statusTransition}
            className="mb-4 rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-gray-300"
          >
            {emptyText}
          </m.p>
        )}
      </AnimatePresence>
      <ul className="m-0 p-0">
        <AnimatePresence initial={false}>
          {editor.items.map((item, index) => (
            <ItemCard
              key={item.key}
              item={item}
              index={index}
              total={editor.items.length}
              itemLabel={itemLabel}
              confirmText={confirmText}
              showHide={showHide}
              compact={compact}
              after={renderAfter?.(item)}
              onPreview={
                previewSection || buildPreview
                  ? () =>
                      openPreview(
                        buildPreview
                          ? buildPreview(item, editor.items)
                          : {
                              section: previewSection!,
                              id: item.id || undefined,
                              parentId: parentId || undefined,
                              values: item.values,
                              hidden: item.hidden,
                            }
                      )
                  : undefined
              }
              onSave={() => void editor.save(item.key)}
              onMove={(direction) => void editor.move(item.key, direction)}
              onToggleHidden={() => void editor.toggleHidden(item.key)}
              onRemove={() => void editor.remove(item.key)}
            >
              {renderFields({
                item,
                set: (field, value) => editor.setField(item.key, field, value),
              })}
            </ItemCard>
          ))}
        </AnimatePresence>
      </ul>
      <Button
        variant="outline"
        onClick={editor.add}
        className="min-h-14 w-full border-2 border-dashed border-cyan-400/40 text-base text-cyan-300 hover:bg-cyan-500/10"
      >
        <MorphGlyph name="plus" />
        {addLabel}
      </Button>
    </div>
  );
}
