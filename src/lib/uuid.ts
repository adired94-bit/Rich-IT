const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres throws on a malformed uuid; check first so bad links 404 instead of 500. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
