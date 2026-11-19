import { formatKm } from '@/shared/utils/format';

/** Más de esto por día pide confirmación, sin bloquear (docs/diseno-funcional.md §8.5). */
export const MAX_PLAUSIBLE_KM_PER_DAY = 500;

/** Un km 5 veces mayor que el anterior casi siempre es un cero de más (50.000 → 500.000). */
export const KM_TYPO_RATIO = 5;
/** Debajo de esto el km es muy bajo para comparar (carro nuevo). */
export const KM_TYPO_MIN_LAST = 1000;

/** "¿Tiene un cero de más?": se pregunta aunque haya pasado mucho tiempo desde el último km. */
export function kmTypoWarning(newKm: number | null, lastKm: number): string | undefined {
  if (newKm === null || lastKm < KM_TYPO_MIN_LAST || newKm < lastKm * KM_TYPO_RATIO) return undefined;
  return `Tu último km fue ${formatKm(lastKm)} y escribiste ${formatKm(newKm)}. ¿Tiene un cero de más?`;
}

type OdometerInput = {
  newKm: number | null;
  lastKm: number;
  /** Días entre el último registro y la fecha del nuevo. */
  daysSinceLast: number;
};

export type OdometerValidation = {
  error?: string;
  warning?: string;
};

export function validateOdometerReading({
  newKm,
  lastKm,
  daysSinceLast,
}: OdometerInput): OdometerValidation {
  if (newKm === null || newKm <= 0) {
    return { error: 'Ingresa el kilometraje que marca tu carro.' };
  }
  if (newKm < lastKm) {
    return { error: `No puede ser menor a tu último registro (${formatKm(lastKm)}).` };
  }

  const typo = kmTypoWarning(newKm, lastKm);
  if (typo) return { warning: typo };

  const traveled = newKm - lastKm;
  const kmPerDay = traveled / Math.max(daysSinceLast, 1);
  if (kmPerDay > MAX_PLAUSIBLE_KM_PER_DAY) {
    return {
      warning: `Son ${formatKm(traveled)} más que tu último registro. ¿El km está bien?`,
    };
  }
  return {};
}
