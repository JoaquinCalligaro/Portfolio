// Traduce texto de español a inglés con MyMemory (gratis, sin clave).
// Se usa al guardar cualquier contenido del panel: el resultado queda en la base de datos.
const ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK = 450; // MyMemory acepta ~500 caracteres por pedido

function splitIntoChunks(text: string): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current && (current + sentence).length > MAX_CHUNK) {
      chunks.push(current);
      current = '';
    }
    current += sentence;
  }
  if (current) chunks.push(current);

  // Una oración sola puede superar el límite: se corta a la fuerza.
  return chunks.flatMap((chunk) =>
    chunk.length <= MAX_CHUNK
      ? [chunk]
      : (chunk.match(new RegExp(`.{1,${MAX_CHUNK}}`, 'gs')) ?? [chunk])
  );
}

async function translateChunk(text: string): Promise<string> {
  const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=es|en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory respondió ${res.status}`);

  const data = (await res.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };
  const translated = data.responseData?.translatedText;
  if (Number(data.responseStatus) !== 200 || !translated) {
    throw new Error(translated || 'MyMemory no devolvió traducción');
  }
  return translated;
}

export async function translateToEnglish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Se traduce por tramos y se unen con un espacio: MyMemory suele devolver
  // cada tramo sin el espacio final y, si no, las oraciones quedan pegadas.
  const parts: string[] = [];
  for (const chunk of splitIntoChunks(trimmed)) {
    if (!chunk.trim()) continue;
    parts.push((await translateChunk(chunk)).trim());
  }
  return parts.join(' ').trim();
}

// Si el servicio falla, no se pierde el proyecto: se guarda el texto original
// y se devuelve un aviso para mostrarlo en el panel.
export async function translateSafe(
  text: string
): Promise<{ text: string; warning?: string }> {
  try {
    return { text: await translateToEnglish(text) };
  } catch (err) {
    console.error('[translate] falló la traducción:', err);
    return {
      text,
      warning:
        'No se pudo traducir al inglés (se guardó el texto en español). Probá guardar de nuevo en un rato.',
    };
  }
}

// Traduce en paralelo los campos `xEs` indicados y devuelve los `xEn`
// correspondientes (el inglés nunca viene del cliente). Soporta texto y
// listas de textos (por ejemplo, los párrafos de la bio).
// `reuse` permite no volver a traducir textos que ya estaban traducidos.
export async function translateFields(
  input: Record<string, unknown>,
  fields: string[],
  reuse?: Map<string, string>
): Promise<{ data: Record<string, string | string[]>; warning?: string }> {
  const data: Record<string, string | string[]> = {};
  const warnings: string[] = [];

  const one = async (text: string) => {
    if (!text.trim()) return '';
    const cached = reuse?.get(text);
    if (cached !== undefined) return cached;
    const result = await translateSafe(text);
    if (result.warning) warnings.push(result.warning);
    return result.text;
  };

  await Promise.all(
    fields.map(async (field) => {
      const value = input[field];
      const target = field.replace(/Es$/, 'En');
      if (typeof value === 'string') {
        data[target] = await one(value);
      } else if (Array.isArray(value)) {
        data[target] = await Promise.all(value.map((v) => one(String(v))));
      }
    })
  );

  return { data, warning: warnings[0] };
}
