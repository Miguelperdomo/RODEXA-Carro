import { addDays, toISODate } from '@/shared/utils/date';

/**
 * Pico y placa CONFIGURADO POR EL USUARIO. RODEXA no conoce las reglas de cada ciudad,
 * ni festivos ni excepciones: solo usa lo que el usuario marcó y nunca afirma que se
 * "puede circular". Todo es local (sin internet).
 */

/** Cómo funciona en su ciudad: ciertos días de la semana, o días pares / impares del mes. */
export type PicoYPlacaMode = 'weekdays' | 'even_dates' | 'odd_dates';

/** Horario en minutos desde la medianoche (6:00 = 360). */
export type TimeWindow = { start: number; end: number };

export type PicoYPlacaConfig = {
  enabled: boolean;
  mode: PicoYPlacaMode;
  /** Días de la semana en que aplica: 1 = lunes … 7 = domingo. En par/impar, los días en que rige. */
  weekdays: number[];
  /** Uno o dos horarios (por ejemplo mañana y tarde). */
  windows: TimeWindow[];
  remindNightBefore: boolean;
  /** Cuándo lo configuró el usuario (AAAA-MM-DD). */
  updatedAt: string;
};

export const MAX_WINDOWS = 2;
/** Hora del recordatorio de la noche anterior (8:00 p. m.). */
export const REMINDER_EVENING_HOUR = 20;
/** Días de calendario hacia adelante que se dejan programados (se reprograma al abrir la app). */
export const REMINDER_DAYS_AHEAD = 14;

/** Nombres completos para elegir los días (las letras L, M, X… confundían). */
export const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const MODE_LABELS: Record<PicoYPlacaMode, string> = {
  weekdays: 'Ciertos días de la semana',
  even_dates: 'Días pares del mes',
  odd_dates: 'Días impares del mes',
};

export const DISCLAIMER =
  'RODEXA no conoce las reglas de tu ciudad, los festivos ni las excepciones: usa lo que configuraste. Verifica siempre con la Secretaría de Movilidad de tu ciudad.';

/** 1 = lunes … 7 = domingo. */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** ¿Aplica ese día, según lo que configuró el usuario? */
export function appliesOn(config: PicoYPlacaConfig | undefined, date: Date): boolean {
  if (!config?.enabled || config.windows.length === 0) return false;
  if (!config.weekdays.includes(isoWeekday(date))) return false;
  if (config.mode === 'weekdays') return true;
  const even = date.getDate() % 2 === 0;
  return config.mode === 'even_dates' ? even : !even;
}

/** Los próximos `count` días con pico y placa desde `from` (incluido), buscando hasta 62 días. */
export function upcomingDays(config: PicoYPlacaConfig | undefined, from: Date, count: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 62 && days.length < count; i++) {
    const day = addDays(from, i);
    day.setHours(0, 0, 0, 0);
    if (appliesOn(config, day)) days.push(day);
  }
  return days;
}

/** 360 → "6:00 a. m."; 1260 → "9:00 p. m."; 720 → "12:00 m." */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  if (h === 12 && minutes % 60 === 0) return '12:00 m.';
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

/** "6:00 a. m. a 9:00 p. m." o "6:00 a. m. a 8:30 a. m. y 3:00 p. m. a 7:30 p. m." */
export function formatWindows(windows: TimeWindow[]): string {
  return windows.map((w) => `${formatTime(w.start)} a ${formatTime(w.end)}`).join(' y ');
}

/** "miércoles 7 de octubre" */
export function formatDay(date: Date): string {
  return `${WEEKDAY_NAMES[isoWeekday(date) - 1]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export type Period = 'am' | 'pm';

/** Minutos desde la medianoche → hora de 12 horas con a. m. / p. m. (390 → 6:30 a. m.). */
export function to12h(minutes: number): { hour: number; minute: number; period: Period } {
  const h24 = Math.floor(minutes / 60);
  return { hour: h24 % 12 === 0 ? 12 : h24 % 12, minute: minutes % 60, period: h24 < 12 ? 'am' : 'pm' };
}

/** Hora de 12 horas (1 a 12) + minutos + a. m./p. m. → minutos. 12 a. m. = medianoche; 12 p. m. = mediodía. */
export function from12h(hour: number | null, minute: number | null, period: Period): number | undefined {
  if (hour === null || !Number.isInteger(hour) || hour < 1 || hour > 12) return undefined;
  const m = minute ?? 0;
  if (!Number.isInteger(m) || m < 0 || m > 59) return undefined;
  const h24 = (hour % 12) + (period === 'pm' ? 12 : 0);
  return h24 * 60 + m;
}

/** Horas y minutos escritos → minutos. Inválido → undefined. */
export function toMinutes(hour: number | null, minute: number | null): number | undefined {
  if (hour === null || !Number.isInteger(hour) || hour < 0 || hour > 23) return undefined;
  const m = minute ?? 0;
  if (!Number.isInteger(m) || m < 0 || m > 59) return undefined;
  return hour * 60 + m;
}

export type ConfigErrors = { weekdays?: string; windows?: string };

export function validateConfig(config: Pick<PicoYPlacaConfig, 'weekdays' | 'windows'>, rawInvalid: boolean): ConfigErrors {
  const errors: ConfigErrors = {};
  if (config.weekdays.length === 0) errors.weekdays = 'Elige al menos un día.';
  if (rawInvalid) errors.windows = 'Revisa el horario: la hora va de 1 a 12 y los minutos de 0 a 59.';
  else if (config.windows.length === 0) errors.windows = 'Escribe el horario.';
  else if (config.windows.some((w) => w.end <= w.start)) errors.windows = 'La hora final debe ser mayor que la inicial.';
  return errors;
}

export type PicoYPlacaStatus =
  | { kind: 'not_configured' }
  | { kind: 'off' }
  | { kind: 'today'; windows: TimeWindow[]; tomorrow: boolean }
  | { kind: 'not_today'; next?: Date; tomorrow: boolean };

/** Estado de hoy según la configuración del usuario (nunca dice "puedes circular"). */
export function statusOn(config: PicoYPlacaConfig | undefined, today: Date): PicoYPlacaStatus {
  if (!config) return { kind: 'not_configured' };
  if (!config.enabled) return { kind: 'off' };
  const tomorrow = appliesOn(config, addDays(today, 1));
  if (appliesOn(config, today)) return { kind: 'today', windows: config.windows, tomorrow };
  return { kind: 'not_today', next: upcomingDays(config, addDays(today, 1), 1)[0], tomorrow };
}

/** Texto corto del estado (Mi carro, Inicio). */
export function statusText(status: PicoYPlacaStatus): string {
  switch (status.kind) {
    case 'not_configured':
      return 'Configura los días y el horario de tu placa';
    case 'off':
      return 'Desactivado';
    case 'today':
      return `Hoy tienes pico y placa · ${formatWindows(status.windows)} · según lo que configuraste`;
    case 'not_today':
      return status.next
        ? `Hoy no tienes pico y placa · próximo: ${status.tomorrow ? 'mañana' : formatDay(status.next)} · según lo que configuraste`
        : 'Hoy no tienes pico y placa · según lo que configuraste';
  }
}

/** Búsqueda web del pico y placa oficial de la ciudad (RODEXA no consulta nada por su cuenta). */
export function officialSearchUrl(city: string | undefined): string {
  const query = ['pico y placa', city?.trim(), 'Secretaría de Movilidad'].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Recordatorios: la noche anterior (8:00 p. m.) a cada día con pico y placa de los próximos 14 días. */
export function picoYPlacaReminders(config: PicoYPlacaConfig | undefined, now: Date) {
  if (!config?.enabled || !config.remindNightBefore) return [];
  const last = addDays(now, REMINDER_DAYS_AHEAD);
  last.setHours(23, 59, 59, 999);
  return upcomingDays(config, addDays(now, 1), REMINDER_DAYS_AHEAD)
    .filter((day) => day.getTime() <= last.getTime())
    .map((day) => {
      const fireAt = addDays(day, -1);
      fireAt.setHours(REMINDER_EVENING_HOUR, 0, 0, 0);
      return {
        id: `pyp-${toISODate(day)}`,
        category: 'picoYPlaca' as const,
        title: 'Pico y placa',
        body: `Mañana (${formatDay(day)}) tienes pico y placa de ${formatWindows(config.windows)}, según lo que configuraste.`,
        fireAt,
        href: '/mi-carro/pico-y-placa',
      };
    })
    // Si ya pasaron las 8:00 p. m., el aviso de mañana no se programa (nunca en el pasado).
    .filter((r) => r.fireAt.getTime() > now.getTime());
}

const isMinutes = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 24 * 60;

/** Lectura tolerante del almacenamiento: si algo no tiene la forma esperada, se ignora la configuración. */
export function sanitizePicoYPlaca(raw: unknown): PicoYPlacaConfig | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const v = raw as Record<string, unknown>;
  const modes: PicoYPlacaMode[] = ['weekdays', 'even_dates', 'odd_dates'];
  if (typeof v.enabled !== 'boolean' || !modes.includes(v.mode as PicoYPlacaMode)) return undefined;
  if (!Array.isArray(v.weekdays) || !v.weekdays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)) return undefined;
  if (
    !Array.isArray(v.windows) ||
    v.windows.length > MAX_WINDOWS ||
    !v.windows.every((w) => typeof w === 'object' && w !== null && isMinutes((w as TimeWindow).start) && isMinutes((w as TimeWindow).end))
  ) {
    return undefined;
  }
  if (typeof v.remindNightBefore !== 'boolean' || typeof v.updatedAt !== 'string') return undefined;
  return {
    enabled: v.enabled,
    mode: v.mode as PicoYPlacaMode,
    weekdays: [...new Set(v.weekdays as number[])].sort(),
    windows: (v.windows as TimeWindow[]).map((w) => ({ start: w.start, end: w.end })),
    remindNightBefore: v.remindNightBefore,
    updatedAt: v.updatedAt,
  };
}
