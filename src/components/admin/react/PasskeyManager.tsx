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

  const rename = async (id: string, next: string) => {
    const result = await request(`/api/admin/passkeys/${id}`, 'PATCH', {
      label: next,
    });
    if (!result.ok) {
      toast.error(result.error ?? 'No se pudo renombrar el dispositivo');
      return false;
    }
    setPasskeys(
      (current) =>
        current?.map((p) => (p.id === id ? { ...p, label: next } : p)) ?? null
    );
    toast.success('Nombre actualizado');
    return true;
  };

  const count = passkeys?.length ?? 0;
  const full = count >= MAX_PASSKEYS;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1 sm:flex-1">
          <p className="text-sm text-gray-300">
            Entrá con tu huella, Face ID o la llave del dispositivo, sin
            escribir la contraseña.
          </p>
          {passkeys !== null && (
            <p className="text-xs text-gray-400">
              {count} de {MAX_PASSKEYS} dispositivos
            </p>
          )}
        </div>
        <Button
          disabled={!supported || full || passkeys === null}
          onClick={() => setNaming(true)}
          className="w-full shrink-0 sm:w-auto"
        >
          <MorphGlyph name="plus" />
          Registrar este dispositivo
        </Button>
      </div>

      {!supported && (
        <p role="alert" className="text-sm text-amber-200">
          Este navegador no permite registrar dispositivos de acceso.
        </p>
      )}
      {full && (
        <p className="text-xs text-amber-200">
          Llegaste al máximo. Eliminá un dispositivo para registrar otro.
        </p>
      )}

      {passkeys === null ? (
        <div
          className="space-y-3"
          role="status"
          aria-label="Cargando dispositivos"
        >
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
                className="flex list-none flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-10 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                  <MorphGlyph name="fingerprint" size={26} />
                </span>
                <p className="text-sm text-gray-300">
                  Todavía no registraste ningún dispositivo.
                </p>
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
                className="list-none"
              >
                <PasskeyRow
                  passkey={passkey}
                  onRename={(next) => rename(passkey.id, next)}
                  onRemove={() => void remove(passkey.id)}
                />
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
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
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setNaming(false)}
              >
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

type PasskeyRowProps = {
  passkey: Passkey;
  onRename: (label: string) => Promise<boolean>;
  onRemove: () => void;
};

function PasskeyRow({ passkey, onRename, onRemove }: PasskeyRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(passkey.label);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft(passkey.label);
    setEditing(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next || next === passkey.label) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onRename(next);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <div
      className={`${cardClass} group flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-cyan-400/30`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-300 ring-1 ring-cyan-400/20">
        <MorphGlyph name="fingerprint" size={24} />
      </span>

      <div className="min-w-0 flex-1 basis-40 space-y-1.5">
        {editing ? (
          <form onSubmit={save} className="flex items-center gap-2">
            <input
              autoFocus
              maxLength={60}
              value={draft}
              disabled={saving}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              aria-label="Nuevo nombre del dispositivo"
              className="h-9 min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
            <Button
              type="submit"
              size="icon"
              disabled={saving}
              aria-label="Guardar nombre"
            >
              <MorphGlyph name="check" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={saving}
              onClick={() => setEditing(false)}
              aria-label="Cancelar"
            >
              <MorphGlyph name="x" />
            </Button>
          </form>
        ) : (
          <p className="truncate font-medium text-white">{passkey.label}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
          <span>Agregado {formatDate(passkey.createdAt)}</span>
          <span>Último uso {formatDate(passkey.lastUsedAt)}</span>
          {passkey.backedUp && (
            <span className="rounded-full bg-cyan-500/10 px-2 text-cyan-300">
              Sincronizado
            </span>
          )}
        </div>
      </div>

      {!editing && (
        <div className="ml-auto flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={start}
            aria-label={`Renombrar ${passkey.label}`}
          >
            <MorphGlyph name="pencil" />
          </Button>
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
                  ¿Eliminar “{passkey.label}”? Ya no vas a poder entrar con ese
                  dispositivo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
