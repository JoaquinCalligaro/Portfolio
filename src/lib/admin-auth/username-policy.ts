// Reglas del usuario del admin (puro, sin DB).
export function normalizeUsername(input: string): string | null {
  // Se permiten espacios sueltos entre palabras (se juntan los repetidos).
  const value = input.trim().replace(/ {2,}/g, ' ');
  return /^[a-zA-Z0-9._ -]{3,32}$/.test(value) ? value : null;
}
