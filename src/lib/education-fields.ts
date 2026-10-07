// Limpieza y traducción de los campos de una entrada de Educación.
import { UserError, defined, text } from './admin-api';
import { translateFields } from './translate';

export const EDUCATION_ICONS = ['university', 'work', 'certificate'] as const;

export async function educationData(body: Record<string, unknown>) {
  const iconKey = text(body, 'iconKey');
  if (
    iconKey !== undefined &&
    !(EDUCATION_ICONS as readonly string[]).includes(iconKey)
  ) {
    throw new UserError('El tipo de ícono no es válido');
  }

  const fields = defined({
    institution: text(body, 'institution'),
    datesEs: text(body, 'datesEs'),
    descriptionEs: text(body, 'descriptionEs'),
    iconKey,
  });
  const { data, warning } = await translateFields(fields, [
    'datesEs',
    'descriptionEs',
  ]);
  return { data: { ...fields, ...data }, warning };
}
