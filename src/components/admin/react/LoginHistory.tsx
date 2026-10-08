import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { request } from './api';

type LoginEntry = {
  id: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  method: string;
  createdAt: string;
};

const VISIBLE = 3;

const METHODS: Record<string, string> = {
  password: 'Contraseña',
  'password+trusted': 'Contraseña (dispositivo de confianza)',
  'password+totp': 'Contraseña + 2FA',
  'password+recovery': 'Contraseña + código de recuperación',
  passkey: 'Passkey',
};

// ::1 / 127.x = ingreso desde `astro dev`, donde Vercel no manda ubicación.
const LOCAL_IP = /^(::1|127\.|::ffff:127\.)/;

function place(entry: LoginEntry): string {
  if (LOCAL_IP.test(entry.ip)) return 'Entorno local (localhost)';
  return (
    [entry.city, entry.region, entry.country].filter(Boolean).join(', ') ||
    'Ubicación desconocida'
  );
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// Últimos 10 ingresos: muestra 3 y el resto se despliega.
export function LoginHistory() {
  const [items, setItems] = useState<LoginEntry[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void request('/api/admin/sessions/history', 'GET').then((result) => {
      if (!result.ok) {
        setError(result.error ?? 'No se pudo cargar el historial');
        return;
      }
      setItems((result.items as LoginEntry[]) ?? []);
    });
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!items)
    return <p className="text-sm text-gray-400">Cargando historial…</p>;
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Todavía no hay ingresos registrados.
      </p>
    );
  }

  const shown = open ? items : items.slice(0, VISIBLE);

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-white/10 rounded-md border border-white/10">
        {shown.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-mono break-all text-gray-100">{entry.ip}</p>
              <p className="text-gray-400">{place(entry)}</p>
            </div>
            <div className="text-gray-400 sm:text-right">
              <p>{when(entry.createdAt)}</p>
              <p className="text-xs">{METHODS[entry.method] ?? entry.method}</p>
            </div>
          </li>
        ))}
      </ul>
      {items.length > VISIBLE && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Ver menos' : `Ver todos (${items.length})`}
        </Button>
      )}
    </div>
  );
}
