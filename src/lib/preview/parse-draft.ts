// Valida el borrador en el servidor con las mismas reglas que las rutas reales
// de /api/admin/* (sin traducir ni tocar la base).
import { findIcon } from '../icons.ts';
import { DRAFT_SECTIONS, DraftError } from './types.ts';
import type { Draft, DraftSection } from './types.ts';

export const MAX_DRAFT_BYTES = 256 * 1024;

const EDUCATION_ICONS = ['university', 'work', 'certificate'];
const HEX = /^#[0-9a-f]{6}$/i;
const DEFAULT_COLOR = '#06B6D4';

type Body = Record<string, unknown>;

const text = (b: Body, k: string) =>
  typeof b[k] === 'string' ? (b[k] as string).trim() : undefined;
const flag = (b: Body, k: string) =>
  typeof b[k] === 'boolean' ? (b[k] as boolean) : undefined;
const strings = (b: Body, k: string) =>
  Array.isArray(b[k])
    ? (b[k] as unknown[]).map((v) => String(v).trim()).filter(Boolean)
    : undefined;

function defined<T extends Body>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Body;
}

function required(value: string | undefined, message: string) {
  if (!value) throw new DraftError(message);
  return value;
}

// Solo http(s) para imágenes, repos, demos, foto y CV (bloquea javascript:).
function httpUrl(value: string | undefined, label: string) {
  if (!value) return value;
  if (!/^https?:\/\//i.test(value)) {
    throw new DraftError(`${label} tiene que empezar con http:// o https://`);
  }
  return value;
}

// Igual que safeUrl de admin-api: http(s), mailto y tel; un email suelto
// se convierte en mailto:.
function socialUrl(value: string) {
  const url = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(value)
    ? `mailto:${value}`
    : value;
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    throw new DraftError(
      'El link tiene que empezar con https://, mailto: o tel:'
    );
  }
  return url;
}

function iconFields(body: Body, withColor = false) {
  const slug = text(body, 'iconSlug');
  const url = httpUrl(text(body, 'iconUrl'), 'La imagen del ícono');
  const out: Body = {};
  let iconHex: string | undefined;
  if (url !== undefined) out.iconUrl = url;
  if (slug !== undefined) {
    if (!slug) out.iconSlug = '';
    else {
      const icon = findIcon(slug);
      if (icon) {
        out.iconSlug = icon.slug;
        iconHex = `#${icon.hex}`;
      } else if (!url) {
        throw new DraftError('No encontré ese ícono, subí una imagen');
      } else out.iconSlug = '';
    }
  }
  if (withColor) {
    const color = text(body, 'color');
    if (color) {
      if (!HEX.test(color)) throw new DraftError('El color no es válido');
      out.color = color.toUpperCase();
    } else if (color !== undefined || iconHex) {
      out.color = (iconHex ?? DEFAULT_COLOR).toUpperCase();
    }
  }
  return out;
}

const parsers: Record<DraftSection, (b: Body, isNew: boolean) => Body> = {
  profile: (b) =>
    defined({
      name: text(b, 'name'),
      headlineEs: text(b, 'headlineEs'),
      photoUrl: httpUrl(text(b, 'photoUrl'), 'La foto'),
      cvUrl: httpUrl(text(b, 'cvUrl'), 'El CV'),
      bioEs: strings(b, 'bioEs'),
    }),
  socialLinks: (b, isNew) => {
    const label = text(b, 'label');
    const url = text(b, 'url');
    if (isNew || label !== undefined)
      required(label, 'Poné el nombre de la red');
    if (isNew || url !== undefined) required(url, 'Poné el link de la red');
    return defined({
      label,
      url: url ? socialUrl(url) : undefined,
      ...iconFields(b),
    });
  },
  techCategories: (b, isNew) => {
    const nameEs = text(b, 'nameEs');
    if (isNew || nameEs !== undefined)
      required(nameEs, 'Poné el nombre de la categoría');
    return defined({ nameEs });
  },
  techs: (b, isNew) => {
    const name = text(b, 'name');
    if (isNew || name !== undefined)
      required(name, 'Poné el nombre de la tecnología');
    return defined({ name, ...iconFields(b, true) });
  },
  education: (b, isNew) => {
    const institution = text(b, 'institution');
    if (isNew) required(institution, 'Poné la institución');
    const iconKey = text(b, 'iconKey');
    if (iconKey !== undefined && !EDUCATION_ICONS.includes(iconKey)) {
      throw new DraftError('El tipo de ícono no es válido');
    }
    return defined({
      institution,
      datesEs: text(b, 'datesEs'),
      descriptionEs: text(b, 'descriptionEs'),
      iconKey,
    });
  },
  projects: (b, isNew) => {
    const titleEs = text(b, 'titleEs');
    const descriptionEs = text(b, 'descriptionEs');
    if (isNew || titleEs !== undefined)
      required(titleEs, 'El título no puede estar vacío');
    if (isNew || descriptionEs !== undefined)
      required(descriptionEs, 'La descripción no puede estar vacía');
    const images = strings(b, 'images');
    images?.forEach((img) => httpUrl(img, 'Las imágenes'));
    return defined({
      titleEs,
      descriptionEs,
      repo: httpUrl(text(b, 'repo'), 'El repo'),
      live: httpUrl(text(b, 'live'), 'El link de la demo'),
      technologies: strings(b, 'technologies'),
      images,
      featured: flag(b, 'featured'),
    });
  },
};

export function parseDrafts(raw: unknown): Draft[] {
  if (typeof raw !== 'string' || !raw) throw new DraftError('Falta el borrador');
  if (new TextEncoder().encode(raw).length > MAX_DRAFT_BYTES) {
    throw new DraftError('El borrador es demasiado grande', 413);
  }
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new DraftError('El borrador no es válido');
  }
  const list = Array.isArray(input) ? input : [input];
  if (list.length === 0 || list.length > 100) {
    throw new DraftError('El borrador no es válido');
  }
  return list.map((item) => parseDraft(JSON.stringify(item)));
}

export function parseDraft(raw: unknown): Draft {
  if (typeof raw !== 'string' || !raw) throw new DraftError('Falta el borrador');
  if (new TextEncoder().encode(raw).length > MAX_DRAFT_BYTES) {
    throw new DraftError('El borrador es demasiado grande', 413);
  }
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new DraftError('El borrador no es válido');
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new DraftError('El borrador no es válido');
  }
  const { section, id, parentId, values, hidden } = input as Body;
  if (!(DRAFT_SECTIONS as readonly unknown[]).includes(section)) {
    throw new DraftError('Sección desconocida');
  }
  const sec = section as DraftSection;
  const body =
    values && typeof values === 'object' && !Array.isArray(values)
      ? (values as Body)
      : {};
  const draftId = typeof id === 'string' && id ? id : undefined;
  const parent = typeof parentId === 'string' && parentId ? parentId : undefined;
  if (sec === 'techs' && !parent && !draftId) {
    throw new DraftError('Falta la categoría');
  }
  return {
    section: sec,
    id: draftId,
    parentId: parent,
    values: parsers[sec](body, !draftId),
    hidden: typeof hidden === 'boolean' ? hidden : flag(body, 'hidden'),
  };
}
