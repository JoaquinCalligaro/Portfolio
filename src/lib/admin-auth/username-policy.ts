// Reglas del usuario del admin (puro, sin DB).
export function normalizeUsername(input: string): string | null {
  const value = input.trim();
  return /^[a-zA-Z0-9._-]{3,32}$/.test(value) ? value : null;
}
