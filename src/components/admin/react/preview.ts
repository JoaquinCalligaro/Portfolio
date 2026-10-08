// Abre la vista previa en una pestaña nueva: manda los borradores por POST a
// /admin/preview (no guarda nada). Es un form oculto, sin fetch ni estado.
//
// Los cambios sin guardar de TODAS las secciones se acumulan en sessionStorage
// (clave -> borrador): la vista previa los aplica juntos y el panel los
// restaura al volver a abrir la sección. Al guardar, el borrador se borra.
export type PreviewDraft = {
  section:
    | 'profile'
    | 'socialLinks'
    | 'techCategories'
    | 'techs'
    | 'education'
    | 'projects';
  id?: string;
  parentId?: string;
  values: Record<string, unknown>;
  hidden?: boolean;
};

const STORE_KEY = 'admin-preview-drafts';

type Store = Record<string, PreviewDraft>;

function readStore(): Store {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Sin storage la vista previa sigue funcionando con el borrador actual.
  }
}

// Reemplaza todos los borradores de un grupo (prefijo) por los que siguen sin
// guardar. Lista vacía = no queda nada pendiente en ese grupo.
export function syncDrafts(prefix: string, drafts: Record<string, PreviewDraft>) {
  const store = readStore();
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) delete store[key];
  }
  for (const [key, draft] of Object.entries(drafts)) {
    store[`${prefix}${key}`] = draft;
  }
  writeStore(store);
}

export function readDrafts(prefix: string): Record<string, PreviewDraft> {
  const out: Record<string, PreviewDraft> = {};
  for (const [key, draft] of Object.entries(readStore())) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = draft;
  }
  return out;
}

export function openPreview(draft: PreviewDraft) {
  // Los pendientes de otras secciones + el actual (el actual pisa al guardado).
  const others = Object.values(readStore()).filter(
    (d) =>
      !(d.section === draft.section && (d.id ?? '') === (draft.id ?? '') &&
        (d.parentId ?? '') === (draft.parentId ?? ''))
  );
  const drafts = [...others, draft];
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/admin/preview';
  form.target = '_blank';
  form.hidden = true;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'draft';
  input.value = JSON.stringify(drafts);
  form.append(input);
  document.body.append(form);
  form.submit();
  form.remove();
}
