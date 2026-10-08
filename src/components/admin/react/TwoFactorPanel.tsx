import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cardClass } from '@/components/ui/shadcn/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { TextField } from './fields';
import { MorphGlyph } from './MorphGlyph';
import { needsReauth, request, type ApiResult } from './api';
import { usePasswordPrompt } from './usePasswordPrompt';

type Device = {
  id: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
};

type Status = { enabled: boolean; recoveryLeft: number; devices: Device[] };

type Setup = { secret: string; uri: string; qr: string };

const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
const formatDate = (value: string) => dateFormat.format(new Date(value));

// "Mozilla/5.0 (Windows NT 10.0…) Chrome/120" -> "Chrome en Windows"
function describeDevice(userAgent: string) {
  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : 'Navegador';
  const system =
    /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Windows/.test(userAgent) ? 'Windows'
    : /Mac OS/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : '';
  return system ? `${browser} en ${system}` : browser;
}

export function TwoFactorPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const prompt = usePasswordPrompt();

  const load = useCallback(async () => {
    const result = await request('/api/admin/2fa', 'GET');
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo cargar el 2FA');
      setStatus({ enabled: false, recoveryLeft: 0, devices: [] });
      return;
    }
    setStatus({
      enabled: result.enabled as boolean,
      recoveryLeft: result.recoveryLeft as number,
      devices: result.devices as Device[],
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

  const startSetup = async () => {
    setBusy(true);
    const result = await withReauth((password) =>
      request('/api/admin/2fa/setup', 'POST', { password })
    );
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo iniciar la configuración');
      return;
    }
    const qr = await QRCode.toDataURL(result.uri as string, { margin: 1, width: 224 });
    setCode('');
    setSetup({ secret: result.secret as string, uri: result.uri as string, qr });
  };

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await request('/api/admin/2fa/enable', 'POST', { code });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo activar el 2FA');
      return;
    }
    setSetup(null);
    setRecoveryCodes(result.recoveryCodes as string[]);
    await load();
  };

  const regenerate = async () => {
    const result = await withReauth((password) =>
      request('/api/admin/2fa/recovery-codes', 'POST', { password })
    );
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudieron generar los códigos');
      return;
    }
    setRecoveryCodes(result.recoveryCodes as string[]);
    await load();
  };

  const disable = async () => {
    const result = await withReauth((password) =>
      request('/api/admin/2fa/disable', 'POST', { password })
    );
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo desactivar el 2FA');
      return;
    }
    toast.success('2FA desactivado');
    await load();
  };

  const forget = async (body: { id: string } | { all: true }) => {
    const result = await request('/api/admin/2fa/devices', 'DELETE', body);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo olvidar el dispositivo');
      return;
    }
    toast.success('Listo: va a pedir el código en el próximo ingreso');
    await load();
  };

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes?.join('\n') ?? '');
      toast.success('Códigos copiados');
    } catch {
      toast.error('No se pudo copiar. Seleccionalos a mano.');
    }
  };

  if (status === null) {
    return (
      <div className="space-y-3" role="status" aria-label="Cargando 2FA">
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300">
        Además de la contraseña, te pedimos un código de 6 dígitos de una app
        autenticadora (Google Authenticator, Authy, 1Password). Se pide una sola
        vez por dispositivo; el acceso con huella o Face ID no lo necesita.
      </p>

      {!status.enabled ? (
        <Button disabled={busy} onClick={() => void startSetup()}>
          <MorphGlyph name="shield" />
          Activar verificación en dos pasos
        </Button>
      ) : (
        <>
          <div className={`${cardClass} flex flex-wrap items-center gap-3 p-4`}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <MorphGlyph name="shield" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">2FA activado</p>
              <p className="text-xs text-gray-300">
                Te quedan {status.recoveryLeft} códigos de recuperación.
              </p>
            </div>
            <Button variant="outline" onClick={() => void regenerate()}>
              Generar códigos nuevos
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Desactivar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desactivar 2FA</AlertDialogTitle>
                  <AlertDialogDescription>
                    El login volverá a pedir solo la contraseña y se olvidan
                    todos los dispositivos de confianza.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void disable()}>
                    Desactivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-white">
                Dispositivos de confianza
              </h3>
              {status.devices.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void forget({ all: true })}
                >
                  Olvidar todos
                </Button>
              )}
            </div>
            {status.devices.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-gray-300">
                Ningún dispositivo todavía. Tildá “Confiar en este dispositivo”
                al ingresar el código.
              </p>
            ) : (
              <ul className="m-0 space-y-3 p-0">
                {status.devices.map((device) => (
                  <li
                    key={device.id}
                    className={`${cardClass} flex list-none flex-wrap items-center gap-3 p-4`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {describeDevice(device.userAgent)}
                        {device.current ? ' (este dispositivo)' : ''}
                      </p>
                      <p className="text-xs text-gray-300">
                        Agregado {formatDate(device.createdAt)} · Último uso{' '}
                        {formatDate(device.lastUsedAt)} · Vence{' '}
                        {formatDate(device.expiresAt)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`Olvidar ${describeDevice(device.userAgent)}`}
                      onClick={() => void forget({ id: device.id })}
                    >
                      <MorphGlyph name="trash" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Dialog open={setup !== null} onOpenChange={(open) => !busy && !open && setSetup(null)}>
        <DialogContent>
          <form onSubmit={confirm}>
            <DialogHeader>
              <DialogTitle>Activar 2FA</DialogTitle>
              <DialogDescription>
                Escaneá el QR con tu app autenticadora y escribí el código de 6
                dígitos que te muestra.
              </DialogDescription>
            </DialogHeader>
            {setup && (
              <div className="space-y-3 py-2">
                <img
                  src={setup.qr}
                  alt="Código QR para la app autenticadora"
                  width={224}
                  height={224}
                  className="mx-auto rounded-lg bg-white"
                />
                <p className="text-center text-xs text-gray-300">
                  ¿No podés escanear? Cargá esta clave a mano:
                </p>
                <code className="block break-all rounded-lg bg-black/40 p-2 text-center text-sm text-cyan-200">
                  {setup.secret}
                </code>
                <TextField
                  label="Código de 6 dígitos"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  autoFocus
                  value={code}
                  onValueChange={setCode}
                  placeholder="123456"
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => setSetup(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || code.trim().length < 6}>
                {busy ? 'Verificando…' : 'Activar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={recoveryCodes !== null}
        onOpenChange={(open) => !open && setRecoveryCodes(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Códigos de recuperación</DialogTitle>
            <DialogDescription>
              Guardalos en un lugar seguro. Cada uno sirve una sola vez si
              perdés el celular. No los vas a poder ver de nuevo.
            </DialogDescription>
          </DialogHeader>
          <ul className="m-0 grid grid-cols-2 gap-2 p-0">
            {recoveryCodes?.map((recovery) => (
              <li
                key={recovery}
                className="list-none rounded-lg bg-black/40 p-2 text-center font-mono text-sm text-cyan-200"
              >
                {recovery}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => void copyCodes()}>
              Copiar
            </Button>
            <Button onClick={() => setRecoveryCodes(null)}>Ya los guardé</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {prompt.dialog}
    </div>
  );
}
