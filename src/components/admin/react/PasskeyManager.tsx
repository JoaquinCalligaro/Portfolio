import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
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
import { registerPasskey, supportsPasskeys } from './passkeyClient';
import { usePasswordPrompt } from './usePasswordPrompt';
import { SPRING, enterTransition, statusTransition } from './motion';

type Passkey = {
  id: string;
  label: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

const MAX_PASSKEYS = 5;
const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });

const formatDate = (value: string | null) =>
  value ? dateFormat.format(new Date(value)) : 'Nunca';

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [supported, setSupported] = useState(true);
  const [naming, setNaming] = useState(false);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const prompt = usePasswordPrompt();

  const load = useCallback(async () => {
    const result = await request('/api/admin/passkeys', 'GET');
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudieron cargar tus dispositivos');
      setPasskeys([]);
      return;
    }
    setPasskeys(result.passkeys as Passkey[]);
  }, []);

  useEffect(() => {
    setSupported(supportsPasskeys());
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

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await withReauth((password) =>
      registerPasskey(label.trim() || 'Mi dispositivo', password)
    );
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo registrar el dispositivo');
      return;
    }
    setNaming(false);
    setLabel('');
    toast.success('Dispositivo registrado');
    await load();
  };

  const remove = async (id: string) => {
    const result = await withReauth((password) =>
      request(`/api/admin/passkeys/${id}`, 'DELETE', { password })
    );
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo eliminar el dispositivo');
      return;
    }
    toast.success('Dispositivo eliminado');
    setPasskeys((current) => current?.filter((p) => p.id !== id) ?? null);
  };

  const full = (passkeys?.length ?? 0) >= MAX_PASSKEYS;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300">
        Entrá con tu huella, Face ID o la llave del dispositivo, sin escribir la
        contraseña. Podés registrar hasta {MAX_PASSKEYS} dispositivos.
      </p>

      {passkeys === null ? (
        <div className="space-y-3" role="status" aria-label="Cargando dispositivos">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <ul className="m-0 space-y-3 p-0">
          <AnimatePresence initial={false}>
            {passkeys.length === 0 && (
              <m.li
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={statusTransition}
                className="list-none rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-300"
              >
                Todavía no registraste ningún dispositivo.
              </m.li>
            )}
            {passkeys.map((passkey, index) => (
              <m.li
                key={passkey.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  ...enterTransition,
                  delay: index * 0.07,
                  layout: SPRING,
                }}
                className={`${cardClass} flex list-none flex-wrap items-center gap-3 p-4`}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <MorphGlyph name="fingerprint" size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {passkey.label}
                  </p>
                  <p className="text-xs text-gray-300">
                    Agregado {formatDate(passkey.createdAt)} · Último uso{' '}
                    {formatDate(passkey.lastUsedAt)}
                    {passkey.backedUp ? ' · Con copia en la nube' : ''}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`Eliminar ${passkey.label}`}
                    >
                      <MorphGlyph name="trash" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar dispositivo</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Eliminar “{passkey.label}”? Ya no vas a poder entrar
                        con ese dispositivo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void remove(passkey.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!supported && (
        <p role="alert" className="text-sm text-amber-200">
          Este navegador no permite registrar dispositivos de acceso.
        </p>
      )}

      <Button
        disabled={!supported || full || passkeys === null}
        onClick={() => setNaming(true)}
      >
        <MorphGlyph name="plus" />
        Registrar este dispositivo
      </Button>
      {full && (
        <p className="text-xs text-gray-300">
          Llegaste al máximo. Eliminá un dispositivo para registrar otro.
        </p>
      )}

      <Dialog open={naming} onOpenChange={(open) => !busy && setNaming(open)}>
        <DialogContent>
          <form onSubmit={register}>
            <DialogHeader>
              <DialogTitle>Registrar dispositivo</DialogTitle>
              <DialogDescription>
                Ponele un nombre para reconocerlo después. Luego tu dispositivo
                te va a pedir la huella, el rostro o el PIN.
              </DialogDescription>
            </DialogHeader>
            <TextField
              label="Nombre del dispositivo"
              maxLength={60}
              autoFocus
              value={label}
              onValueChange={setLabel}
              placeholder="Ej. Celular, Notebook"
            />
            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => setNaming(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Esperando tu dispositivo…' : 'Continuar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {prompt.dialog}
    </div>
  );
}
