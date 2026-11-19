import { documentRecordTitle } from '@/features/documents/presentation';
import { entryCost } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { formatRecordKm } from '@/features/odometer/recordKm';
import { notedParts } from '@/features/parts/userSpecs';
import type { AppData, CarSheet } from '@/features/session/types';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

import { vehicleInfoRows } from './vehicleOptions';
import { cmpText } from '@/shared/utils/compare';

/**
 * Hoja de vida del carro: todo lo que registraste, en orden, para tenerlo a mano o
 * mostrarlo al vender. Es un resumen de tus registros, NO un certificado: RODEXA no
 * verifica los datos ni consulta el RUNT.
 */
export type LifeRow = { label: string; value: string };
export type LifeService = { date: string; km: string; title: string; cost?: string; note?: string };
export type LifeDocument = { date: string; title: string; detail: string };

export type LifeRecord = {
  carName: string;
  vehicle: LifeRow[];
  currentKm: string;
  services: LifeService[];
  serviceCount: number;
  serviceTotalCop: number;
  documents: LifeDocument[];
  parts: LifeRow[];
};

export const LIFE_RECORD_DISCLAIMER =
  'Resumen de lo registrado por el propietario en RODEXA Carro. No es un certificado: RODEXA no verifica estos datos.';

type Maintenance = Extract<HistoryEntry, { kind: 'maintenance' }>;

export function buildLifeRecord(data: AppData, sheet: CarSheet, partLabel: (code: string) => string): LifeRecord {
  const { profile } = data;
  const vehicle: LifeRow[] = vehicleInfoRows(profile)
    .filter((r) => r.value)
    .map((r) => ({ label: r.label, value: r.value! }));
  if (sheet.chassisNumber) vehicle.push({ label: 'Número de chasis (VIN)', value: sheet.chassisNumber });
  if (sheet.engineNumber) vehicle.push({ label: 'Número de motor', value: sheet.engineNumber });

  const maintenances = data.history
    .filter((e): e is Maintenance => e.kind === 'maintenance')
    .sort((a, b) => cmpText(b.date, a.date));
  const services = maintenances.map((m) => ({
    date: formatDate(parseISODate(m.date)),
    km: formatRecordKm(m.km),
    title: m.types.map(maintenanceLabel).join(', '),
    cost: m.costCop !== undefined ? formatCop(m.costCop) : undefined,
    note: m.note,
  }));

  const documents = data.history
    .filter((e): e is Extract<HistoryEntry, { kind: 'document' }> => e.kind === 'document')
    .sort((a, b) => cmpText(b.date, a.date))
    .map((d) => ({
      date: formatDate(parseISODate(d.date)),
      title: documentRecordTitle(d),
      detail: d.expiresAt ? `Vence el ${formatDate(parseISODate(d.expiresAt))}` : d.notApplicable ? 'Aún no aplica' : 'Registrado',
    }));

  return {
    carName: [profile.brandName, profile.model, profile.year].filter(Boolean).join(' ') || 'Mi carro',
    vehicle,
    currentKm: formatKm(data.odometer.registeredKm),
    services,
    serviceCount: maintenances.length,
    serviceTotalCop: maintenances.reduce((s, m) => s + entryCost(m), 0),
    documents,
    parts: notedParts(sheet).map((p) => ({ label: partLabel(p.code), value: p.summary })),
  };
}

/** Texto para compartir (WhatsApp, correo…). El usuario decide si lo envía. */
export function lifeRecordText(record: LifeRecord, generatedOn: Date): string {
  const lines = [`HOJA DE VIDA · ${record.carName}`, `Kilometraje registrado: ${record.currentKm}`, ''];
  if (record.vehicle.length) {
    lines.push('DATOS DEL VEHÍCULO', ...record.vehicle.map((r) => `• ${r.label}: ${r.value}`), '');
  }
  lines.push(`MANTENIMIENTOS (${record.serviceCount})`);
  if (record.services.length === 0) lines.push('• Sin mantenimientos registrados');
  for (const s of record.services) {
    lines.push(`• ${s.date} · ${s.km} · ${s.title}${s.cost ? ` · ${s.cost}` : ''}${s.note ? ` (${s.note})` : ''}`);
  }
  if (record.documents.length) lines.push('', 'DOCUMENTOS', ...record.documents.map((d) => `• ${d.date} · ${d.title} · ${d.detail}`));
  if (record.parts.length) lines.push('', 'REPUESTOS QUE USA', ...record.parts.map((p) => `• ${p.label}: ${p.value}`));
  lines.push('', `Generada el ${formatDate(generatedOn)}.`, LIFE_RECORD_DISCLAIMER);
  return lines.join('\n');
}
