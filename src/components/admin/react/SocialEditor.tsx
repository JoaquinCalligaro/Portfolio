import { MotionRoot } from './MotionRoot';
import { ListEditor } from './ListEditor';
import { IconField } from './IconField';
import { TextField } from './fields';

export type SocialEntry = {
  id: string;
  label: string;
  url: string;
  iconSlug: string;
  iconUrl: string;
  hidden: boolean;
};

const BLANK = { label: '', url: '', iconSlug: '', iconUrl: '' };

export default function SocialEditor({ items }: { items: SocialEntry[] }) {
  return (
    <MotionRoot>
      <ListEditor
        endpoint="/api/admin/social-links"
        itemLabel="red social"
        addLabel="Agregar red social"
        emptyText="Todavía no agregaste ninguna red social."
        blank={BLANK}
        initial={items.map((item) => ({
          id: item.id,
          hidden: item.hidden,
          values: {
            label: item.label,
            url: item.url,
            iconSlug: item.iconSlug ?? '',
            iconUrl: item.iconUrl ?? '',
          },
        }))}
        renderFields={({ item, set }) => (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="Nombre de la red"
                value={String(item.values.label)}
                onValueChange={(v) => set('label', v)}
                placeholder="GitHub, LinkedIn, Instagram..."
              />
              <TextField
                label="Link"
                value={String(item.values.url)}
                onValueChange={(v) => set('url', v)}
                placeholder="https://..."
                inputMode="url"
                autoCapitalize="none"
              />
            </div>
            <IconField
              iconSlug={String(item.values.iconSlug)}
              iconUrl={String(item.values.iconUrl)}
              onChange={set}
            />
          </>
        )}
      />
    </MotionRoot>
  );
}
