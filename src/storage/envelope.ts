/**
 * Cada valor guardado va dentro de un "sobre" con la versión del esquema:
 * { schemaVersion: 1, savedAt: "…", data: {…} }. Si una versión futura cambia
 * la forma de los datos, ese almacén declara su versión y sus migraciones, y los
 * datos existentes se transforman al leerlos, sin perderse.
 *
 * Cada almacén tiene SU versión: subir la de los datos del carro no toca las
 * preferencias ni el progreso de viaje (que siguen en la 1).
 */
export const SCHEMA_VERSION = 1;

export type Envelope<T> = { schemaVersion: number; savedAt: string; data: T };

/** Migraciones de versión N → N+1. Nunca borran datos: solo agregan o renombran. */
export type Migrations = Record<number, (data: unknown) => unknown>;

export type SchemaOptions = { version?: number; migrations?: Migrations };

export function wrap<T>(data: T, version = SCHEMA_VERSION): string {
  const envelope: Envelope<T> = { schemaVersion: version, savedAt: new Date().toISOString(), data };
  return JSON.stringify(envelope);
}

export type UnwrapResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: 'invalid-json' | 'invalid-envelope' | 'newer-version' | 'missing-migration' };

/** Lee un sobre y lo lleva a la versión actual de ese almacén. Nunca lanza errores. */
export function unwrap(
  raw: string,
  { version: currentVersion = SCHEMA_VERSION, migrations = {} }: SchemaOptions = {},
): UnwrapResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!isObject(parsed) || typeof parsed.schemaVersion !== 'number' || !('data' in parsed)) {
    return { ok: false, reason: 'invalid-envelope' };
  }
  // Datos de una versión MÁS NUEVA de la app: no se tocan (no se sabe leerlos).
  if (parsed.schemaVersion > currentVersion) return { ok: false, reason: 'newer-version' };

  let data = parsed.data;
  for (let version = parsed.schemaVersion; version < currentVersion; version++) {
    const migrate = migrations[version];
    if (!migrate) return { ok: false, reason: 'missing-migration' };
    data = migrate(data);
  }
  return { ok: true, data };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
