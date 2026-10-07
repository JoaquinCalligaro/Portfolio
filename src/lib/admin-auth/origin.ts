const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function hasValidOrigin(request: Request, url: URL): boolean {
  if (SAFE_METHODS.has(request.method)) return true;
  return request.headers.get('origin') === url.origin;
}
