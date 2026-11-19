import type { Href } from 'expo-router';

import { needsEnergyConfirmation } from '@/features/cars/capabilities';
import { ENERGY_META } from '@/features/energy/meta';
import { consumptionPairs, summarizeConsumption } from '@/features/energy/compute';
import type { AppData } from '@/features/session/types';
import { computeRollingYearStats } from '@/features/stats/compute';
import { formatCop, formatKm } from '@/shared/utils/format';

import { analysisEnergyKinds, changeBetween, comparePeriods } from './analytics';

/** Días sin lectura de km para considerarlo desactualizado (igual que la campana). */
export const ODOMETER_STALE_DAYS = 7;

export type StateGroup = 'maintenance' | 'documents' | 'odometer' | 'missing' | 'insufficient' | 'trend';

export type StateItem = {
  key: string;
  group: StateGroup;
  /** due = atrasado/vencido · soon = próximo · nodata = falta información · info = dato útil. */
  level: 'due' | 'soon' | 'nodata' | 'info';
  title: string;
  detail: string;
  href?: Href;
};

export type StateAnalysis = {
  items: StateItem[];
  counts: { due: number; soon: number; nodata: number };
};

export const STATE_GROUP_TITLES: Record<StateGroup, string> = {
  maintenance: 'Mantenimiento',
  documents: 'Documentos',
  odometer: 'Kilometraje',
  missing: 'Información faltante',
  insufficient: 'Datos insuficientes',
  trend: 'Evolución',
};

/**
 * Estado del carro SEGÚN LOS REGISTROS y las reglas que ya usa la app (estados de
 * componentes y documentos, días sin km, consumo comparable). No diagnostica fallas ni
 * supone problemas: si algo no está registrado, lo dice como información faltante.
 */
export function analyzeState(data: AppData, referenceDate: Date): StateAnalysis {
  const items: StateItem[] = [];

  for (const c of data.components) {
    if (!c.enabled) continue;
    const href: Href = { pathname: '/mi-carro/componente/[code]', params: { code: c.code } };
    if (c.status === 'due') {
      items.push({ key: `maint-due-${c.code}`, group: 'maintenance', level: 'due', title: `${c.title}: mantenimiento atrasado`, detail: c.detail, href });
    } else if (c.status === 'soon') {
      items.push({ key: `maint-soon-${c.code}`, group: 'maintenance', level: 'soon', title: `${c.title}: mantenimiento próximo`, detail: c.detail, href });
    } else if (c.status === 'nodata') {
      items.push({
        key: `maint-nodata-${c.code}`,
        group: 'missing',
        level: 'nodata',
        title: `${c.title}: faltan datos`,
        detail: 'Sin intervalo o sin último cambio registrado, no se puede saber si está al día.',
        href: { pathname: '/mi-carro/configurar/[code]', params: { code: c.code } },
      });
    }
  }

  for (const doc of data.documents) {
    const href: Href = { pathname: '/documentos/[key]', params: { key: doc.key } };
    if (doc.status === 'due') {
      items.push({ key: `doc-due-${doc.key}`, group: 'documents', level: 'due', title: `${doc.title}: vencido`, detail: doc.detail, href });
    } else if (doc.status === 'soon') {
      items.push({ key: `doc-soon-${doc.key}`, group: 'documents', level: 'soon', title: `${doc.title}: por vencer`, detail: doc.detail, href });
    } else if (doc.status === 'nodata' && (doc.type === 'soat' || doc.type === 'rtm' || doc.type === 'tax')) {
      items.push({ key: `doc-nodata-${doc.key}`, group: 'missing', level: 'nodata', title: `${doc.title}: sin fecha registrada`, detail: doc.detail, href });
    }
  }

  if (data.odometer.daysSinceReading >= ODOMETER_STALE_DAYS) {
    items.push({
      key: 'km-stale',
      group: 'odometer',
      level: 'soon',
      title: 'Kilometraje desactualizado',
      detail: `Tu último registro fue hace ${data.odometer.daysSinceReading} días. Actualízalo para que los estados sigan al día.`,
      href: '/registrar/kilometraje',
    });
  }

  if (needsEnergyConfirmation(data.profile)) {
    items.push({
      key: 'energy-unconfirmed',
      group: 'missing',
      level: 'nodata',
      title: 'Energía del carro sin confirmar',
      detail: 'Confírmala para ver los registros y análisis de energía que corresponden a tu carro.',
      href: '/mi-carro/editar',
    });
  }

  for (const kind of analysisEnergyKinds(data.profile, data.history)) {
    const hasRecords = data.history.some((e) => e.kind === kind);
    if (!hasRecords) continue;
    const consumption = summarizeConsumption(consumptionPairs(data.history, kind), kind);
    if (consumption.status === 'insufficient') {
      items.push({
        key: `consumption-${kind}`,
        group: 'insufficient',
        level: 'info',
        title: `Consumo de ${ENERGY_META[kind].section.toLowerCase()}`,
        detail: `${consumption.message}: ${kind === 'charge' ? 'faltan dos cargas que terminen en el mismo %' : 'faltan dos registros completos'} con su kilometraje.`,
      });
    }
  }

  const year = computeRollingYearStats(data.history, referenceDate);
  if (year.totalCop > 0 && year.costPerKmCop === undefined) {
    items.push({
      key: 'cost-per-km',
      group: 'insufficient',
      level: 'info',
      title: 'Costo por kilómetro',
      detail: 'Datos insuficientes: registra el kilometraje con más frecuencia para poder medirlo.',
    });
  }

  const three = comparePeriods(data.history, referenceDate).find((p) => p.months === 3);
  if (three?.enough) {
    const spend = changeBetween(three.current.metrics.totalCop, three.previous.metrics.totalCop);
    if (spend) {
      items.push({
        key: 'trend-spend',
        group: 'trend',
        level: 'info',
        title: 'Gastos de los últimos 3 meses',
        detail:
          spend.diff === 0
            ? `Igual que en los 3 meses anteriores (${formatCop(three.current.metrics.totalCop)}).`
            : `${formatCop(three.current.metrics.totalCop)}: ${formatCop(Math.abs(spend.diff))}${spend.percent !== undefined ? ` (${Math.abs(spend.percent)} %)` : ''} ${spend.diff > 0 ? 'más' : 'menos'} que en los 3 meses anteriores.`,
      });
    }
    const usage = changeBetween(three.current.metrics.km, three.previous.metrics.km);
    if (usage && three.current.metrics.km !== undefined) {
      items.push({
        key: 'trend-usage',
        group: 'trend',
        level: 'info',
        title: 'Uso de los últimos 3 meses',
        detail:
          usage.diff === 0
            ? `Recorriste lo mismo que en los 3 meses anteriores (${formatKm(three.current.metrics.km)}).`
            : `Recorriste ${formatKm(three.current.metrics.km)}: ${formatKm(Math.abs(usage.diff))} ${usage.diff > 0 ? 'más' : 'menos'} que en los 3 meses anteriores.`,
      });
    }
  }

  return {
    items,
    counts: {
      due: items.filter((i) => i.level === 'due').length,
      soon: items.filter((i) => i.level === 'soon').length,
      nodata: items.filter((i) => i.level === 'nodata').length,
    },
  };
}
