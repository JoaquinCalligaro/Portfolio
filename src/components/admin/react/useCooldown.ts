import { useCallback, useEffect, useState } from 'react';

// Congela un formulario mientras dura el bloqueo por demasiados intentos.
// Guarda el fin del bloqueo en sessionStorage para que recargar no lo saltee.
export function useCooldown(storageKey: string) {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const saved = Number(sessionStorage.getItem(storageKey));
      if (saved > Date.now()) setUntil(saved);
    } catch {
      // Sin storage disponible: el servidor igual mantiene el bloqueo.
    }
  }, [storageKey]);

  useEffect(() => {
    if (until <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(timer);
  }, [until, now]);

  const start = useCallback(
    (seconds?: number) => {
      if (!seconds || seconds <= 0) return;
      const end = Date.now() + seconds * 1000;
      setUntil(end);
      setNow(Date.now());
      try {
        sessionStorage.setItem(storageKey, String(end));
      } catch {
        // Ignorado: ver arriba.
      }
    },
    [storageKey]
  );

  const seconds = Math.max(0, Math.ceil((until - now) / 1000));
  return { seconds, locked: seconds > 0, start };
}

export const formatWait = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
};
