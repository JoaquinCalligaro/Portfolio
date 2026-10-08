import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
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
import { LoginHistory } from './LoginHistory';
import { MorphGlyph } from './MorphGlyph';
import { request } from './api';

export function SessionsPanel() {
  const [busy, setBusy] = useState(false);

  const revokeAll = async () => {
    setBusy(true);
    const result = await request('/api/admin/sessions/revoke-all', 'POST', {});
    if (!result.ok) {
      setBusy(false);
      toast.error(result.error ?? 'No se pudieron cerrar las sesiones');
      return;
    }
    window.location.href = '/admin/login';
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300">
        Las sesiones duran 12 horas y se renuevan mientras usás el panel. Si
        creés que alguien más entró, cerrá todas: vas a tener que volver a
        ingresar.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busy}>
            <MorphGlyph name="logout" />
            Cerrar todas las sesiones
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar todas las sesiones</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a cerrar la sesión en todos los dispositivos, incluido este.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void revokeAll()}>
              Cerrar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className="text-sm font-medium text-gray-100">Últimos ingresos</h3>
        <LoginHistory />
      </div>
    </div>
  );
}
