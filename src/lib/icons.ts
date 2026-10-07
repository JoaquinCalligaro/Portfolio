// Búsqueda de íconos de Simple Icons (solo servidor). Sirve para validar el
// "nombre del ícono" que escribe el admin y para dibujar los íconos de las
// redes sin depender de un CDN.
import * as simpleIcons from 'simple-icons';

type SimpleIcon = { title: string; slug: string; hex: string; path: string };

let bySlug: Map<string, SimpleIcon> | null = null;

function index() {
  if (!bySlug) {
    bySlug = new Map();
    for (const value of Object.values(simpleIcons)) {
      const icon = value as Partial<SimpleIcon>;
      if (
        icon &&
        typeof icon.slug === 'string' &&
        typeof icon.path === 'string'
      ) {
        bySlug.set(icon.slug, icon as SimpleIcon);
      }
    }
  }
  return bySlug;
}

// Mismas reglas que Simple Icons para pasar un nombre ("Visual Studio Code")
// a slug ("visualstudiocode").
function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/&/g, 'and')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function findIcon(input: string): SimpleIcon | null {
  const icons = index();
  return (
    icons.get(input.trim().toLowerCase()) ?? icons.get(toSlug(input)) ?? null
  );
}
