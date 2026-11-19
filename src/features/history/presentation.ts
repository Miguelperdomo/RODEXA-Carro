import type { EnergySource } from '@/features/cars/types';
import { DOCUMENT_DEFINITIONS, documentExpenseCategory } from '@/features/documents/catalog';
import { documentRecordSubtitle, documentRecordTitle } from '@/features/documents/presentation';
import { ENERGY_META, energyTitle, formatQuantity } from '@/features/energy/meta';
import { EXPENSE_CATEGORIES } from '@/features/expenses/catalog';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { formatRecordKm } from '@/features/odometer/recordKm';
import type { IconName } from '@/shared/ui';
import { formatDate, formatMonthYear, parseISODate } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

import type { HistoryEntry } from './types';
import { cmpText } from '@/shared/utils/compare';

export type EntryView = {
  icon: IconName;
  title: string;
  subtitle: string;
  /** Valor a la derecha: dinero o km. */
  trailing?: string;
  note?: string;
};

/**
 * Convierte un evento en los textos que muestra una fila del historial.
 * `energySource` permite titular un tanqueo como "Gasolina" o "Diésel".
 */
export function describeEntry(entry: HistoryEntry, energySource?: EnergySource): EntryView {
  const date = formatDate(parseISODate(entry.date));

  switch (entry.kind) {
    case 'odometer':
      return { icon: 'odometer', title: 'Kilometraje registrado', subtitle: date, trailing: formatKm(entry.km) };
    case 'maintenance': {
      const labels = entry.types.map(maintenanceLabel);
      return {
        icon: 'maintenance',
        title: labels.join(', '),
        subtitle: `${date} · ${formatRecordKm(entry.km)}`,
        trailing: entry.costCop !== undefined ? formatCop(entry.costCop) : undefined,
        note: entry.note,
      };
    }
    case 'expense': {
      const category = EXPENSE_CATEGORIES.find((c) => c.code === entry.category);
      return {
        icon: category?.icon ?? 'expense',
        title: category?.label ?? 'Gasto',
        subtitle: date,
        trailing: formatCop(entry.amountCop),
        note: entry.note,
      };
    }
    case 'document': {
      // "SOAT · $500.000", "Impuesto vehicular 2027 · pagado el…": el valor ES el gasto.
      const cost = entryCost(entry);
      return {
        icon: DOCUMENT_DEFINITIONS[entry.docType].icon,
        title: documentRecordTitle(entry),
        subtitle: `${formatDate(parseISODate(costDateOf(entry)))} · ${documentRecordSubtitle(entry)}`,
        trailing: cost > 0 ? formatCop(cost) : undefined,
        note: entry.note,
      };
    }
    case 'fuel':
    case 'cng':
    case 'charge': {
      // "Gasolina — 35 L", "GNC — 18 m³", "Electricidad — 32 kWh": siempre la unidad del registro.
      const details = [
        entry.kind === 'fuel' && entry.fullTank ? 'tanque lleno' : undefined,
        entry.kind === 'cng' && entry.fullFill ? 'carga completa' : undefined,
        entry.kind === 'charge' && entry.endPercent !== undefined ? `hasta ${entry.endPercent} %` : undefined,
        entry.kind === 'charge' ? entry.location : entry.station,
        entry.costCop === undefined ? 'sin costo registrado' : undefined,
      ].filter(Boolean);
      return {
        icon: ENERGY_META[entry.kind].icon,
        title: `${energyTitle(entry.kind, energySource)} — ${formatQuantity(entry)}`,
        subtitle: `${date} · ${formatRecordKm(entry.km)}`,
        trailing: entry.costCop !== undefined ? formatCop(entry.costCop) : undefined,
        note: details.length > 0 ? details.join(' · ') : undefined,
      };
    }
  }
}

/**
 * Dinero que suma un evento a los gastos (mantenimientos con costo y registros de
 * energía también cuentan). Sin costo registrado suma 0: no se inventa un valor.
 */
export function entryCost(entry: HistoryEntry): number {
  switch (entry.kind) {
    case 'expense':
      return entry.amountCop;
    case 'maintenance':
    case 'fuel':
    case 'cng':
    case 'charge':
      return entry.costCop ?? 0;
    case 'document':
      // El valor pagado del documento ES el gasto (no hay otro registro). La licencia de
      // conducción es del conductor: no cuenta como costo del carro.
      return documentExpenseCategory(entry.docType) ? (entry.costCop ?? 0) : 0;
    default:
      return 0;
  }
}

/**
 * Fecha en que un registro cuenta como gasto: la de pago de un documento (si no hay,
 * su expedición); para todo lo demás, la del registro. La usan Estadísticas, Inicio e
 * Historial, así los totales de un mes siempre coinciden.
 */
export function costDateOf(entry: HistoryEntry): string {
  if (entry.kind === 'document' && entryCost(entry) > 0) return entry.paidAt ?? entry.issuedAt ?? entry.date;
  return entry.date;
}

/** Los `count` registros más recientes. */
export function latestEntries(entries: HistoryEntry[], count: number): HistoryEntry[] {
  return [...entries].sort((a, b) => cmpText(b.date, a.date)).slice(0, count);
}

export type MonthGroup = {
  key: string;
  label: string;
  entries: HistoryEntry[];
  totalCop: number;
};

/** Agrupa por mes, del más reciente al más antiguo. */
export function groupByMonth(entries: HistoryEntry[]): MonthGroup[] {
  const sorted = [...entries].sort((a, b) => cmpText(costDateOf(b), costDateOf(a)));
  const groups: MonthGroup[] = [];

  for (const entry of sorted) {
    const date = costDateOf(entry);
    const key = date.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const label = formatMonthYear(parseISODate(date));
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), entries: [], totalCop: 0 };
      groups.push(group);
    }
    group.entries.push(entry);
    group.totalCop += entryCost(entry);
  }
  return groups;
}
