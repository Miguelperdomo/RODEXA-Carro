import type { ChargeType, EnergyRecord } from '@/features/history/types';
import { formatRecordKm } from '@/features/odometer/recordKm';
import { formatDateWithRelative, parseISODate } from '@/shared/utils/date';
import { formatCop, formatDecimal } from '@/shared/utils/format';

import { formatQuantity, quantityUnit } from './meta';
import { toLiters } from './units';

const CHARGE_TYPE_LABELS: Record<ChargeType, string> = { ac: 'AC (carga lenta)', dc: 'DC (carga rápida)', other: 'Otro' };
export const CHARGE_TYPE_OPTIONS = (Object.keys(CHARGE_TYPE_LABELS) as ChargeType[]).map((value) => ({
  value,
  label: CHARGE_TYPE_LABELS[value],
}));

/** Filas del detalle de un registro de energía (solo lo que existe; nada se inventa). */
export function energyDetailRows(record: EnergyRecord): { label: string; value?: string }[] {
  const unit = quantityUnit(record);
  const rows: { label: string; value?: string }[] = [
    { label: 'Fecha', value: formatDateWithRelative(parseISODate(record.date)) },
    { label: 'Kilometraje', value: formatRecordKm(record.km) },
    { label: 'Cantidad', value: formatQuantity(record) },
  ];
  // Un tanqueo en galones muestra también su equivalente en litros (base del consumo).
  if (record.kind === 'fuel' && record.unit === 'gal') {
    rows.push({ label: 'Equivale a', value: `${formatDecimal(toLiters(record.quantity, 'gal'), 2)} L` });
  }
  rows.push(
    { label: 'Costo total', value: record.costCop !== undefined ? formatCop(record.costCop) : 'Sin registrar' },
    {
      label: `Precio por ${unit}`,
      value: record.unitPriceCop !== undefined ? `${formatCop(record.unitPriceCop)} / ${unit}` : undefined,
    },
  );
  if (record.kind === 'fuel') rows.push({ label: 'Tanque lleno', value: record.fullTank ? 'Sí' : 'No, parcial' });
  if (record.kind === 'cng') rows.push({ label: 'Carga completa', value: record.fullFill ? 'Sí' : 'No, parcial' });
  if (record.kind === 'charge') {
    rows.push(
      { label: 'Batería al empezar', value: record.startPercent !== undefined ? `${record.startPercent} %` : undefined },
      { label: 'Batería al terminar', value: record.endPercent !== undefined ? `${record.endPercent} %` : undefined },
      { label: 'Tipo de carga', value: record.chargeType ? CHARGE_TYPE_LABELS[record.chargeType] : undefined },
      { label: 'Lugar', value: record.location },
    );
  } else {
    rows.push({ label: 'Estación', value: record.station });
  }
  rows.push({ label: 'Nota', value: record.note });
  return rows;
}
