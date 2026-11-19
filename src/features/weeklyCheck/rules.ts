import { capabilitiesOf, isApplicable, type CapabilityId, type CapabilityInput } from '@/features/cars/capabilities';
import type { Settings } from '@/features/settings/types';
import type { IconName } from '@/shared/ui';
import { addDays, daysBetween, parseISODate, toISODate } from '@/shared/utils/date';

/**
 * Revisión semanal (opcional): 5 puntos rápidos que el usuario mira en su carro. RODEXA
 * no revisa nada: solo le recuerda y guarda cuándo lo hizo.
 */
export type WeeklyItem = { key: string; icon: IconName; title: string; hint: string; requires?: readonly CapabilityId[] };

const CANDIDATES: WeeklyItem[] = [
  { key: 'tires', icon: 'tire', title: 'Llantas', hint: 'Que se vean bien infladas y sin cortes ni bultos.' },
  { key: 'lights', icon: 'electric', title: 'Luces', hint: 'Delanteras, stop, direccionales y reversa.' },
  { key: 'brakes', icon: 'brakes', title: 'Frenos', hint: 'Sin ruidos, vibraciones ni pedal blando.' },
  { key: 'oil', icon: 'oil', title: 'Aceite', hint: 'Nivel con la varilla, con el motor frío.', requires: ['engine-oil'] },
  { key: 'fluids', icon: 'cooling', title: 'Líquidos', hint: 'Refrigerante y limpiaparabrisas en su nivel.' },
  { key: 'dashboard', icon: 'warning', title: 'Tablero', hint: 'Sin testigos o luces de alerta encendidos.' },
];

export const WEEKLY_POINTS = 5;
export const WEEKLY_DAYS = 7;
/** Hora del recordatorio (10:00 a. m., aparte del aviso de las 9:00). */
export const WEEKLY_REMINDER_HOUR = 10;

/** Los 5 puntos para este carro: un eléctrico no ve "Aceite" (ve "Tablero" en su lugar). */
export function weeklyItemsFor(profile: CapabilityInput): WeeklyItem[] {
  const caps = capabilitiesOf(profile);
  return CANDIDATES.filter((item) => !item.requires || isApplicable(caps, item.requires)).slice(0, WEEKLY_POINTS);
}

type WeeklySettings = Pick<Settings, 'weeklyCheckEnabled' | 'weeklyCheckLastDone' | 'weeklyCheckSince'>;

/** Desde cuándo se cuenta la semana: la última revisión, o el día en que se activó. */
function baseDate(settings: WeeklySettings): Date | undefined {
  const iso = settings.weeklyCheckLastDone || settings.weeklyCheckSince;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? parseISODate(iso) : undefined;
}

/** ¿Toca la revisión? Activada y nunca hecha, o hecha hace 7 días o más. */
export function isWeeklyDue(settings: WeeklySettings, today: Date): boolean {
  if (!settings.weeklyCheckEnabled) return false;
  if (!settings.weeklyCheckLastDone) return true;
  return daysBetween(parseISODate(settings.weeklyCheckLastDone), today) >= WEEKLY_DAYS;
}

/** "Hoy", "hace 3 días"… o "Nunca" para el estado en Mi carro. */
export function weeklyStatusText(settings: WeeklySettings, today: Date): string {
  if (!settings.weeklyCheckEnabled) return 'Opcional · 5 puntos rápidos cada semana';
  if (!settings.weeklyCheckLastDone) return 'Primera revisión pendiente';
  const days = daysBetween(parseISODate(settings.weeklyCheckLastDone), today);
  if (days >= WEEKLY_DAYS) return 'Revisión de esta semana pendiente';
  return days === 0 ? 'Revisada hoy' : `Revisada hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

/** Recordatorios: cada 7 días desde la última revisión (o desde que se activó), los próximos 3. */
export function weeklyReminders(settings: WeeklySettings, now: Date) {
  const base = baseDate(settings);
  if (!settings.weeklyCheckEnabled || !base) return [];
  // Desde la semana en curso (aunque la última revisión sea de hace meses): nunca se agotan.
  const first = Math.max(Math.floor(daysBetween(base, now) / WEEKLY_DAYS), 0) + 1;
  return [0, 1, 2, 3]
    .map((n) => {
      const fireAt = addDays(base, (first + n - 1) * WEEKLY_DAYS);
      fireAt.setHours(WEEKLY_REMINDER_HOUR, 0, 0, 0);
      return fireAt;
    })
    .filter((fireAt) => fireAt.getTime() > now.getTime())
    .slice(0, 3)
    .map((fireAt) => ({
      id: `weekly-${toISODate(fireAt)}`,
      category: 'weeklyCheck' as const,
      title: 'Revisión semanal',
      body: '5 puntos rápidos: llantas, luces, frenos y más. Te toma un par de minutos.',
      fireAt,
      href: '/revision-semanal',
    }));
}
