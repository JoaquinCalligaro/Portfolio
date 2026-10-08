import { useCallback, useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: 'dark';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function whenReady(callback: () => void) {
  if (window.turnstile) return callback();
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }
  script.addEventListener('load', callback, { once: true });
}

export function useTurnstile(siteKey: string | undefined) {
  // Callback ref: el contenedor se desmonta en el paso del código 2FA y al
  // volver hay que dibujar el widget de nuevo en el div nuevo.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!siteKey || !container) return;
    let cancelled = false;
    whenReady(() => {
      if (cancelled || !window.turnstile) return;
      widgetId.current = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: 'dark',
        callback: setToken,
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    });
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
      setToken('');
    };
  }, [siteKey, container]);

  const reset = useCallback(() => {
    setToken('');
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, []);

  return { container: setContainer, token, reset };
}
