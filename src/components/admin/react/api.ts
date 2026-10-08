import { toast } from 'sonner';

export type ApiResult = {
  ok: boolean;
  status: number;
  error?: string;
  warning?: string;
  retryAfterSeconds?: number;
  realtime?: { ok: boolean; error?: string };
  item?: Record<string, unknown> & { id?: string };
  [key: string]: unknown;
};

const NETWORK_ERROR = 'No se pudo conectar con el servidor';
const UNAUTHORIZED = 'No autorizado';

export async function request(
  url: string,
  method: string,
  body?: unknown
): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<ApiResult>;
    if (res.status === 401 && data.error === UNAUTHORIZED) {
      window.location.href = '/admin/login';
    }
    return { ...data, ok: res.ok && data.ok !== false, status: res.status };
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
}

export async function postForm(
  url: string,
  body: FormData
): Promise<ApiResult> {
  try {
    const res = await fetch(url, { method: 'POST', body });
    const data = (await res.json().catch(() => ({}))) as Partial<ApiResult>;
    return { ...data, ok: res.ok && data.ok !== false, status: res.status };
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
}

export async function uploadFile(
  file: File,
  kind: 'image' | 'raw' = 'image',
  folder: 'assets' | 'projects' = 'assets'
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const form = new FormData();
  form.append('file', file);
  const result = await postForm(
    `/api/admin/upload?kind=${kind}&folder=${folder}`,
    form
  );
  return {
    ok: result.ok,
    url: typeof result.url === 'string' ? result.url : undefined,
    error: result.error ?? (result.ok ? undefined : 'No se pudo subir el archivo'),
  };
}

export function announceChange(result: ApiResult) {
  if (result.warning) toast.warning(result.warning);
  if (result.realtime && !result.realtime.ok) {
    toast.warning(
      `El cambio se guardó, pero el aviso en vivo falló: ${result.realtime.error ?? 'sin detalle'}`
    );
  }
  window.dispatchEvent(new Event('site:changed'));
}

export function needsReauth(result: ApiResult) {
  return result.status === 401 && result.error !== UNAUTHORIZED;
}
