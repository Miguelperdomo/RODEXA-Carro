import type { CarProfile } from '@/features/cars/types';
import { consumptionPairs, energyRecords } from '@/features/energy/compute';
import { ENERGY_META, formatQuantity } from '@/features/energy/meta';
import { LITERS_PER_GALLON, toLiters, unitPrice } from '@/features/energy/units';
import type { EnergyKind, EnergyRecord, HistoryEntry } from '@/features/history/types';
import { analysisEnergyKinds } from '@/features/pro/analytics';
import type { IconName } from '@/shared/ui';
import { formatDate, formatMonthYear, parseISODate } from '@/shared/utils/date';
import { formatConsumption, formatCop, formatKm } from '@/shared/utils/format';

import { kmInMonth } from './compute';

/**
 * Récords de tu carro, con lo que registraste. Cada energía por separado (gasolina,
 * GNC, electricidad), con su unidad; nunca se comparan unidades distintas. Si no hay
 * datos para un récord, simplemente no aparece.
 */
export type CarRecordItem = {
  key: string;
  icon: IconName;
  title: string;
  value: string;
  detail: string;
};

const RECORD_TITLE: Record<EnergyKind, string> = {
  fuel: 'Carga de combustible más cara',
  cng: 'Carga de GNC más cara',
  charge: 'Carga eléctrica más cara',
};

const ENERGY_NAME: Record<EnergyKind, string> = { fuel: 'Combustible', cng: 'GNC', charge: 'Electricidad' };

/** Precio por la unidad del propio registro (galón, litro, m³ o kWh). */
function recordPrice(r: EnergyRecord): number | undefined {
  const price = r.unitPriceCop ?? unitPrice(r.costCop, r.quantity);
  return price !== undefined && Number.isFinite(price) && price > 0 ? price : undefined;
}

/** Para comparar precios de combustible en galones y litros: siempre por litro. */
function comparablePrice(r: EnergyRecord, price: number): number {
  return r.kind === 'fuel' ? price / toLiters(1, r.unit) : price;
}

function priceUnitName(r: EnergyRecord): string {
  if (r.kind === 'fuel') return r.unit === 'gal' ? 'Galón' : 'Litro';
  return r.kind === 'cng' ? 'm³' : 'kWh';
}

const shortUnit = (r: EnergyRecord) => (r.kind === 'fuel' ? (r.unit === 'gal' ? 'gal' : 'L') : r.kind === 'cng' ? 'm³' : 'kWh');
const dateText = (iso: string) => formatDate(parseISODate(iso));
const monthText = (key: string) => {
  const label = formatMonthYear(parseISODate(`${key}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Fechas que cuentan para los récords (un año, para "Tu año"). Sin rango, todas. */
type Range = { from: string; to: string };
const inRange = (date: string, range?: Range) => !range || (date >= range.from && date < range.to);

function energyRecordsFor(entries: HistoryEntry[], kind: EnergyKind, suffix: string, range?: Range): CarRecordItem[] {
  const items: CarRecordItem[] = [];
  const records = energyRecords(entries, kind).filter((r) => inRange(r.date, range));
  const icon = ENERGY_META[kind].icon;

  const priciest = records
    .filter((r) => r.costCop !== undefined && r.costCop > 0)
    .sort((a, b) => (b.costCop ?? 0) - (a.costCop ?? 0))[0];
  if (priciest) {
    items.push({
      key: `${kind}-most-expensive`,
      icon,
      title: RECORD_TITLE[kind],
      value: formatCop(priciest.costCop!),
      detail: `${dateText(priciest.date)} · ${formatQuantity(priciest)}`,
    });
  }

  const priced = records.flatMap((r) => {
    const price = recordPrice(r);
    return price !== undefined ? [{ r, price, comparable: comparablePrice(r, price) }] : [];
  });
  const topPrice = priced.sort((a, b) => b.comparable - a.comparable)[0];
  if (topPrice) {
    items.push({
      key: `${kind}-highest-price`,
      icon: 'pricePerLiter',
      title: `${priceUnitName(topPrice.r)} más caro${suffix}`,
      value: `${formatCop(Math.round(topPrice.price))}/${shortUnit(topPrice.r)}`,
      detail: dateText(topPrice.r.date),
    });
  }

  // Los tramos se arman con TODOS los registros (uno de enero puede empezar en un tanque lleno de diciembre).
  const best = consumptionPairs(entries, kind)
    .filter((p) => inRange(p.to.date, range))
    .sort((a, b) => b.kmPerUnit - a.kmPerUnit)[0];
  if (best) {
    // El consumo se calcula en km/L; si ese tanqueo se registró en galones, se muestra en km/gal.
    const gal = best.to.kind === 'fuel' && best.to.unit === 'gal';
    const value = gal
      ? formatConsumption(best.kmPerUnit * LITERS_PER_GALLON, 'gal')
      : formatConsumption(best.kmPerUnit, kind === 'fuel' ? 'L' : kind === 'cng' ? 'm³' : 'kWh');
    items.push({
      key: `${kind}-best-consumption`,
      icon: 'odometer',
      title: `Mejor consumo${suffix}`,
      value,
      detail: `${dateText(best.from.date)} a ${dateText(best.to.date)} · ${formatKm(best.distanceKm)}`,
    });
  }
  return items;
}

/** Mes con más km: solo meses que se pueden medir (lectura cerca del inicio y otra en el mes). */
function bestKmMonth(entries: HistoryEntry[], referenceDate: Date, range?: Range): CarRecordItem | undefined {
  // Los km de un mes se miden con TODAS las lecturas (enero necesita la de finales de diciembre).
  const months = new Set(entries.filter((e) => inRange(e.date, range)).map((e) => e.date.slice(0, 7)));
  const current = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
  let best: { key: string; km: number } | undefined;
  for (const key of months) {
    if (key > current) continue;
    const km = kmInMonth(entries, key);
    if (km !== undefined && km > 0 && (!best || km > best.km)) best = { key, km };
  }
  return best
    ? { key: 'km-month', icon: 'calendar', title: 'Mes con más km', value: formatKm(best.km), detail: monthText(best.key) }
    : undefined;
}

/** Récords de todo el historial o, con `year`, solo de ese año. */
export function carRecords(entries: HistoryEntry[], profile: CarProfile, referenceDate: Date, year?: number): CarRecordItem[] {
  const range = year === undefined ? undefined : { from: `${year}-01-01`, to: `${year + 1}-01-01` };
  const kinds = analysisEnergyKinds(profile, range ? entries.filter((e) => inRange(e.date, range)) : entries);
  const many = kinds.length > 1;
  const energy = kinds.flatMap((kind) => energyRecordsFor(entries, kind, many ? ` · ${ENERGY_NAME[kind]}` : '', range));
  const km = bestKmMonth(entries, referenceDate, range);
  return [...energy, ...(km ? [km] : [])];
}
