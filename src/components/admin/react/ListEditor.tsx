import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { ItemCard } from './ItemCard';
import { MorphGlyph } from './MorphGlyph';
import { statusTransition } from './motion';
import { openPreview, type PreviewDraft } from './preview';
import {
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
