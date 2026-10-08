// Aplica un borrador sobre los datos del sitio sin escribir en la base.
// Mismas reglas de visibilidad que loadSiteData y ProjectsGrid.
import type { SiteData } from '../site-data';
import type { Draft } from './types.ts';

export const PREVIEW_ID = 'preview-new';

type Row = { id: string; hidden?: boolean } & Record<string, unknown>;

// Sin traducción: el inglés copia al español para que la vista previa no
// muestre textos viejos en EN.
const EN_COPY: Record<string, string> = {
  headlineEs: 'headlineEn',
  datesEs: 'datesEn',
  descriptionEs: 'descriptionEn',
  titleEs: 'titleEn',
  nameEs: 'nameEn',
};

function withEn(values: Record<string, unknown>) {
  const out = { ...values };
  for (const [es, en] of Object.entries(EN_COPY)) {
    if (es in values) out[en] = values[es];
  }
  if ('bioEs' in values) out.bioEn = values.bioEs;
  return out;
}

// Edita por id o agrega al final (igual que nextPosition al crear).
function upsert<T extends Row>(
  list: T[],
  draft: Draft,
  defaults: Record<string, unknown>
): T[] {
  const values = { ...withEn(draft.values), hidden: draft.hidden ?? false };
  if (draft.id && list.some((item) => item.id === draft.id)) {
    return list.map((item) =>
      item.id === draft.id
        ? { ...item, ...withEn(draft.values), hidden: draft.hidden ?? item.hidden }
        : item
    );
  }
  return [
    ...list,
    { ...defaults, ...values, id: draft.id ?? PREVIEW_ID } as unknown as T,
  ];
}

export function applyDraft(data: SiteData, draft: Draft): SiteData {
  switch (draft.section) {
    case 'profile': {
      const base = (data.profile ?? {}) as Record<string, unknown>;
      return {
        ...data,
        profile: { ...base, ...withEn(draft.values) } as SiteData['profile'],
      };
    }
    case 'socialLinks': {
      const next = upsert(
        data.socialLinks as unknown as Row[],
        draft,
        { label: '', url: '', iconSlug: '', iconUrl: '' }
      );
      return {
        ...data,
        socialLinks: next.filter((l) => !l.hidden) as unknown as SiteData['socialLinks'],
      };
    }
    case 'education': {
      const next = upsert(
        data.education as unknown as Row[],
        draft,
        {
          institution: '',
          datesEs: '',
          datesEn: '',
          descriptionEs: '',
          descriptionEn: '',
          iconKey: 'university',
        }
      );
      return {
        ...data,
        education: next.filter((e) => !e.hidden) as unknown as SiteData['education'],
      };
    }
    case 'projects': {
      // Los proyectos ocultos se filtran en ProjectsGrid, no acá.
      const next = upsert(
        data.projects as unknown as Row[],
        draft,
        {
          titleEs: '',
          titleEn: '',
          descriptionEs: '',
          descriptionEn: '',
          repo: '',
          live: '',
          technologies: [],
          images: [],
          featured: false,
        }
      );
      return { ...data, projects: next as unknown as SiteData['projects'] };
    }
    case 'techCategories': {
      // La categoría ya viene del cliente con sus techs; al crear, queda vacía.
      const exists = data.techCategories.some((c) => c.id === draft.id);
      const categories = exists
        ? data.techCategories.map((c) =>
            c.id === draft.id ? { ...c, ...withEn(draft.values) } : c
          )
        : [
            ...data.techCategories,
            {
              id: draft.id ?? PREVIEW_ID,
              nameEs: '',
              nameEn: '',
              techs: [],
              ...withEn(draft.values),
            },
          ];
      return {
        ...data,
        techCategories: categories.filter(
          (c) => c.techs.length > 0
        ) as SiteData['techCategories'],
      };
    }
    case 'techs': {
      // loadSiteData ya sacó las categorías vacías y las techs ocultas, así que
      // una categoría sin techs visibles no está en `data`: la reconstruimos
      // solo si hace falta para mostrar la tech del borrador.
      const categories = data.techCategories.map((c) => ({ ...c }));
      const parentId =
        draft.parentId ??
        categories.find((c) => c.techs.some((t) => t.id === draft.id))?.id;
      const target = categories.find((c) => c.id === parentId);
      if (!target) return data;
      const techs = upsert(target.techs as unknown as Row[], draft, {
        name: '',
        iconSlug: '',
        iconUrl: '',
        color: '#06B6D4',
        categoryId: target.id,
      });
      target.techs = techs.filter(
        (t) => !t.hidden
      ) as unknown as typeof target.techs;
      return {
        ...data,
        techCategories: categories.filter((c) => c.techs.length > 0),
      };
    }
  }
}
