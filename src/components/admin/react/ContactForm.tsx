import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { MotionRoot } from './MotionRoot';
import { TextField } from './fields';
import { announceChange, request } from './api';

type ContactValues = { contactToEmail: string; contactFromEmail: string };

export default function ContactForm({ settings }: { settings: ContactValues }) {
  const [values, setValues] = useState(settings);
  const [saved, setSaved] = useState(JSON.stringify(settings));
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
            <TextField
              label="Mail donde recibís los mensajes"
              type="email"
              value={values.contactToEmail}
              onValueChange={(v) =>
                setValues((c) => ({ ...c, contactToEmail: v }))
              }
              placeholder="tumail@gmail.com"
              hint="Sin dominio propio en Resend, tiene que ser el mismo mail con el que creaste tu cuenta de Resend."
              error={error}
            />
            <TextField
              label="Remitente (opcional)"
              value={values.contactFromEmail}
              onValueChange={(v) =>
                setValues((c) => ({ ...c, contactFromEmail: v }))
              }
              placeholder="Portfolio <contacto@tudominio.com>"
              hint="Dejalo vacío si no tenés dominio propio: se usa el de prueba de Resend."
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
