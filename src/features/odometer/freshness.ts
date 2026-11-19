/** Días sin lectura a partir de los cuales se pide confirmar el km (docs/diseno-funcional.md §8.5). */
export const WEEKLY_CHECK_DAYS = 7;

export type OdometerFreshness = 'fresh' | 'stale';

export function odometerFreshness(daysSinceReading: number): OdometerFreshness {
  return daysSinceReading >= WEEKLY_CHECK_DAYS ? 'stale' : 'fresh';
}
