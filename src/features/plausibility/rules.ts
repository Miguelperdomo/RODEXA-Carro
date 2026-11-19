import { consumptionPairs, energyRecords } from '@/features/energy/compute';
import { baseQuantity, LITERS_PER_GALLON, toLiters, unitPrice } from '@/features/energy/units';
import { EXPENSE_CATEGORIES } from '@/features/expenses/catalog';
import type { EnergyRecord, HistoryEntry } from '@/features/history/types';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatConsumption, formatCop, formatDecimal, formatKm } from '@/shared/utils/format';

/**
 * "¿Está bien este dato?": avisos para atrapar errores de digitación (un cero de más, un km
 * equivocado) ANTES de que dañen el consumo y las estadísticas. Siempre se compara con los
 * PROPIOS registros del usuario, nunca con valores técnicos "típicos". No bloquean: piden
 * confirmar con "Sí, guardar".
 */

/** Registros previos necesarios para comparar cantidades, precios y montos. */
export const MIN_HISTORY = 3;
/** Más del doble de lo más grande que ha tanqueado. */
export const QUANTITY_RATIO = 2;
/** Precio por unidad: el doble o la mitad de lo que suele pagar. */
export const PRICE_RATIO = 2;
/** Rendimiento de un tramo: 2,5 veces más o menos que sus otros tramos. */
export const CONSUMPTION_RATIO = 2.5;
/** Tramos previos necesarios para comparar el rendimiento. */
export const MIN_PAIRS = 2;
/** Un gasto 5 veces mayor de lo que suele registrar en esa categoría. */
export const EXPENSE_RATIO = 5;

export function median(values: number[]): number | undefined {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return undefined;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** El km con un cero de más vive en la validación del km (la usan km y tanqueos). */
export { kmTypoWarning } from '@/features/odometer/validation';

const ENERGY_WORDS = {
  fuel: { verb: 'cargar', unit: (r: EnergyRecord) => (r.kind === 'fuel' && r.unit === 'gal' ? 'galón' : 'litro') },
  cng: { verb: 'cargar', unit: () => 'm³' },
  charge: { verb: 'cargar', unit: () => 'kWh' },
} as const;

/** Litros (o m³/kWh) → la unidad en que se registró este tanqueo. */
const toRecordUnit = (record: EnergyRecord, base: number) =>
  record.kind === 'fuel' && record.unit === 'gal' ? base / LITERS_PER_GALLON : base;
const unitShort = (record: EnergyRecord) =>
  record.kind === 'fuel' ? (record.unit === 'gal' ? 'galones' : 'litros') : record.kind === 'cng' ? 'm³' : 'kWh';

/** Precio por unidad BASE (litro, m³ o kWh), para comparar tanqueos en galones y en litros. */
function basePrice(record: EnergyRecord): number | undefined {
  const price = record.unitPriceCop ?? unitPrice(record.costCop, record.quantity);
  if (price === undefined || !Number.isFinite(price) || price <= 0) return undefined;
  return record.kind === 'fuel' ? price / toLiters(1, record.unit) : price;
}

/**
 * Avisos de un tanqueo o carga antes de guardarlo. `draft` debe tener id (el del registro que
 * se corrige o uno temporal); `excludeId` es el registro que se está corrigiendo.
 */
export function energyPlausibility(history: HistoryEntry[], draft: EnergyRecord, excludeId?: string): string[] {
  const warnings: string[] = [];
  const rest = history.filter((e) => e.id !== excludeId && e.id !== draft.id);
  const previous = energyRecords(rest, draft.kind);
  const words = ENERGY_WORDS[draft.kind];

  // 1. Cantidad: mucho más que lo más grande que ha registrado.
  if (previous.length >= MIN_HISTORY) {
    const biggest = Math.max(...previous.map(baseQuantity));
    if (baseQuantity(draft) > biggest * QUANTITY_RATIO) {
      warnings.push(
        `Es mucho más de lo que sueles ${words.verb}: lo máximo que has registrado son ${formatDecimal(toRecordUnit(draft, biggest))} ${unitShort(draft)}. ¿La cantidad está bien?`,
      );
    }
  }

  // 2. Precio por unidad: el doble o la mitad de lo que suele pagar.
  const price = basePrice(draft);
  const usual = median(previous.flatMap((r) => basePrice(r) ?? []));
  if (price !== undefined && usual !== undefined && previous.filter((r) => basePrice(r) !== undefined).length >= MIN_HISTORY) {
    const ratio = price / usual;
    if (ratio >= PRICE_RATIO || ratio <= 1 / PRICE_RATIO) {
      const factor = draft.kind === 'fuel' ? toLiters(1, draft.unit) : 1;
      warnings.push(
        `El precio por ${words.unit(draft)} (${formatCop(Math.round(price * factor))}) es muy distinto a lo que sueles pagar (unos ${formatCop(Math.round(usual * factor))}). ¿Está bien?`,
      );
    }
  }

  // 3. Rendimiento del tramo que forma este registro, frente a sus otros tramos.
  const pairs = consumptionPairs([...rest, draft], draft.kind);
  const own = pairs.filter((p) => p.from.id === draft.id || p.to.id === draft.id);
  const usualKmPerUnit = median(pairs.filter((p) => !own.includes(p)).map((p) => p.kmPerUnit));
  if (usualKmPerUnit !== undefined && pairs.length - own.length >= MIN_PAIRS) {
    const odd = own.find((p) => {
      const ratio = p.kmPerUnit / usualKmPerUnit;
      return ratio >= CONSUMPTION_RATIO || ratio <= 1 / CONSUMPTION_RATIO;
    });
    if (odd) {
      const unit = draft.kind === 'fuel' ? (draft.unit === 'gal' ? 'gal' : 'L') : draft.kind === 'cng' ? 'm³' : 'kWh';
      const show = (kmPerBase: number) => formatConsumption(unit === 'gal' ? kmPerBase * LITERS_PER_GALLON : kmPerBase, unit);
      warnings.push(
        `Con este registro, entre el ${formatDate(parseISODate(odd.from.date))} y el ${formatDate(parseISODate(odd.to.date))} (${formatKm(odd.distanceKm)}) tu carro habría rendido ${show(odd.kmPerUnit)}, y normalmente rinde unos ${show(usualKmPerUnit)}. ¿El km y la cantidad están bien?`,
      );
    }
  }
  return warnings;
}

/** Un gasto con un cero de más, frente a lo que suele registrar en esa categoría. */
export function expenseAmountWarning(
  history: HistoryEntry[],
  input: { category: string; amountCop: number | null; excludeId?: string },
): string | undefined {
  if (input.amountCop === null || !(input.amountCop > 0)) return undefined;
  const amounts = history.flatMap((e) =>
    e.kind === 'expense' && e.category === input.category && e.id !== input.excludeId && e.amountCop > 0 ? [e.amountCop] : [],
  );
  const usual = median(amounts);
  if (amounts.length < MIN_HISTORY || usual === undefined || input.amountCop < usual * EXPENSE_RATIO) return undefined;
  const name = EXPENSE_CATEGORIES.find((c) => c.code === input.category)?.label;
  // "Lavado" → "lavado"; las siglas ("SOAT") se dejan igual.
  const label = !name ? 'esta categoría' : /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
  return `Normalmente registras unos ${formatCop(Math.round(usual))} en ${label} y escribiste ${formatCop(input.amountCop)}. ¿Tiene un cero de más?`;
}
