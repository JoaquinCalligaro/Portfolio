export function logSecurityEvent(
  event: string,
  details: Record<string, string | number | boolean | null> = {}
): void {
  console.warn(
    JSON.stringify({
      scope: 'admin-security',
      event,
      ...details,
      at: new Date().toISOString(),
    })
  );
}
