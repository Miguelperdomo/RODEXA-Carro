import { MAINTENANCE_ITEMS } from '@/features/maintenance/catalog';
import { intervalOriginText, NO_INTERVAL_MESSAGE } from '@/features/maintenance/intervals';
import type { HistoryEntry } from '@/features/history/types';
import type { StatusLevel } from '@/shared/theme';
import { addMonths, daysBetween, formatDate, parseISODate } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

import { TIME_BASED_COMPONENTS } from './catalog';
import type { ComponentSummary } from './types';
import { cmpText } from '@/shared/utils/compare';

/** Margen de aviso: 15 % del intervalo (docs/diseno-funcional.md §8.2). */
const WARN_RATIO = 0.15;

export type Requirement = {
  label: string;
  /** Versión corta para la lista de Mi carro: "Falta: intervalo en km". */
  short: string;
  done: boolean;
};

/** Cómo se controla: por km, por meses, o por ambos ("lo que llegue primero"). */
export type Tracking = 'km' | 'time' | 'both';

type Side = { status: StatusLevel; urgency: number; next: string; remaining: string; warn: string };

const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const SEVERITY: Record<StatusLevel, number> = { due: 0, soon: 1, ok: 2, nodata: 3, na: 4 };

/** Qué pedir cuando todavía no hay intervalo. */
const INTERVAL_REQUIREMENT: Record<Tracking, { label: string; short: string }> = {
  km: { label: 'Cada cuántos km (o meses) se hace', short: 'intervalo en km o meses' },
  time: { label: 'Cada cuántos meses se cambia', short: 'intervalo en meses' },
  both: { label: 'Cada cuántos km o meses se hace', short: 'intervalo' },
};

export type ComponentDetailView = {
  tracking: Tracking;
  lastService?: {
    title: string;
    date?: string;
    km?: string;
    cost?: string;
    note?: string;
    /** Km recorridos desde ese cambio (km registrado − km del cambio). Sin km conocido → undefined. */
    kmSince?: number;
  };
  interval?: string;
  /** "Configurado por ti" o "Según fabricante/manual: fuente…". */
  intervalOrigin?: string;
  /** Sin intervalo: se pide consultar el manual (nunca se propone una cifra). */
  intervalHint?: string;
  next?: string;
  remaining?: string;
  warn?: string;
  /** Lo que falta para que RODEXA Carro pueda calcular el estado. */
  requirements: Requirement[];
  ready: boolean;
  /** Configuró km y meses, pero solo uno se puede calcular: qué falta para el otro. */
  partialNote?: string;
  /** Estado calculado (solo si `ready`): vencido, próximo (margen 15 %) o al día. */
  status?: StatusLevel;
  /** Lo que falta por km Y por tiempo ("Faltan 1.200 km o ~2 meses"), si se controlan ambos. */
  remainingAll?: string;
  /** Fracción del intervalo que queda en el lado que manda (≤ 0 = vencido). Para la barra de progreso. */
  remainingRatio?: number;
};

/** "Falta: km del último cambio y intervalo en km" (vacío si no falta nada). */
export function missingSummary(view: ComponentDetailView): string {
  const missing = view.requirements.filter((r) => !r.done).map((r) => r.short);
  return missing.length > 0 ? `Falta: ${missing.join(' y ')}` : '';
}

/** ¿El último cambio que indicó el usuario al configurar es posterior al registro del historial? */
export function configIsNewer(
  config: { km?: number; date?: string; setAt?: string },
  entry: { date: string; km: number | null } | undefined,
): boolean {
  if (!entry) return true;
  if (config.date) return config.date > entry.date;
  if (config.km !== undefined && entry.km !== null) return config.km > entry.km;
  // Sin fecha ni km comparables: solo si se configuró un día DESPUÉS del servicio.
  return config.setAt !== undefined && config.setAt > entry.date;
}

function elapsedText(from: Date, to: Date): string {
  const days = daysBetween(from, to);
  if (days <= 0) return 'hoy';
  if (days < 60) return `hace ${days} días`;
  return `hace ~${Math.round(days / 30)} meses`;
}

/**
 * Arma los textos del detalle de un componente a partir de sus datos y del historial.
 * No inventa nada: si falta un dato, lo deja vacío y lo agrega a `requirements`.
 */
export function buildComponentDetail(
  component: ComponentSummary,
  history: HistoryEntry[],
  currentKm: number,
  today: Date,
): ComponentDetailView {
  // km, meses o ambos, según lo configurado; sin intervalo, el modo habitual del componente.
  const configured = component.interval;
  const tracking: Tracking =
    configured?.km && configured?.months
      ? 'both'
      : configured?.months
        ? 'time'
        : configured?.km
          ? 'km'
          : TIME_BASED_COMPONENTS.includes(component.code)
            ? 'time'
            : 'km';

  // Último mantenimiento del historial que pone "al día" este componente.
  const trackingItems = MAINTENANCE_ITEMS.filter((item) => item.tracks === component.code);
  const lastEntry = history
    .filter(
      (e): e is Extract<HistoryEntry, { kind: 'maintenance' }> =>
        e.kind === 'maintenance' && e.types.some((t) => trackingItems.some((i) => i.code === t)),
    )
    .sort((a, b) => cmpText(b.date, a.date))[0];

  // Lo que el usuario indicó al configurar manda solo si describe un servicio MÁS
  // RECIENTE que el último mantenimiento registrado (por su fecha o, sin fecha, por su
  // km). Un registro del mismo día o posterior siempre cuenta.
  const useConfig = component.lastService?.setAt !== undefined && configIsNewer(component.lastService, lastEntry);
  const lastEntryUsed = useConfig ? undefined : lastEntry;

  // El km es del MISMO registro que la fecha: si ese mantenimiento tiene km desconocido,
  // no se toma el de otro registro más antiguo.
  const lastKm = lastEntryUsed ? (lastEntryUsed.km ?? undefined) : component.lastService?.km;
  const lastKmUnknown = lastEntryUsed !== undefined && lastEntryUsed.km === null;
  const lastDateIso = lastEntryUsed?.date ?? component.lastService?.date;
  const lastDate = lastDateIso ? parseISODate(lastDateIso) : undefined;

  const lastService =
    lastEntryUsed || component.lastService
      ? {
          title: lastEntryUsed
            ? trackingItems
                .filter((i) => lastEntryUsed.types.includes(i.code))
                .map((i) => i.label)
                .join(', ')
            : 'Dato ingresado en la configuración',
          date: lastDate ? `${formatDate(lastDate)} (${elapsedText(lastDate, today)})` : undefined,
          km: lastKm !== undefined ? formatKm(lastKm) : lastKmUnknown ? 'Desconocido' : undefined,
          cost: lastEntryUsed?.costCop !== undefined ? formatCop(lastEntryUsed.costCop) : undefined,
          note: lastEntryUsed?.note,
          kmSince: lastKm !== undefined && currentKm >= lastKm ? currentKm - lastKm : undefined,
        }
      : undefined;

  const intervalInfo = component.interval
    ? { intervalOrigin: intervalOriginText(component.interval) }
    : { intervalHint: NO_INTERVAL_MESSAGE };

  const intervalKm = component.interval?.km;
  const months = component.interval?.months;
  const usesKm = tracking === 'km' || tracking === 'both';
  const usesTime = tracking === 'time' || tracking === 'both';

  // Cada lado (km / tiempo) se calcula solo si tiene su intervalo y su último dato.
  const kmSide: Side | undefined =
    usesKm && intervalKm !== undefined && lastKm !== undefined
      ? (() => {
          const nextKm = lastKm + intervalKm;
          const kmLeft = nextKm - currentKm;
          return {
            status: kmLeft <= 0 ? 'due' : kmLeft <= intervalKm * WARN_RATIO ? 'soon' : 'ok',
            urgency: kmLeft / intervalKm,
            next: formatKm(nextKm),
            remaining: kmLeft > 0 ? `Faltan ${formatKm(kmLeft)}` : `Pasaron ${formatKm(Math.abs(kmLeft))} del previsto`,
            warn: `cuando falten ${formatKm(Math.round(intervalKm * WARN_RATIO))}`,
          };
        })()
      : undefined;
  const timeSide: Side | undefined =
    usesTime && months !== undefined && lastDate !== undefined
      ? (() => {
          const nextDate = addMonths(lastDate, months);
          const daysLeft = daysBetween(today, nextDate);
          const warnMonths = Math.max(1, Math.round(months * WARN_RATIO));
          return {
            status: daysLeft <= 0 ? 'due' : daysLeft <= months * 30 * WARN_RATIO ? 'soon' : 'ok',
            urgency: daysLeft / (months * 30),
            next: formatDate(nextDate),
            remaining:
              daysLeft > 60
                ? `Faltan ~${Math.round(daysLeft / 30)} meses`
                : daysLeft > 0
                  ? `Faltan ${daysLeft} días`
                  : `Se cumplió hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`,
            warn: `~${warnMonths} ${warnMonths === 1 ? 'mes' : 'meses'} antes`,
          };
        })()
      : undefined;

  const requirements: Requirement[] = [
    ...(usesKm
      ? [{ label: 'El kilometraje del último cambio', short: 'km del último cambio', done: lastKm !== undefined }]
      : []),
    ...(usesTime
      ? [{ label: 'La fecha del último cambio', short: 'fecha del último cambio', done: lastDate !== undefined }]
      : []),
    {
      label: intervalKm || months ? 'El intervalo' : INTERVAL_REQUIREMENT[tracking].label,
      short: INTERVAL_REQUIREMENT[tracking].short,
      done: intervalKm !== undefined || months !== undefined,
    },
  ];

  const interval =
    intervalKm && months
      ? `Cada ${formatKm(intervalKm)} o ${months} meses, lo que llegue primero`
      : intervalKm
        ? `Cada ${formatKm(intervalKm)}`
        : months
          ? `Cada ${months} meses`
          : undefined;

  // Con ambos: manda lo que llegue primero (el estado más urgente; a igual estado, el más cercano).
  const sides = [kmSide, timeSide].filter((side): side is Side => side !== undefined);
  const decisive = [...sides].sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.urgency - b.urgency)[0];
  // Configuró km y meses pero solo uno se puede calcular: se dice qué falta para el otro.
  const partialNote =
    tracking === 'both' && sides.length === 1
      ? kmSide
        ? 'Falta la fecha del último cambio para avisarte también por tiempo.'
        : 'Falta el kilometraje del último cambio para avisarte también por kilometraje.'
      : undefined;

  if (!decisive) {
    return { tracking, lastService, ...intervalInfo, interval, requirements, ready: false };
  }
  return {
    tracking,
    lastService,
    ...intervalInfo,
    interval,
    next: sides.map((side) => side.next).join(' o '),
    remaining: decisive.remaining,
    warn: upperFirst(sides.map((side) => side.warn).join(' o ')),
    partialNote,
    requirements,
    ready: true,
    status: decisive.status,
    remainingAll:
      sides.length > 1 && sides.every((s) => s.status !== 'due')
        ? `${sides[0].remaining} o ${sides[1].remaining.replace(/^Faltan /, '')}`
        : decisive.remaining,
    remainingRatio: decisive.urgency,
  };
}
