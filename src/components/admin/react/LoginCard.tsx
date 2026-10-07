import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { MotionRoot } from './MotionRoot';
import { Reveal } from './Reveal';
import { TextField } from './fields';
import { MorphGlyph } from './MorphGlyph';
import { postForm } from './api';
import { loginWithPasskey, supportsPasskeys } from './passkeyClient';
import { useTurnstile } from './useTurnstile';
import { statusTransition } from './motion';

const BAD_CAPTCHA = 'Completá la verificación antes de entrar.';

function lockedMessage(seconds?: number) {
  if (!seconds) return 'Demasiados intentos. Probá más tarde.';
  const minutes = Math.ceil(seconds / 60);
  return `Demasiados intentos. Probá de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
}

export default function LoginCard({ siteKey }: { siteKey?: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'password' | 'passkey' | null>(null);
  const [error, setError] = useState('');
  const [passkeys, setPasskeys] = useState(false);
  const turnstile = useTurnstile(siteKey);

  useEffect(() => setPasskeys(supportsPasskeys()), []);

  const enter = () => {
    window.location.href = '/admin';
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (siteKey && !turnstile.token) {
      setError(BAD_CAPTCHA);
      return;
    }
    setError('');
    setBusy('password');
    const form = new FormData();
    form.set('username', username);
    form.set('password', password);
    form.set('cf-turnstile-response', turnstile.token);
    const result = await postForm('/api/admin/login', form);
    if (result.ok) return enter();
    setBusy(null);
    setPassword('');
    turnstile.reset();
    setError(
      result.status === 429
        ? lockedMessage(result.retryAfterSeconds)
        : (result.error ?? 'Error al iniciar sesión')
    );
  };

  const usePasskey = async () => {
    setError('');
    setBusy('passkey');
    const result = await loginWithPasskey();
    if (result.ok) return enter();
    setBusy(null);
    setError(
      result.status === 429
        ? lockedMessage(result.retryAfterSeconds)
        : (result.error ?? 'No pudimos verificar tu dispositivo.')
    );
  };

  return (
    <MotionRoot>
      <div className="mx-auto w-full max-w-sm">
        <Reveal>
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <MorphGlyph name="shield" size={28} />
            </span>
            <h1 className="text-2xl font-semibold text-white">Entrar al panel</h1>
            <p className="mt-1 text-sm text-gray-300">
              Solo para administrar tu portfolio.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="border-cyan-400/30">
            <CardContent>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <TextField
                  label="Usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  value={username}
                  onValueChange={setUsername}
                />
                <TextField
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onValueChange={setPassword}
                />

                {siteKey && (
                  <div ref={turnstile.container} className="flex justify-center" />
                )}

                <AnimatePresence initial={false}>
                  {error && (
                    <m.p
                      key={error}
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={statusTransition}
                      className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200"
                    >
                      {error}
                    </m.p>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full" disabled={busy !== null}>
                  {busy === 'password' ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>

              {passkeys && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="h-px flex-1 bg-white/10" />o
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy !== null}
                    onClick={() => void usePasskey()}
                  >
                    <MorphGlyph name="fingerprint" />
                    {busy === 'passkey'
                      ? 'Esperando tu dispositivo…'
                      : 'Entrar con huella o Face ID'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </MotionRoot>
  );
}
