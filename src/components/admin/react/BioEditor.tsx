import { MotionRoot } from './MotionRoot';
import { ListEditor } from './ListEditor';
import { TextAreaField } from './fields';
import { request } from './api';
import type { Adapter, EditorItem } from './useListEditor';

const savedText = (item: EditorItem) => {
  try {
    return String((JSON.parse(item.saved) as { text?: string }).text ?? '');
  } catch {
    return '';
  }
};

const persist = (texts: string[]) =>
  request('/api/admin/profile', 'PATCH', {
    bioEs: texts.filter((text) => text.trim() !== ''),
  });

const adapter: Adapter = {
  save: async (item, items) => {
    const text = String(item.values.text ?? '').trim();
    if (!text) {
      return { ok: false, status: 400, error: 'Escribí algo antes de guardar' };
    }
    const result = await persist(
      items.map((i) => (i.key === item.key ? text : i.id ? savedText(i) : ''))
    );
    return result.ok
      ? { ...result, item: { id: item.id || `p${Date.now()}`, text } }
      : result;
  },
  remove: (item, items) =>
    persist(items.filter((i) => i.key !== item.key).map((i) => (i.id ? savedText(i) : ''))),
  reorder: (items) => persist(items.map((i) => (i.id ? savedText(i) : ''))),
  toggleHidden: async () => ({ ok: true, status: 200 }),
};

export default function BioEditor({ paragraphs }: { paragraphs: string[] }) {
  return (
    <MotionRoot>
      <ListEditor
        adapter={adapter}
        itemLabel="párrafo"
        addLabel="Agregar párrafo"
        emptyText="Todavía no escribiste ningún párrafo."
        showHide={false}
        blank={{ text: '' }}
        initial={paragraphs.map((text, index) => ({
          id: `p${index}`,
          values: { text },
        }))}
        renderFields={({ item, set }) => (
          <TextAreaField
            label="Párrafo"
            value={String(item.values.text)}
            onValueChange={(v) => set('text', v)}
            placeholder="Escribí un párrafo de tu biografía"
          />
        )}
      />
    </MotionRoot>
  );
}
