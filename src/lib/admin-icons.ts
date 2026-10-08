// Validación de ícono (slug de Simple Icons o imagen subida) y color para las
// redes y el tech stack.
import { findIcon } from './icons';
import { UserError, text } from './admin-api';

const DEFAULT_COLOR = '#06B6D4';
const HEX = /^#[0-9a-f]{6}$/i;

export function iconFields(
  body: Record<string, unknown>,
  options: { withColor?: boolean } = {}
) {
  const slug = text(body, 'iconSlug');
  const url = text(body, 'iconUrl');
  const out: { iconSlug?: string; iconUrl?: string; color?: string } = {};
  let iconHex: string | undefined;

  if (url !== undefined) out.iconUrl = url;

  if (slug !== undefined) {
    if (!slug) {
      out.iconSlug = '';
    } else {
      const icon = findIcon(slug);
      if (icon) {
        out.iconSlug = icon.slug;
        iconHex = `#${icon.hex}`;
      } else if (!url) {
        // Si hay imagen subida, el slug no hace falta y no se valida.
        throw new UserError('No encontré ese ícono, subí una imagen');
      } else {
        out.iconSlug = '';
      }
    }
  }

  if (options.withColor) {
    const color = text(body, 'color');
    if (color) {
      if (!HEX.test(color)) throw new UserError('El color no es válido');
      out.color = color.toUpperCase();
    } else if (color !== undefined || iconHex) {
      // Sin color elegido: se usa el del ícono (o uno por defecto).
      out.color = (iconHex ?? DEFAULT_COLOR).toUpperCase();
    }
  }
  return out;
}
