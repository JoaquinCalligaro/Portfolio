// "Editor de lista" compartido por todo el panel (Perfil, Tech Stack, Educación).
//
// Contrato de HTML (lo arman las páginas/componentes de src/components/admin):
//   <div data-list-editor data-endpoint="/api/admin/education" data-item-label="estudio">
//     <div data-list> <article data-card data-id="..."> ...campos con data-field... </article> </div>
//     <p data-empty>...</p>
//     <template data-card-template> <article data-card>...</article> </template>
//     <button data-action="add">+ Agregar estudio</button>
//   </div>
// Cada tarjeta tiene botones data-action="save|up|down|hide|delete" y un
// <span data-status>. Un editor puede estar anidado dentro de una tarjeta de
// otro editor (categorías -> tecnologías); cada uno maneja solo sus tarjetas.

export type ApiResult = {
  ok: boolean;
  error?: string;
  warning?: string;
  realtime?: { ok: boolean; error?: string };
  item?: Record<string, unknown> & { id?: string };
};

export type Adapter = {
  save(
    card: HTMLElement,
    values: Record<string, unknown>,
    id: string
  ): Promise<ApiResult>;
  remove(card: HTMLElement, id: string): Promise<ApiResult>;
  reorder(ids: string[]): Promise<ApiResult>;
  toggleHidden(card: HTMLElement, id: string, hidden: boolean): Promise<ApiResult>;
};

type FieldEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// ---------------------------------------------------------------- utilidades

export async function request(
  url: string,
  method: string,
  body?: unknown
): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as ApiResult;
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor' };
  }
}

export async function uploadFile(
  file: File,
  kind: 'image' | 'raw' = 'image'
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch(`/api/admin/upload?kind=${kind}&folder=assets`, {
      method: 'POST',
      body: fd,
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'No se pudo subir el archivo' };
  }
}

// Muestra avisos (traducción fallida, Pusher caído) en el banner del layout.
export function showMessages(result: ApiResult) {
  const banner = document.getElementById('admin-banner');
  if (!banner) return;
  const messages: string[] = [];
  if (result.warning) messages.push(result.warning);
  if (result.realtime && !result.realtime.ok) {
    messages.push(
      `El cambio se guardó, pero el aviso en vivo falló: ${result.realtime.error}`
    );
  }
  banner.textContent = messages.join(' ');
  banner.classList.toggle('hidden', messages.length === 0);

  // Si el sitio público tiene el sync en esta pestaña, se actualiza al instante.
  window.dispatchEvent(new Event('site:changed'));
}

export function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
}

export function initAutoGrow(scope: ParentNode) {
  scope.querySelectorAll('textarea').forEach((el) => {
    autoGrow(el);
    if (!el.dataset.grow) {
      el.dataset.grow = '1';
      el.addEventListener('input', () => autoGrow(el));
    }
  });
}

// Campos que pertenecen a esta tarjeta (no a editores anidados dentro).
function ownFields(card: HTMLElement): FieldEl[] {
  return Array.from(card.querySelectorAll<FieldEl>('[data-field]')).filter(
    (el) => el.closest('[data-card]') === card
  );
}

function readValue(el: FieldEl): unknown {
  if (el instanceof HTMLInputElement && el.type === 'checkbox') return el.checked;
  if (el instanceof HTMLInputElement && el.type === 'color' && el.dataset.auto === 'true') {
    return ''; // sin color elegido: el servidor usa el del ícono
  }
  return el.value;
}

export function readValues(card: HTMLElement): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const el of ownFields(card)) values[el.dataset.field as string] = readValue(el);
  return values;
}

function snapshot(card: HTMLElement) {
  return JSON.stringify(readValues(card));
}

function setStatus(card: HTMLElement, text: string, tone: 'info' | 'ok' | 'error' = 'info') {
  const el = Array.from(card.querySelectorAll<HTMLElement>('[data-status]')).find(
    (s) => s.closest('[data-card]') === card
  );
  if (!el) return;
  el.textContent = text;
  el.className =
    'text-sm ' +
    (tone === 'ok' ? 'text-emerald-400' : tone === 'error' ? 'text-red-400' : 'text-gray-400');
}

function button(card: HTMLElement, action: string) {
  return Array.from(card.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`)).find(
    (b) => b.closest('[data-card]') === card
  );
}

function cardId(card: HTMLElement) {
  return card.dataset.id ?? '';
}

// ---------------------------------------------------------- íconos y selects

const ICON_CDN = 'https://cdn.simpleicons.org/';

function updateIconPreview(card: HTMLElement) {
  const block = card.querySelector<HTMLElement>('[data-icon-block]');
  if (!block || block.closest('[data-card]') !== card) return;
  const img = block.querySelector<HTMLImageElement>('[data-icon-preview]');
  const hint = block.querySelector<HTMLElement>('[data-icon-hint]');
  const slug = block.querySelector<HTMLInputElement>('[data-field="iconSlug"]')?.value.trim();
  const url = block.querySelector<HTMLInputElement>('[data-field="iconUrl"]')?.value.trim();
  const clearBtn = block.querySelector<HTMLElement>('[data-action="clear-icon"]');
  if (!img) return;

  clearBtn?.classList.toggle('hidden', !url);
  const src = url || (slug ? `${ICON_CDN}${encodeURIComponent(slug.toLowerCase().replace(/[^a-z0-9]/g, ''))}` : '');
  img.classList.toggle('hidden', !src);
  hint?.classList.toggle('hidden', Boolean(src));
  if (src && img.getAttribute('src') !== src) {
    img.onerror = () => {
      img.classList.add('hidden');
      if (hint) {
        hint.textContent = 'No encontré ese ícono, subí una imagen';
        hint.classList.remove('hidden');
      }
    };
    img.onload = () => {
      if (hint) hint.textContent = 'Sin ícono';
    };
    img.setAttribute('src', src);
  }
}

function updateChoice(group: HTMLElement) {
  const input = group.querySelector<HTMLInputElement>('[data-field]');
  group.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
    const active = btn.dataset.choice === input?.value;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('border-cyan-400', active);
    btn.classList.toggle('bg-cyan-500/20', active);
    btn.classList.toggle('border-white/20', !active);
  });
}

// ------------------------------------------------------------------ adaptador

function restAdapter(root: HTMLElement): Adapter {
  const endpoint = root.dataset.endpoint ?? '';
  const parentField = root.dataset.parentField;

  const extra = () => {
    if (!parentField) return {};
    const parentCard = root.closest<HTMLElement>('[data-card]');
    return { [parentField]: parentCard ? cardId(parentCard) : '' };
  };

  return {
    save: (_card, values, id) =>
      id
        ? request(`${endpoint}/${id}`, 'PATCH', values)
        : request(endpoint, 'POST', { ...values, ...extra() }),
    remove: (_card, id) => request(`${endpoint}/${id}`, 'DELETE'),
    reorder: (ids) => request(`${endpoint}/reorder`, 'POST', { ids }),
    toggleHidden: (_card, id, hidden) => request(`${endpoint}/${id}`, 'PATCH', { hidden }),
  };
}

// Algunas páginas (ej. párrafos de la bio) reemplazan el adaptador por uno propio.
const customAdapters = new WeakMap<HTMLElement, Adapter>();
export function setAdapter(root: HTMLElement, adapter: Adapter) {
  customAdapters.set(root, adapter);
}

// --------------------------------------------------------------- el editor

type Editor = { root: HTMLElement; list: HTMLElement };

function cardsOf(editor: Editor): HTMLElement[] {
  return Array.from(editor.list.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-card')
  );
}

function refreshState(editor: Editor) {
  const cards = cardsOf(editor);
  const empty = editor.root.querySelector<HTMLElement>(':scope > [data-empty]');
  empty?.classList.toggle('hidden', cards.length > 0);

  cards.forEach((card, index) => {
    const up = button(card, 'up');
    const down = button(card, 'down');
    if (up) up.disabled = index === 0;
    if (down) down.disabled = index === cards.length - 1;

    const hidden = card.dataset.hidden === 'true';
    card.classList.toggle('opacity-60', hidden);
    const hideBtn = button(card, 'hide');
    if (hideBtn) hideBtn.textContent = hidden ? 'Mostrar' : 'Ocultar';

    // Lo que depende de que la tarjeta ya exista en la base (ej. tecnologías de una categoría).
    card.querySelectorAll<HTMLElement>('[data-requires-id]').forEach((el) => {
      if (el.closest('[data-card]') === card) {
        el.classList.toggle('hidden', !cardId(card));
      }
    });
  });
}

function updateDirty(card: HTMLElement) {
  const saveBtn = button(card, 'save');
  if (!saveBtn) return;
  const dirty = snapshot(card) !== card.dataset.snapshot;
  saveBtn.disabled = !dirty;
  if (dirty) setStatus(card, 'Cambios sin guardar');
  else if (!card.dataset.justSaved) setStatus(card, '');
}

function prepareCard(card: HTMLElement) {
  initAutoGrow(card);
  card.querySelectorAll<HTMLElement>('[data-choice-group]').forEach(updateChoice);
  updateIconPreview(card);
  card.dataset.snapshot = snapshot(card);
  const saveBtn = button(card, 'save');
  if (saveBtn) saveBtn.disabled = true;
}

function applyItem(card: HTMLElement, item: ApiResult['item']) {
  if (!item) return;
  if (item.id) card.dataset.id = String(item.id);
  // El servidor puede completar valores (ej. color del ícono, slug normalizado).
  for (const el of ownFields(card)) {
    const key = el.dataset.field as string;
    const value = item[key];
    if (typeof value === 'string' && el.value !== value && !(el instanceof HTMLInputElement && el.type === 'checkbox')) {
      el.value = value;
      if (el instanceof HTMLInputElement && el.type === 'color') el.dataset.auto = 'false';
    }
  }
  updateIconPreview(card);
}

async function runSave(editor: Editor, adapter: Adapter, card: HTMLElement) {
  const saveBtn = button(card, 'save');
  if (saveBtn) saveBtn.disabled = true;
  setStatus(card, 'Guardando…');
  const values = readValues(card);
  const result = await adapter.save(card, values, cardId(card));

  if (!result.ok) {
    setStatus(card, result.error || 'No se pudo guardar', 'error');
    if (saveBtn) saveBtn.disabled = false;
    return;
  }
  applyItem(card, result.item);
  card.dataset.snapshot = snapshot(card);
  card.dataset.justSaved = '1';
  setStatus(card, 'Guardado ✓', 'ok');
  setTimeout(() => {
    delete card.dataset.justSaved;
    if (snapshot(card) === card.dataset.snapshot) setStatus(card, '');
  }, 3000);
  showMessages(result);
  refreshState(editor);
}

async function persistOrder(editor: Editor, adapter: Adapter, card: HTMLElement) {
  const ids = cardsOf(editor).map(cardId).filter(Boolean);
  if (ids.length === 0) return;
  setStatus(card, 'Guardando…');
  const result = await adapter.reorder(ids);
  if (result.ok) {
    setStatus(card, 'Guardado ✓', 'ok');
    setTimeout(() => setStatus(card, ''), 2000);
    showMessages(result);
  } else {
    setStatus(card, result.error || 'No se pudo reordenar', 'error');
  }
}

function addCard(editor: Editor) {
  const tpl = editor.root.querySelector<HTMLTemplateElement>(':scope > template[data-card-template]');
  if (!tpl) return;
  const card = (tpl.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
  editor.list.appendChild(card);
  initEditors(card); // por si la tarjeta trae editores anidados
  prepareCard(card);
  refreshState(editor);
  const first =
    card.querySelector<HTMLElement>('[data-autofocus]') ??
    ownFields(card).find((el) => !(el instanceof HTMLInputElement && el.type === 'hidden'));
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  first?.focus({ preventScroll: true });
}

function setupEditor(root: HTMLElement) {
  if (root.dataset.editorReady) return;
  root.dataset.editorReady = '1';

  const list = root.querySelector<HTMLElement>(':scope > [data-list]');
  if (!list) return;
  const editor: Editor = { root, list };
  const adapter = () => customAdapters.get(root) ?? restAdapter(root);
  const label = root.dataset.itemLabel ?? 'elemento';

  cardsOf(editor).forEach(prepareCard);
  refreshState(editor);

  const ownCard = (target: EventTarget | null) => {
    const card = (target as HTMLElement | null)?.closest<HTMLElement>('[data-card]');
    return card && card.parentElement === list ? card : null;
  };

  root.addEventListener('input', (e) => {
    const card = ownCard(e.target);
    if (!card) return;
    const el = e.target as HTMLElement;
    if (el instanceof HTMLInputElement && el.type === 'color') el.dataset.auto = 'false';
    if (el.matches('[data-field="iconSlug"]')) updateIconPreview(card);
    updateDirty(card);
  });

  root.addEventListener('change', async (e) => {
    const card = ownCard(e.target);
    const el = e.target as HTMLElement;
    if (!card) return;

    // Subir una imagen como ícono.
    if (el instanceof HTMLInputElement && el.matches('[data-icon-file]') && el.files?.[0]) {
      setStatus(card, 'Subiendo imagen…');
      const up = await uploadFile(el.files[0]);
      el.value = '';
      if (!up.ok || !up.url) {
        setStatus(card, up.error || 'No se pudo subir la imagen', 'error');
        return;
      }
      const urlInput = card.querySelector<HTMLInputElement>('[data-field="iconUrl"]');
      if (urlInput) urlInput.value = up.url;
      updateIconPreview(card);
      updateDirty(card);
      return;
    }
    updateDirty(card);
  });

  root.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const addBtn = target.closest<HTMLElement>('[data-action="add"]');
    if (addBtn && addBtn.closest('[data-list-editor]') === root) {
      addCard(editor);
      return;
    }

    const card = ownCard(target);
    if (!card) return;

    const choice = target.closest<HTMLButtonElement>('[data-choice]');
    if (choice) {
      const group = choice.closest<HTMLElement>('[data-choice-group]');
      const input = group?.querySelector<HTMLInputElement>('[data-field]');
      if (group && input) {
        input.value = choice.dataset.choice ?? '';
        updateChoice(group);
        updateDirty(card);
      }
      return;
    }

    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (!actionBtn || actionBtn.closest('[data-card]') !== card) return;
    const action = actionBtn.dataset.action;

    if (action === 'clear-icon') {
      const urlInput = card.querySelector<HTMLInputElement>('[data-field="iconUrl"]');
      if (urlInput) urlInput.value = '';
      updateIconPreview(card);
      updateDirty(card);
    } else if (action === 'save') {
      await runSave(editor, adapter(), card);
    } else if (action === 'up' || action === 'down') {
      const sibling = action === 'up' ? card.previousElementSibling : card.nextElementSibling;
      if (!sibling) return;
      if (action === 'up') list.insertBefore(card, sibling);
      else list.insertBefore(sibling, card);
      refreshState(editor);
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await persistOrder(editor, adapter(), card);
    } else if (action === 'hide') {
      const hidden = card.dataset.hidden !== 'true';
      if (!cardId(card)) {
        card.dataset.hidden = String(hidden);
        refreshState(editor);
        return;
      }
      setStatus(card, 'Guardando…');
      const result = await adapter().toggleHidden(card, cardId(card), hidden);
      if (result.ok) {
        card.dataset.hidden = String(hidden);
        setStatus(card, '');
        refreshState(editor);
        showMessages(result);
      } else {
        setStatus(card, result.error || 'No se pudo guardar', 'error');
      }
    } else if (action === 'delete') {
      if (!confirm(root.dataset.confirm ?? `¿Borrar este ${label}? No se puede deshacer.`)) return;
      if (cardId(card)) {
        setStatus(card, 'Borrando…');
        const result = await adapter().remove(card, cardId(card));
        if (!result.ok) {
          setStatus(card, result.error || 'No se pudo borrar', 'error');
          return;
        }
        showMessages(result);
      }
      card.remove();
      refreshState(editor);
    }
  });
}

export function initEditors(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-list-editor]').forEach(setupEditor);
}
