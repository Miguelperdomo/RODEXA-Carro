import { isObject } from '@/storage/envelope';

/**
 * "¿Dónde lo parqueé?": dónde dejaste el carro (piso, zona o letra, puesto y nota). Solo hay
 * UN lugar guardado a la vez y vive solo en el celular. Sin GPS: lo que tú anotas (y una foto, si quieres).
 */
export type ParkingSpot = {
  /** Cuándo se guardó (ISO con hora). */
  at: string;
  /** "3", "Sótano 2", "-1"… */
  level?: string;
  /** Zona, letra, bloque o sección: "B". */
  zone?: string;
  /** Número del puesto: "45". */
  spot?: string;
  /** "Unicentro, entrada norte". */
  note?: string;
  /** Foto del lugar (opcional), en la carpeta privada de RODEXA. Una sola. */
  photoUri?: string;
};

export type ParkingInput = Omit<ParkingSpot, 'at'>;

const text = (v: unknown, max = 60) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

/** Lo guardado, limpio (otro formato o datos dañados → no hay nada guardado). */
export function sanitizeParking(raw: unknown): ParkingSpot | null {
  if (!isObject(raw) || typeof raw.at !== 'string' || Number.isNaN(Date.parse(raw.at))) return null;
  const spot: ParkingSpot = {
    at: raw.at,
    level: text(raw.level, 20),
    zone: text(raw.zone, 10),
    spot: text(raw.spot, 10),
    note: text(raw.note, 120),
    photoUri: typeof raw.photoUri === 'string' && raw.photoUri.startsWith('file:') ? raw.photoUri : undefined,
  };
  return hasPlace(spot) ? spot : null;
}

/** ¿Dice algo del lugar? (una foto sola también sirve). */
export const hasPlace = (p: ParkingInput) => !!(p.level || p.zone || p.spot || p.note || p.photoUri);

/** "Piso 3" (si es solo un número), "Sótano 2" tal cual. */
export function levelLabel(level: string): string {
  return /^-?\d+$/.test(level) ? `Piso ${level}` : level;
}

/** "Piso 3 · Zona B · Puesto 45 · Unicentro". */
export function parkingLabel(p: ParkingInput): string {
  return [p.level ? levelLabel(p.level) : undefined, p.zone ? `Zona ${p.zone}` : undefined, p.spot ? `Puesto ${p.spot}` : undefined, p.note]
    .filter(Boolean)
    .join(' · ');
}

/** "hace 5 minutos", "hace 2 horas", "ayer", "hace 3 días". */
export function sinceLabel(at: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(at)) / 60_000));
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'ayer' : `hace ${days} días`;
}
