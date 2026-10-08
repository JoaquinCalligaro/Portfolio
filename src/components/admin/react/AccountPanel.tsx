import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TextField } from './fields';
import { needsReauth, request, type ApiResult } from './api';
import { MaskedEmail } from './MaskedEmail';
import { usePasswordPrompt } from './usePasswordPrompt';

type EmailState = {
  current: string;
  verified: boolean;
  mailerConfigured: boolean;
  pending: { email: string; expiresAt: string } | null;
};

const timeFormat = new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' });

export function AccountPanel({ username }: { username: string }) {
  const [currentUser, setCurrentUser] = useState(username);
  const [newUser, setNewUser] = useState('');
  const [email, setEmail] = useState<EmailState | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const prompt = usePasswordPrompt();

  const load = useCallback(async () => {
    const result = await request('/api/admin/email', 'GET');
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo cargar el mail de contacto');
      setEmail({
        current: '',
        verified: false,
        mailerConfigured: false,
        pending: null,
      });
      return;
    }
    setEmail({
      current: String(result.current ?? ''),
      verified: Boolean(result.verified),
      mailerConfigured: Boolean(result.mailerConfigured),
      pending: (result.pending as EmailState['pending']) ?? null,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const withReauth = async (
    run: (password?: string) => Promise<ApiResult>
  ): Promise<ApiResult> => {
    const first = await run();
    if (!needsReauth(first)) return first;
    const password = await prompt.ask();
    if (!password) return { ...first, error: 'Operación cancelada' };
    return run(password);
  };

  const changeUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await withReauth((password) =>
      request('/api/admin/username', 'POST', { username: newUser, password })
    );
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo cambiar el usuario');
      return;
    }
    setCurrentUser(String(result.username ?? newUser.trim()));
    setNewUser('');
    toast.success('Usuario actualizado');
  };

  const sendCode = async (target: string) => {
    setBusy(true);
    const result = await withReauth((password) =>
      request('/api/admin/email/request', 'POST', { email: target, password })
    );
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo enviar el código');
      return;
    }
    setNewEmail('');
    setCode('');
    toast.success(`Te enviamos un código a ${String(result.email ?? target)}`);
    await load();
  };

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await request('/api/admin/email/confirm', 'POST', { code });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo confirmar el código');
      if (result.status === 410) await load();
      return;
    }
    setCode('');
    toast.success('Mail actualizado');
    await load();
  };

  const cancel = async () => {
    setBusy(true);
    await request('/api/admin/email', 'DELETE');
    setBusy(false);
    setCode('');
    await load();
  };

  const pending = email?.pending ?? null;
  const mailerOff = email ? !email.mailerConfigured : false;

  return (
    <div className="space-y-8">
      <form onSubmit={changeUser} className="space-y-4" noValidate>
        <h2 className="m-0 text-lg font-semibold text-white">Usuario</h2>
        <p className="text-sm text-gray-300">
          Usuario actual: <strong>{currentUser || 'sin configurar'}</strong>
        </p>
        <TextField
          label="Usuario nuevo"
          value={newUser}
          onValueChange={setNewUser}
          autoComplete="username"
          hint="3 a 32 caracteres: letras, números, espacios, punto, guion o guion bajo."
        />
        <Button type="submit" disabled={!newUser.trim() || busy}>
          Cambiar usuario
        </Button>
      </form>

      <hr className="border-white/10" />

      <div className="space-y-4">
        <h2 className="m-0 text-lg font-semibold text-white">
          Mail de contacto
        </h2>
        {email === null ? (
          <Skeleton className="h-20" role="status" aria-label="Cargando mail" />
        ) : (
          <>
            {mailerOff && (
              <p className="text-sm text-amber-300">
                Falta <code>RESEND_API_KEY</code> en las variables de entorno;
                sin eso no se puede enviar el código.
              </p>
            )}
            <p className="text-sm text-gray-300">
              Mail actual: <MaskedEmail email={email.current} />
              {email.current && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${email.verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}
                >
                  {email.verified ? 'Verificado' : 'Sin verificar'}
                </span>
              )}
            </p>
            {pending ? (
              <form onSubmit={confirm} className="space-y-4" noValidate>
                <p className="text-sm text-gray-300">
                  Ingresá el código que enviamos a{' '}
                  <MaskedEmail email={pending.email} /> (vence a las{' '}
                  {timeFormat.format(new Date(pending.expiresAt))}).
                </p>
                <TextField
                  label="Código"
                  value={code}
                  onValueChange={setCode}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={code.length < 6 || busy}>
                    Confirmar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={mailerOff || busy}
                    onClick={() => void sendCode(pending.email)}
                  >
                    Reenviar código
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void cancel()}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendCode(newEmail);
                }}
                className="space-y-4"
                noValidate
              >
                <TextField
                  label="Mail nuevo"
                  type="email"
                  value={newEmail}
                  onValueChange={setNewEmail}
                  placeholder="tumail@gmail.com"
                  hint="Sin dominio propio en Resend, solo podés usar el mail con el que creaste la cuenta de Resend."
                />
                <Button
                  type="submit"
                  disabled={!newEmail.trim() || mailerOff || busy}
                >
                  Enviar código
                </Button>
              </form>
            )}
          </>
        )}
      </div>
      {prompt.dialog}
    </div>
  );
}
