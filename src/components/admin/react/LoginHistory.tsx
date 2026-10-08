import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { MorphGlyph } from './MorphGlyph';
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

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
});
const yearDateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

// "8 oct · 14:05" (con el año solo si no es el actual).
function when(date: Date): string {
  const format =
    date.getFullYear() === new Date().getFullYear()
      ? dateFormat
      : yearDateFormat;
  return `${format.format(date)} · ${timeFormat.format(date)}`;
}

// "hace 5 minutos", "ayer"… hasta una semana; después nada.
function ago(date: Date): string {
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (minutes > -1) return 'recién';
  if (minutes > -60) return relativeFormat.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relativeFormat.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (days > -7) return relativeFormat.format(days, 'day');
  return '';
}

function Flag({ code, country }: { code: string; country: string }) {
  const [failed, setFailed] = useState(false);
  if (!code || failed) {
    return <MorphGlyph name="globe" className="text-gray-400" />;
  }
  return (
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={`Bandera de ${country}`}
      width={28}
      height={21}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-[21px] w-7 rounded-[3px] object-cover shadow-sm ring-1 ring-black/20"
    />
  );
}

function LoginRow({ entry }: { entry: LoginEntry }) {
  const code = /^[A-Z]{2}$/.test(entry.country) ? entry.country : '';
  const country = code ? countryName(code) : '';
  const detail = place(entry);
  const date = new Date(entry.createdAt);
  const relative = ago(date);

  return (
    <li className="flex list-none items-start gap-3 p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
        <Flag code={code} country={country} />
      </span>

      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium break-words text-white">
              {detail || country || 'Ubicación desconocida'}
            </p>
            {detail && country && (
              <p className="text-sm text-gray-300">{country}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <time
              dateTime={entry.createdAt}
              className="block text-sm whitespace-nowrap text-gray-200"
            >
              {when(date)}
            </time>
            {relative && (
              <span className="text-xs text-gray-400">{relative}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex max-w-full items-baseline gap-1.5 rounded-md bg-white/5 px-2 py-1 ring-1 ring-white/10">
            <span className="shrink-0 text-xs font-medium text-gray-400 select-none">
              IP
            </span>
            <span className="min-w-0 font-mono text-sm break-all text-gray-100 select-all">
              {entry.ip}
            </span>
          </span>
          <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 ring-1 ring-cyan-400/20">
            {METHODS[entry.method] ?? entry.method}
          </span>
        </div>
      </div>
    </li>
  );
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
      <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-gray-300">
        Todavía no hay ingresos registrados.
      </p>
    );
  }

  const shown = open ? items : items.slice(0, VISIBLE);

  return (
    <div className="space-y-3">
      <ul className="m-0 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-0">
        {shown.map((entry) => (
          <LoginRow key={entry.id} entry={entry} />
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
