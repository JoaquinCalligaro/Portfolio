const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function hasValidOrigin(request: Request, url: URL): boolean {
  if (SAFE_METHODS.has(request.method)) return true;
  return request.headers.get('origin') === publicOrigin(request, url);
}

function publicOrigin(request: Request, url: URL): string {
  const host = request.headers.get('x-forwarded-host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}
