import type { Href } from 'expo-router';

import type { AppData } from '@/features/session/types';
import type { Palette, StatusLevel } from '@/shared/theme';

/**
 * Puntaje de cuidado (0 a 100), SOLO con tus registros y las reglas de la app. Es una
 * guía para saber qué tan al día llevas tu carro, no una evaluación mecánica. Lo que no
 * tiene datos no suma ni resta: se excluye y se dice qué falta.
 */
export type CarePartKey = 'maintenance' | 'documents' | 'odometer';

export type CarePart = {
  key: CarePartKey;
  title: string;
  /** Puntos máximos de esta parte. */
  weight: number;
  /** 0–1. undefined = sin datos (no cuenta). */
  value?: number;
  detail: string;
};

export type CareTip = { text: string; level: StatusLevel; href?: Href };

export type CareScore = {
  /** undefined = sin suficiente información. */
  score?: number;
  label?: string;
  parts: CarePart[];
  tips: CareTip[];
};

const WEIGHTS: Record<CarePartKey, number> = { maintenance: 50, documents: 30, odometer: 20 };
/** Valor de cada estado: al día cuenta completo, próximo a medias, vencido nada. */
const STATUS_VALUE: Partial<Record<StatusLevel, number>> = { ok: 1, na: 1, soon: 0.6, due: 0 };
/** Documentos del carro que cuentan si están registrados. */
const SCORED_DOCUMENTS = ['soat', 'rtm', 'tax', 'policy'];

const average = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : undefined);

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Muy bien';
  if (score >= 55) return 'Puede mejorar';
  return 'Necesita atención';
}

export function careScore(data: AppData): CareScore {
  const tips: CareTip[] = [];

  // Mantenimiento: componentes activos con estado calculado (los "Sin datos" no cuentan).
  const rated = data.components.filter((c) => c.enabled && STATUS_VALUE[c.status] !== undefined);
  const missing = data.components.filter((c) => c.enabled && c.status === 'nodata');
  for (const c of rated.filter((c) => c.status === 'due' || c.status === 'soon')) {
    tips.push({
      level: c.status,
      text: c.status === 'due' ? `${c.title}: está pendiente. Hazlo y regístralo.` : `${c.title}: está próximo.`,
      href: { pathname: '/mi-carro/componente/[code]', params: { code: c.code } },
    });
  }
  const maintenance: CarePart = {
    key: 'maintenance',
    title: 'Mantenimientos al día',
    weight: WEIGHTS.maintenance,
    value: average(rated.map((c) => STATUS_VALUE[c.status]!)),
    detail:
      rated.length === 0
        ? 'Sin datos: configura el intervalo y el último cambio de tus componentes.'
        : `${rated.filter((c) => c.status === 'ok').length} de ${rated.length} al día${missing.length ? ` · ${missing.length} sin datos` : ''}`,
  };
  if (missing.length > 0) {
    tips.push({ level: 'nodata', text: `Completa los datos de ${missing.length === 1 ? missing[0].title.toLowerCase() : `${missing.length} componentes`} para que cuenten.`, href: '/(tabs)/carro' });
  }

  // Documentos: solo los registrados (los vencidos restan; los que no están, se piden).
  const docs = data.documents.filter((d) => SCORED_DOCUMENTS.includes(d.type) && d.records > 0 && STATUS_VALUE[d.status] !== undefined);
  for (const d of docs.filter((d) => d.status === 'due' || d.status === 'soon')) {
    tips.push({
      level: d.status,
      text: d.status === 'due' ? `${d.title}: vencido según la fecha que registraste.` : `${d.title}: por vencer.`,
      href: { pathname: '/documentos/[key]', params: { key: d.key } },
    });
  }
  const soat = data.documents.find((d) => d.type === 'soat');
  if (!soat || soat.records === 0) tips.push({ level: 'nodata', text: 'Registra tu SOAT para que cuente.', href: '/registrar/documento' });
  const documents: CarePart = {
    key: 'documents',
    title: 'Documentos vigentes',
    weight: WEIGHTS.documents,
    value: average(docs.map((d) => STATUS_VALUE[d.status]!)),
    detail: docs.length === 0 ? 'Sin datos: registra tu SOAT y tu tecnomecánica.' : `${docs.filter((d) => d.status === 'ok' || d.status === 'na').length} de ${docs.length} al día`,
  };

  // Kilometraje: qué tan reciente es la última lectura.
  const days = data.odometer.daysSinceReading;
  const odometerValue = days <= 7 ? 1 : days <= 14 ? 0.7 : days <= 30 ? 0.4 : 0;
  if (days > 7) tips.push({ level: 'soon', text: `Actualiza el kilometraje: tu último registro fue hace ${days} días.`, href: '/registrar/kilometraje' });
  const odometer: CarePart = {
    key: 'odometer',
    title: 'Kilometraje actualizado',
    weight: WEIGHTS.odometer,
    value: odometerValue,
    detail: days === 0 ? 'Actualizado hoy' : `Último registro hace ${days} ${days === 1 ? 'día' : 'días'}`,
  };

  const parts = [maintenance, documents, odometer];
  const counted = parts.filter((p) => p.value !== undefined);
  const totalWeight = counted.reduce((s, p) => s + p.weight, 0);
  // Con solo el kilometraje no hay suficiente información para un puntaje.
  const enough = counted.some((p) => p.key !== 'odometer');
  const score = enough && totalWeight > 0 ? Math.round((counted.reduce((s, p) => s + p.weight * p.value!, 0) / totalWeight) * 100) : undefined;

  const order: Record<StatusLevel, number> = { due: 0, soon: 1, nodata: 2, ok: 3, na: 4 };
  return {
    score,
    label: score !== undefined ? scoreLabel(score) : undefined,
    parts,
    tips: tips.sort((a, b) => order[a.level] - order[b.level]),
  };
}

/** Color del puntaje con los colores de estado de la app. */
export function scoreTone(score: number | undefined, colors: Palette) {
  if (score === undefined) return colors.status.nodata;
  if (score >= 75) return colors.status.ok;
  if (score >= 55) return colors.status.soon;
  return colors.status.due;
}
