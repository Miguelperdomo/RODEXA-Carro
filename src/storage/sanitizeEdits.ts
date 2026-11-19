import { isObject } from './envelope';

/**
 * Lectura tolerante de la configuración y las ediciones del perfil (al abrir la app y al
 * importar una copia). Un campo con el tipo equivocado (p. ej. el intervalo "5000" escrito
 * como texto) se descarta y se informa: nunca llega a los cálculos.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIso = (v: unknown): v is string => typeof v === 'string' && ISO_DATE.test(v);
const isPositive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isNonNegative = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isString = (v: unknown): v is string => typeof v === 'string';
const oneOf = (values: readonly string[]) => (v: unknown) => typeof v === 'string' && values.includes(v);

const ENERGY = ['gasoline', 'diesel', 'cng', 'cng_gasoline', 'electric', 'hybrid_gasoline', 'hybrid_diesel', 'phev_gasoline', 'phev_diesel', 'other', 'unknown'];

/** Campos conocidos del perfil y su validación. Los campos que no se conocen se conservan. */
const PROFILE_FIELDS: Record<string, (v: unknown) => boolean> = {
  id: isString,
  brandCode: isString,
  brandName: isString,
  modelId: isString,
  model: isString,
  variantName: isString,
  plate: isString,
  plateCityId: isString,
  serviceType: (v: unknown) => v === 'private' || v === 'public',
  nickname: isString,
  year: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1900 && v <= 2100,
  energySource: oneOf(ENERGY),
  usageType: oneOf(['personal', 'work', 'delivery', 'apps', 'travel', 'mixed']),
  bodyType: oneOf(['sedan', 'hatchback', 'suv', 'pickup', 'camioneta', 'van', 'other']),
  transmission: oneOf(['manual', 'automatic', 'cvt', 'dct', 'other', 'unknown']),
  drivetrain: oneOf(['4x2', '4x4', 'awd', 'other', 'unknown']),
  timingSystem: oneOf(['belt', 'chain', 'other', 'unknown']),
  displacementCc: isPositive,
  tankCapacityLiters: isPositive,
  batteryCapacityKwh: isPositive,
};

export type Cleaned<T> = { value: T; dropped: number };

/** Perfil (o ediciones del perfil): quita los campos conocidos con un tipo inválido. */
export function cleanProfile(raw: unknown): Cleaned<Record<string, unknown>> {
  if (!isObject(raw)) return { value: {}, dropped: raw === undefined ? 0 : 1 };
  let dropped = 0;
  const value: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(raw)) {
    const check = PROFILE_FIELDS[key];
    // `undefined` explícito es válido (un dato que el usuario borró).
    if (check && v !== undefined && !check(v)) {
      dropped++;
      continue;
    }
    value[key] = v;
  }
  return { value, dropped };
}

/** Ediciones del usuario: solo textos (nombre, ciudad). */
export function cleanUserEdits(raw: unknown): Cleaned<Record<string, string>> {
  if (!isObject(raw)) return { value: {}, dropped: raw === undefined ? 0 : 1 };
  const entries = Object.entries(raw);
  const valid = entries.filter((e): e is [string, string] => typeof e[1] === 'string');
  return { value: Object.fromEntries(valid), dropped: entries.length - valid.length };
}

/** Configuración de un componente: enabled booleano; intervalo y último cambio con números y fechas válidos. */
function cleanComponentConfig(raw: unknown): { value?: Record<string, unknown>; dropped: number } {
  if (!isObject(raw) || typeof raw.enabled !== 'boolean') return { dropped: 1 };
  let dropped = 0;
  const value: Record<string, unknown> = { enabled: raw.enabled };

  if (raw.interval !== undefined) {
    if (isObject(raw.interval)) {
      const interval: Record<string, unknown> = {};
      for (const key of ['km', 'months'] as const) {
        const v = raw.interval[key];
        if (v === undefined) continue;
        if (isPositive(v)) interval[key] = v;
        else dropped++;
      }
      if (raw.interval.origin !== undefined) interval.origin = raw.interval.origin;
      if (raw.interval.source !== undefined) interval.source = raw.interval.source;
      if (isString(raw.interval.condition)) interval.condition = raw.interval.condition;
      if (interval.km !== undefined || interval.months !== undefined) value.interval = interval;
    } else dropped++;
  }

  if (raw.lastService !== undefined) {
    if (isObject(raw.lastService) && isString(raw.lastService.setAt)) {
      const last: Record<string, unknown> = { setAt: raw.lastService.setAt };
      if (raw.lastService.km !== undefined) {
        if (isNonNegative(raw.lastService.km)) last.km = raw.lastService.km;
        else dropped++;
      }
      if (raw.lastService.date !== undefined) {
        if (isIso(raw.lastService.date)) last.date = raw.lastService.date;
        else dropped++;
      }
      value.lastService = last;
    } else dropped++;
  }
  return { value, dropped };
}

export function cleanComponentConfigs(raw: unknown): Cleaned<Record<string, unknown>> {
  if (!isObject(raw)) return { value: {}, dropped: raw === undefined ? 0 : 1 };
  let dropped = 0;
  const value: Record<string, unknown> = {};
  for (const [code, config] of Object.entries(raw)) {
    const cleaned = cleanComponentConfig(config);
    dropped += cleaned.dropped;
    if (cleaned.value) value[code] = cleaned.value;
  }
  return { value, dropped };
}
