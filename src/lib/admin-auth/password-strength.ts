// Evaluación de fortaleza de contraseñas. Es un módulo puro: lo usa el panel
// para el medidor en vivo y el servidor para validar de verdad al cambiarla.

export const MIN_LENGTH = 12;
export const MAX_LENGTH = 128;
export const MIN_ACCEPTABLE_SCORE = 3;

export type Score = 0 | 1 | 2 | 3 | 4;

export const SCORE_LABELS: Record<Score, string> = {
  0: 'Muy débil',
  1: 'Débil',
  2: 'Aceptable',
  3: 'Fuerte',
  4: 'Muy fuerte',
};

export type PasswordCheck = {
  id: 'length' | 'mixedCase' | 'number' | 'symbol' | 'noUsername' | 'noPattern';
  label: string;
  passed: boolean;
  // Los requeridos bloquean el cambio; los demás solo suman puntos.
  required: boolean;
};

export type PasswordStrength = {
  score: Score;
  label: string;
  checks: PasswordCheck[];
  acceptable: boolean;
  // Primer motivo por el que no se acepta (para mostrarlo al usuario).
  problem?: string;
};

// Palabras y secuencias típicas. Se buscan dentro de la contraseña ya
// normalizada (minúsculas, sin tildes y con los reemplazos 0→o, 4→a, etc.).
const COMMON_TOKENS = [
  'password',
  'contrasena',
  'clave',
  'admin',
  'administrador',
  'qwerty',
  'letmein',
  'welcome',
  'bienvenido',
  'portfolio',
  'portafolio',
  'secret',
  'secreto',
  'iloveyou',
  'monkey',
  'dragon',
  'login',
  'master',
  'abc123',
  '123456',
  '111111',
  '000000',
  'argentina',
  'futbol',
];

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  '!': 'i',
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[013457@$!]/g, (ch) => LEET[ch] ?? '')
    .replace(/[^a-z0-9]/g, '');
}

function hasCommonToken(password: string): boolean {
  // Se prueba la versión sin reemplazos (para "123456") y la normalizada.
  const plain = password.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const leet = normalize(password);
  return COMMON_TOKENS.some((token) => {
    const tokenLeet = normalize(token);
    return plain.includes(token) || leet.includes(tokenLeet);
  });
}

function hasSequence(password: string): boolean {
  const lower = password.toLowerCase();
  for (let i = 0; i + 4 <= lower.length; i++) {
    const chunk = lower.slice(i, i + 4);
    const reversed = [...chunk].reverse().join('');
    if (KEYBOARD_ROWS.some((row) => row.includes(chunk) || row.includes(reversed))) {
      return true;
    }
    const codes = [...chunk].map((ch) => ch.charCodeAt(0));
    const step = codes[1] - codes[0];
    if (
      Math.abs(step) === 1 &&
      codes.every((code, idx) => idx === 0 || code - codes[idx - 1] === step)
    ) {
      return true;
    }
  }
  return false;
}

function hasRepeat(password: string): boolean {
  return /(.)\1{3,}/su.test(password) || /^(.{1,3})\1{3,}$/su.test(password);
}

function poolSize(password: string): number {
  let pool = 0;
  if (/\p{Ll}/u.test(password)) pool += 26;
  if (/\p{Lu}/u.test(password)) pool += 26;
  if (/\p{Nd}/u.test(password)) pool += 10;
  if (/[^\p{L}\p{N}]/u.test(password)) pool += 33;
  return pool;
}

// Entropía aproximada en bits. Los caracteres repetidos aportan la mitad.
function entropyBits(password: string): number {
  const chars = [...password];
  const unique = new Set(chars).size;
  const effective = unique + (chars.length - unique) * 0.5;
  const pool = poolSize(password);
  return pool === 0 ? 0 : effective * Math.log2(pool);
}

function scoreFromBits(bits: number): Score {
  if (bits < 28) return 0;
  if (bits < 40) return 1;
  if (bits < 60) return 2;
  if (bits < 80) return 3;
  return 4;
}

export function evaluatePassword(
  password: string,
  options: { username?: string } = {}
): PasswordStrength {
  const length = [...password].length;
  const username = (options.username ?? '').trim().toLowerCase();
  const usesUsername =
    username.length >= 3 && password.toLowerCase().includes(username);
  const common = hasCommonToken(password);
  const sequence = hasSequence(password);
  const repeat = hasRepeat(password);
  const hasPattern = common || sequence || repeat;

  let bits = entropyBits(password);
  if (sequence || repeat) bits *= 0.7;
  let score = length === 0 ? 0 : scoreFromBits(bits);
  if (length > 0 && length < MIN_LENGTH) score = Math.min(score, 1) as Score;
  if (common || usesUsername) score = Math.min(score, 1) as Score;

  const checks: PasswordCheck[] = [
    {
      id: 'length',
      label: `${MIN_LENGTH} caracteres o más`,
      passed: length >= MIN_LENGTH,
      required: true,
    },
    {
      id: 'noPattern',
      label: 'Sin palabras comunes ni secuencias',
      passed: length > 0 && !hasPattern,
      required: true,
    },
    ...(username.length >= 3
      ? [
          {
            id: 'noUsername' as const,
            label: 'No incluye tu usuario',
            passed: length > 0 && !usesUsername,
            required: true,
          },
        ]
      : []),
    {
      id: 'mixedCase',
      label: 'Mayúsculas y minúsculas',
      passed: /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password),
      required: false,
    },
    {
      id: 'number',
      label: 'Un número',
      passed: /\p{Nd}/u.test(password),
      required: false,
    },
    {
      id: 'symbol',
      label: 'Un símbolo',
      passed: /[^\p{L}\p{N}]/u.test(password),
      required: false,
    },
  ];

  let problem: string | undefined;
  if (password !== password.trim()) {
    problem = 'No puede empezar ni terminar con espacios';
  } else if (length < MIN_LENGTH) {
    problem = `Tiene que tener al menos ${MIN_LENGTH} caracteres`;
  } else if (length > MAX_LENGTH) {
    problem = `No puede superar los ${MAX_LENGTH} caracteres`;
  } else if (usesUsername) {
    problem = 'No puede incluir tu nombre de usuario';
  } else if (hasPattern) {
    problem = 'Evitá palabras comunes, secuencias y repeticiones';
  } else if (score < MIN_ACCEPTABLE_SCORE) {
    problem = 'Es demasiado débil: sumá longitud o más tipos de caracteres';
  }

  return {
    score,
    label: SCORE_LABELS[score],
    checks,
    acceptable: problem === undefined,
    problem,
  };
}
