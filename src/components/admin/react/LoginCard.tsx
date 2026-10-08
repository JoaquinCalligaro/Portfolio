import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { MotionRoot } from './MotionRoot';
import { Reveal } from './Reveal';
import { TextField } from './fields';
import { MorphGlyph } from './MorphGlyph';
import { postForm, request } from './api';
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
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [code, setCode] = useState('');
  const [trust, setTrust] = useState(true);
  const [recovery, setRecovery] = useState(false);
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
    if (result.ok && result.needs2fa) {
      setBusy(null);
      setPassword('');
      setStep('code');
      return;
    }
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

  const backToPassword = () => {
    setStep('password');
    setCode('');
    setRecovery(false);
    setError('');
    turnstile.reset();
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy('password');
    const result = await request('/api/admin/2fa/verify', 'POST', { code, trust });
    if (result.ok) return enter();
    setBusy(null);
    setCode('');
    if (result.expired === true) {
      backToPassword();
      setError(result.error ?? '');
      return;
    }
    setError(
      result.status === 429
        ? lockedMessage(result.retryAfterSeconds)
        : (result.error ?? 'No pudimos verificar el código')
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
            <h1 className="text-2xl font-semibold text-white">
              {step === 'code' ? 'Verificación en dos pasos' : 'Entrar al panel'}
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              {step === 'code'
                ? recovery
                  ? 'Ingresá uno de tus códigos de recuperación.'
                  : 'Ingresá el código de 6 dígitos de tu app autenticadora.'
                : 'Solo para administrar tu portfolio.'}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="border-cyan-400/30">
            <CardContent>
              {step === 'code' ? (
                <form onSubmit={verify} className="space-y-4" noValidate>
                  <TextField
                    label={recovery ? 'Código de recuperación' : 'Código'}
                    inputMode={recovery ? 'text' : 'numeric'}
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={recovery ? 16 : 7}
                    autoFocus
                    required
                    value={code}
                    onValueChange={setCode}
                    placeholder={recovery ? 'XXXXX-XXXXX' : '123456'}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={trust}
                      onChange={(event) => setTrust(event.target.checked)}
                      className="size-4 accent-cyan-400"
                    />
                    Confiar en este dispositivo (no vuelve a pedir el código)
                  </label>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy !== null || !code.trim()}
                  >
                    {busy === 'password' ? 'Verificando…' : 'Verificar'}
                  </Button>
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      className="text-cyan-300 underline-offset-2 hover:underline"
                      onClick={() => {
                        setRecovery((current) => !current);
                        setCode('');
                        setError('');
                      }}
                    >
                      {recovery ? 'Usar la app' : 'Usar código de recuperación'}
                    </button>
                    <button
                      type="button"
                      className="text-gray-300 underline-offset-2 hover:underline"
                      onClick={backToPassword}
                    >
                      Volver
                    </button>
                  </div>
                </form>
              ) : (
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
              )}

              {passkeys && step === 'password' && (
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
