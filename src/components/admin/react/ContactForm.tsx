import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { MaskedEmail } from './MaskedEmail';
import { MotionRoot } from './MotionRoot';
import { TextField } from './fields';
import { announceChange, request } from './api';

type ContactValues = { contactToEmail: string; contactFromEmail: string };

export default function ContactForm({ settings }: { settings: ContactValues }) {
  const initial = { contactFromEmail: settings.contactFromEmail };
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(values) !== saved;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await request('/api/admin/contact-settings', 'PATCH', values);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo guardar');
      return;
    }
    setSaved(JSON.stringify(values));
    toast.success('Contacto guardado');
    announceChange(result);
  };

  return (
    <MotionRoot>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-5" noValidate>
            <p className="text-sm text-gray-300">
              Los mensajes llegan a{' '}
              <MaskedEmail email={settings.contactToEmail} />.
              Para cambiarlo andá a{' '}
              <a href="/admin/security#account" className="text-cyan-300 underline">
                Seguridad → Cuenta
              </a>
              .
            </p>
            <TextField
              label="Remitente (opcional)"
              value={values.contactFromEmail}
              onValueChange={(v) =>
                setValues((c) => ({ ...c, contactFromEmail: v }))
              }
              placeholder="Portfolio <contacto@tudominio.com>"
              hint="Dejalo vacío si no tenés dominio propio: se usa el de prueba de Resend."
              error={error}
            />
            <p className="text-xs text-gray-400">
              La clave de Resend (<code>RESEND_API_KEY</code>) se queda en las
              variables de entorno, porque es un dato secreto.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!dirty || busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </Button>
              <span role="status" className="text-sm text-gray-300">
                {dirty ? 'Cambios sin guardar' : ''}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </MotionRoot>
  );
}
