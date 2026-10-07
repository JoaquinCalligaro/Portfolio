import { AnimatePresence, m } from 'framer-motion';
import { MotionRoot } from './MotionRoot';
import { ListEditor } from './ListEditor';
import { IconField } from './IconField';
import { TextField } from './fields';
import { Label } from '@/components/ui/shadcn/label';
import { collapsed, expandTransition, expanded } from './motion';

export type TechEntry = {
  id: string;
  name: string;
  color: string;
  iconSlug: string;
  iconUrl: string;
  hidden: boolean;
};

export type TechCategoryEntry = {
  id: string;
  nameEs: string;
  techs: TechEntry[];
};

const DEFAULT_COLOR = '#06b6d4';
const BLANK_TECH = { name: '', color: '', iconSlug: '', iconUrl: '' };

function TechList({ parentId, techs }: { parentId: string; techs: TechEntry[] }) {
  return (
    <ListEditor
      endpoint="/api/admin/techs"
      parentField="categoryId"
      parentId={parentId}
      itemLabel="tecnología"
      addLabel="Agregar tecnología"
      emptyText="Todavía no hay tecnologías en esta categoría."
      blank={BLANK_TECH}
      compact
      initial={techs.map((tech) => ({
        id: tech.id,
        hidden: tech.hidden,
        values: {
          name: tech.name,
          color: tech.color ?? '',
          iconSlug: tech.iconSlug ?? '',
          iconUrl: tech.iconUrl ?? '',
        },
      }))}
      renderFields={({ item, set }) => {
        const colorId = `color-${item.key}`;
        return (
          <>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <TextField
                label="Tecnología"
                value={String(item.values.name)}
                onValueChange={(v) => set('name', v)}
                placeholder="Docker, React, Figma..."
              />
              <div className="space-y-1.5">
                <Label htmlFor={colorId}>Color</Label>
                <input
                  id={colorId}
                  type="color"
                  value={String(item.values.color) || DEFAULT_COLOR}
                  onChange={(e) => set('color', e.target.value)}
                  className="block h-11 w-14 cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-1 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                />
              </div>
            </div>
            <IconField
              iconSlug={String(item.values.iconSlug)}
              iconUrl={String(item.values.iconUrl)}
              onChange={set}
            />
          </>
        );
      }}
    />
  );
}

export default function TechEditor({
  categories,
}: {
  categories: TechCategoryEntry[];
}) {
  return (
    <MotionRoot>
      <ListEditor
        endpoint="/api/admin/tech-categories"
        itemLabel="categoría"
        addLabel="Agregar categoría"
        emptyText="Todavía no agregaste ninguna categoría."
        confirmText="¿Borrar esta categoría y todas sus tecnologías? No se puede deshacer."
        showHide={false}
        blank={{ nameEs: '' }}
        initial={categories.map((category) => ({
          id: category.id,
          values: { nameEs: category.nameEs },
        }))}
        renderFields={({ item, set }) => (
          <TextField
            label="Categoría"
            value={String(item.values.nameEs)}
            onValueChange={(v) => set('nameEs', v)}
            placeholder="Front-end, Herramientas..."
          />
        )}
        renderAfter={(item) => (
          <AnimatePresence initial={false}>
            {item.id ? (
              <m.div
                key="techs"
                initial={collapsed}
                animate={expanded}
                exit={collapsed}
                transition={expandTransition}
                className="overflow-hidden"
              >
                <div className="mt-5 border-t border-white/10 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-200">
                    Tecnologías
                  </h3>
                  <TechList
                    parentId={item.id}
                    techs={categories.find((c) => c.id === item.id)?.techs ?? []}
                  />
                </div>
              </m.div>
            ) : (
              <m.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-gray-300"
              >
                Guardá la categoría para poder agregarle tecnologías.
              </m.p>
            )}
          </AnimatePresence>
        )}
      />
    </MotionRoot>
  );
}
