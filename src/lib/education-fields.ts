// Limpieza y traducción de los campos de una entrada de Educación.
import { UserError, defined, text } from './admin-api';
import { translateFields } from './translate';

export const EDUCATION_ICONS = ['university', 'work', 'certificate'] as const;

const CERTIFICATE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
const CERTIFICATE_MAX_BYTES = 3 * 1024 * 1024;

// `certificate`: data URL nuevo, 'remove' para quitarlo, o vacío para no tocarlo.
function certificateFields(body: Record<string, unknown>) {
  const value = text(body, 'certificate');
  if (!value) return {};
  if (value === 'remove') return { certificateMime: '', certificateData: '' };
  const match = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match || !CERTIFICATE_TYPES.includes(match[1])) {
    throw new UserError('El certificado tiene que ser una imagen o un PDF');
  }
  if ((match[2].length * 3) / 4 > CERTIFICATE_MAX_BYTES) {
    throw new UserError('El certificado supera los 3 MB');
  }
  return { certificateMime: match[1], certificateData: match[2] };
}

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
  return {
    data: { ...fields, ...data, ...certificateFields(body) },
    warning,
  };
}
