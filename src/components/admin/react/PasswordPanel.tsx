import { useEffect, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { evaluatePassword } from '@/lib/admin-auth/password-strength';
import { MorphGlyph } from './MorphGlyph';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { request } from './api';
import { statusTransition } from './motion';

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type'
> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  error?: string;
  success?: string;
};

function PasswordField({
  label,
  value,
  onValueChange,
  hint,
  error,
  success,
  ...props
}: PasswordFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const [visible, setVisible] = useState(false);
  const message = error ?? success ?? hint;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          maxLength={128}
          spellCheck={false}
          autoCapitalize="none"
          className="pr-12"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-gray-400 transition-colors duration-500 hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none focus-visible:ring-inset"
        >
          <MorphGlyph name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={
            error
              ? 'text-sm text-red-300'
              : success
                ? 'flex items-center gap-1.5 text-xs text-cyan-300'
                : 'text-xs text-gray-400'
          }
        >
          {!error && success && <MorphGlyph name="check" size={14} />}
          {message}
        </p>
      )}
    </div>
  );
}

const formatWait = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
};

export function PasswordPanel({ username }: { username?: string }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);

  const strength = evaluatePassword(next, { username });
  const mismatch = confirm.length > 0 && confirm !== next;
  const matches = confirm.length > 0 && confirm === next;
  const sameAsCurrent = next.length > 0 && next === current.trim();
  const locked = waitSeconds > 0;
  const canSubmit =
    !busy &&
    !locked &&
    current.trim().length > 0 &&
    strength.acceptable &&
    matches &&
    !sameAsCurrent;

  useEffect(() => {
    if (waitSeconds <= 0) return;
    const timer = window.setTimeout(() => setWaitSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [waitSeconds]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = await request('/api/admin/password', 'POST', {
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm,
    });
    setBusy(false);
    if (!result.ok) {
      if (result.retryAfterSeconds) setWaitSeconds(result.retryAfterSeconds);
      setError(result.error ?? 'No se pudo cambiar la contraseña');
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    toast.success('Contraseña actualizada. Cerramos tus otras sesiones.');
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-5" noValidate>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
          <MorphGlyph name="lock" size={24} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-medium text-white">Cambiar contraseña</h2>
          <p className="text-sm text-gray-300">
            Al guardarla se cierran las sesiones abiertas en los demás
            dispositivos.
          </p>
        </div>
      </div>

      {username && (
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      )}

      <PasswordField
        label="Contraseña actual"
        name="current-password"
        autoComplete="current-password"
        value={current}
        onValueChange={setCurrent}
      />

      <div className="space-y-3">
        <PasswordField
          label="Contraseña nueva"
          name="new-password"
          autoComplete="new-password"
          value={next}
          onValueChange={setNext}
          error={
            sameAsCurrent
              ? 'La nueva tiene que ser distinta de la actual'
              : next !== next.trim()
                ? strength.problem
                : undefined
          }
        />
        <PasswordStrengthMeter password={next} strength={strength} />
      </div>

      <PasswordField
        label="Repetir contraseña nueva"
        name="confirm-password"
        autoComplete="new-password"
        value={confirm}
        onValueChange={setConfirm}
        error={mismatch ? 'Las contraseñas no coinciden' : undefined}
        success={matches ? 'Las contraseñas coinciden' : undefined}
      />

      <AnimatePresence initial={false}>
        {error && (
          <m.div
            key="error"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={statusTransition}
            className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2.5 text-sm text-red-200"
          >
            {error}
            {locked && (
              <span className="mt-0.5 block text-xs text-red-200/80">
                Podés volver a intentar en{' '}
                <span className="tabular-nums">{formatWait(waitSeconds)}</span>.
              </span>
            )}
          </m.div>
        )}
      </AnimatePresence>

      <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
        <MorphGlyph name="shield" />
        {busy ? 'Actualizando…' : 'Actualizar contraseña'}
      </Button>
    </form>
  );
}
