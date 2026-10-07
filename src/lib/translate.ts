// Traduce texto de español a inglés con MyMemory (gratis, sin clave).
// Se usa al guardar un proyecto: el resultado queda en la base de datos.
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

  const parts: string[] = [];
  for (const chunk of splitIntoChunks(trimmed)) {
    parts.push(await translateChunk(chunk));
  }
  return parts.join('').trim();
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
