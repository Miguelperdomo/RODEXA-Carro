import { energyRecordKinds } from '@/features/cars/energy';
import type { CapabilityInput } from '@/features/cars/capabilities';
import type { HistoryEntry } from '@/features/history/types';
import type { RecurringExpense } from '@/features/recurring/rules';
import { newId } from '@/features/session/userDataActions';
import type { FuelTracking, Settings, UsageStyle } from '@/features/settings/types';
import type { IconName } from '@/shared/ui';
import { addDays, daysBetween, parseISODate, toISODate } from '@/shared/utils/date';

// ——— El combustible en Tranqui ———

export const FUEL_TRACKING_OPTIONS: { value: FuelTracking; icon: IconName; label: string; description: string }[] = [
  { value: 'none', icon: 'close', label: 'No lo llevo', description: 'Nunca te lo pedimos' },
  {
    value: 'monthly',
    icon: 'expense',
    label: 'Un valor al mes',
    description: 'Dices cuánto gastas al mes y a fin de mes solo confirmas',
  },
  { value: 'each', icon: 'fuel', label: 'Cada carga', description: 'La registras cuando quieras, sin recordatorios' },
];

export const fuelTrackingLabel = (value: FuelTracking) =>
  (FUEL_TRACKING_OPTIONS.find((x) => x.value === value) ?? FUEL_TRACKING_OPTIONS[2]).label;

/** Un carro que solo se carga en la red (eléctrico) habla de "carga eléctrica", no de combustible. */
const onlyCharges = (profile: CapabilityInput) => {
  const kinds = energyRecordKinds(profile);
  return kinds.length === 1 && kinds[0] === 'charge';
};

/** Textos del combustible según el carro (sin perfil, los del combustible). */
export function fuelWords(profile: CapabilityInput | undefined) {
  return profile && onlyCharges(profile)
    ? { question: '¿Y la carga eléctrica?', monthName: 'Carga eléctrica del mes', topic: 'la carga eléctrica', noun: 'carga eléctrica' }
    : { question: '¿Y el combustible?', monthName: 'Combustible del mes', topic: 'el combustible', noun: 'combustible' };
}

/** El gasto mensual de combustible de Tranqui (activo o en pausa), si ya existe. */
export const monthlyFuelItem = (recurring: RecurringExpense[]) => recurring.find((r) => r.category === 'fuel');

/** Tranqui + "un valor al mes" y todavía no dijo cuánto: se le pregunta en Inicio. */
export function needsMonthlyFuelAmount(
  settings: Pick<Settings, 'usageStyle' | 'fuelTracking'>,
  recurring: RecurringExpense[],
): boolean {
  return settings.usageStyle === 'tranqui' && settings.fuelTracking === 'monthly' && !monthlyFuelItem(recurring);
}

/** "Gasto unos 300.000 al mes": queda como gasto que se repite y se confirma a fin de mes. */
export function monthlyFuelExpense(amountCop: number, today: Date, monthName: string): RecurringExpense {
  return {
    id: newId('rec'),
    category: 'fuel',
    amountCop,
    // Último día del mes (en meses cortos, el último que tenga).
    dayOfMonth: 31,
    note: monthName,
    createdAt: toISODate(today),
  };
}

/** El "Combustible del mes" solo está activo en Tranqui con "un valor al mes". */
export const monthlyFuelActive = (style: UsageStyle, fuel: FuelTracking) => style === 'tranqui' && fuel === 'monthly';

/** En Tranqui con "No lo llevo", el combustible no se ofrece en Inicio (primeros pasos). */
export const hidesFuel = (settings: Pick<Settings, 'usageStyle' | 'fuelTracking'>) =>
  settings.usageStyle === 'tranqui' && settings.fuelTracking === 'none';

// ——— Sugerir el estilo que le va mejor ———

/** Tranqui con 8 o más registros en 30 días: parece que le gusta el detalle. */
export const SUGGEST_DETAIL_RECORDS = 8;
/** Al detalle sin registrar nada en 14 días: quizá le está costando. */
export const SUGGEST_TRANQUI_DAYS = 14;
/** "No, gracias": cuánto tiempo sin volver a sugerir. */
export const SUGGESTION_SNOOZE_DAYS = 60;

/** Lo que registró la persona (sin lo del primer ingreso ni los pagos de gastos que se repiten). */
const ownRecords = (history: HistoryEntry[]) =>
  history.filter((e) => !e.id.startsWith('onb-') && !(e.kind === 'expense' && e.recurringId));

export function suggestStyle(
  history: HistoryEntry[],
  settings: Pick<Settings, 'usageStyle' | 'styleSuggestionSnoozedUntil'>,
  today: Date,
): UsageStyle | undefined {
  const todayIso = toISODate(today);
  if (settings.styleSuggestionSnoozedUntil && settings.styleSuggestionSnoozedUntil >= todayIso) return undefined;

  if (settings.usageStyle === 'tranqui') {
    const since = toISODate(addDays(today, -30));
    const recent = ownRecords(history).filter((e) => e.date >= since && e.date <= todayIso).length;
    return recent >= SUGGEST_DETAIL_RECORDS ? 'detail' : undefined;
  }

  // Al detalle: lleva al menos 2 semanas en la app y 2 semanas sin registrar nada.
  const start = history.find((e) => e.id === 'onb-km')?.date;
  if (!start || daysBetween(parseISODate(start), today) < SUGGEST_TRANQUI_DAYS) return undefined;
  const last = [start, ...ownRecords(history).map((e) => e.date)].sort().at(-1)!;
  return daysBetween(parseISODate(last), today) >= SUGGEST_TRANQUI_DAYS ? 'tranqui' : undefined;
}
