import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { TextField } from './fields';

export function usePasswordPrompt() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const resolver = useRef<((value: string | null) => void) | null>(null);

  const ask = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        resolver.current = resolve;
        setPassword('');
        setOpen(true);
      }),
    []
  );

  const finish = (value: string | null) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  };

  const dialog = (
    <Dialog open={open} onOpenChange={(next) => !next && finish(null)}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (password) finish(password);
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirmá tu contraseña</DialogTitle>
            <DialogDescription>
              Por seguridad, necesitamos que vuelvas a ingresar tu contraseña
              para continuar.
            </DialogDescription>
          </DialogHeader>
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onValueChange={setPassword}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => finish(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!password}>
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return { ask, dialog };
}
