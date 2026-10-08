// Abre la vista previa en una pestaña nueva: manda el borrador por POST a
// /admin/preview (no guarda nada). Es un form oculto, sin fetch ni estado.
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

export function openPreview(draft: PreviewDraft) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/admin/preview';
  form.target = '_blank';
  form.hidden = true;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'draft';
  input.value = JSON.stringify(draft);
  form.append(input);
  document.body.append(form);
  form.submit();
  form.remove();
}
