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

// Vercel manda la provincia como código ISO 3166-2 (sin el "AR-").
const AR_PROVINCES: Record<string, string> = {
  A: 'Salta',
  B: 'Buenos Aires',
  C: 'CABA',
  D: 'San Luis',
  E: 'Entre Ríos',
  F: 'La Rioja',
  G: 'Santiago del Estero',
  H: 'Chaco',
  J: 'San Juan',
  K: 'Catamarca',
  L: 'La Pampa',
  M: 'Mendoza',
  N: 'Misiones',
  P: 'Formosa',
  Q: 'Neuquén',
  R: 'Río Negro',
  S: 'Santa Fe',
  T: 'Tucumán',
  U: 'Chubut',
  V: 'Tierra del Fuego',
  W: 'Corrientes',
  X: 'Córdoba',
  Y: 'Jujuy',
  Z: 'Santa Cruz',
};

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' });

function countryName(code: string): string {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function regionName(entry: LoginEntry): string {
  if (entry.country === 'AR') return AR_PROVINCES[entry.region] ?? entry.region;
  return entry.region;
}

// "Quilmes, Buenos Aires" (sin repetir si la ciudad y la provincia coinciden).
function place(entry: LoginEntry): string {
  const region = regionName(entry);
  const parts = [entry.city, region].filter(Boolean);
  if (parts.length === 2 && parts[0] === parts[1]) parts.pop();
  return parts.join(', ');
}

function Location({ entry }: { entry: LoginEntry }) {
  if (LOCAL_IP.test(entry.ip)) {
    return (
      <p className="font-medium text-gray-100">Entorno local (localhost)</p>
    );
  }
  const code = /^[A-Z]{2}$/.test(entry.country) ? entry.country : '';
  const detail = place(entry);
  if (!code && !detail) {
    return <p className="font-medium text-gray-100">Ubicación desconocida</p>;
  }
  return (
    <>
      {code && (
        <p className="flex items-center gap-2 font-medium text-gray-100">
          <img
            src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
            alt=""
            width={20}
            height={15}
            loading="lazy"
            className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-white/15"
          />
          {countryName(code)}
        </p>
      )}
      {detail && <p className="text-gray-300">{detail}</p>}
    </>
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
            <div className="min-w-0 space-y-0.5">
              <Location entry={entry} />
              <p className="font-mono text-xs break-all text-gray-500">
                {entry.ip}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-gray-400 sm:flex-col sm:items-end sm:gap-1">
              <p>{when(entry.createdAt)}</p>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
                {METHODS[entry.method] ?? entry.method}
              </span>
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
