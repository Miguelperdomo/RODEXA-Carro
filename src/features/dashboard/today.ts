import type { Href } from 'expo-router';

import type { BudgetStatus } from '@/features/budget/rules';
import { customStatus, type CustomReminder } from '@/features/customReminders/rules';
import { recurringIcon, type RecurringDue } from '@/features/recurring/rules';
import { formatDay, formatWindows, statusOn, type PicoYPlacaConfig } from '@/features/picoYPlaca/rules';
import { isWeeklyDue } from '@/features/weeklyCheck/rules';
import { documentStatusLabels, maintenanceStatusLabels } from '@/shared/theme';
import type { IconName } from '@/shared/ui';
import { formatCop, formatDaysAgo } from '@/shared/utils/format';

import { blockersSentence, readinessHeadline, renewWord, unknownSentence, type Readiness } from './readiness';
import type { StatusItem } from './types';

/**
 * Bloque "Hoy" de Inicio: lo más importante del día en un solo lugar, según lo que el
 * usuario registró y configuró. Nunca dice "puedes circular" ni inventa nada.
 */
export type TodayTone = 'due' | 'soon' | 'info' | 'ok';

export type TodayItem = {
  key: string;
  icon: IconName;
  tone: TodayTone;
  title: string;
  detail: string;
  /** Pantalla que se abre al tocar la fila (la de "nada pendiente" no abre nada). */
  href?: Href;
  /** Componente de mantenimiento de la fila (para no repetirlo en "Próximo mantenimiento"). */
  componentCode?: string;
};

export type TodayInput = {
  picoYPlaca: PicoYPlacaConfig | undefined;
  statusItems: StatusItem[];
  /** ≥ 7 días sin lectura de km y el usuario tiene activos esos recordatorios. */
  kmCheckDue: boolean;
  daysSinceReading: number;
  weeklySettings: Parameters<typeof isWeeklyDue>[0];
  /** Presupuesto del mes, si el usuario lo configuró. */
  budget?: BudgetStatus;
  /** Gastos que se repiten y tocan este mes (aún sin registrar). */
  recurring?: RecurringDue[];
  /** Recordatorios que creó el usuario (se muestran los vencidos y los próximos). */
  customReminders?: CustomReminder[];
  currentKm?: number;
  /** ¿Cómo está mi carro? (documentos obligatorios vencidos o sin fecha). */
  readiness?: Readiness;
  today: Date;
};

/** "Garaje del edificio" → "garaje del edificio"; las siglas ("SOAT") se dejan igual. */
function inSentence(label: string): string {
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

/** Máximo de filas: lo demás sigue en "Estado de mi carro". */
export const TODAY_MAX_ITEMS = 4;

const TONE_ORDER: Record<TodayTone, number> = { due: 0, soon: 1, info: 2, ok: 3 };

/** Filas del bloque (como máximo TODAY_MAX_ITEMS) y cuántas más hay en "Estado de mi carro". */
export function buildToday(input: TodayInput): { items: TodayItem[]; more: number } {
  const items: TodayItem[] = [];
  const readiness = input.readiness;
  const blockerKeys = new Set(readiness?.blockers.map((d) => d.key) ?? []);

  // Documentos obligatorios vencidos: primero y con claridad (regla de readiness).
  if (readiness?.level === 'blocked') {
    items.push({
      key: 'readiness-blocked',
      icon: 'statusDue',
      tone: 'due',
      title: readinessHeadline(readiness),
      detail: `${blockersSentence(readiness)} según la fecha que registraste. ${renewWord(readiness)} antes de salir.`,
      href: '/documentos',
    });
  }

  // Pico y placa: solo si lo configuró (y siempre "según lo que configuraste").
  const pyp = statusOn(input.picoYPlaca, input.today);
  if (pyp.kind === 'today') {
    items.push({
      key: 'pico-y-placa',
      icon: 'car',
      tone: 'soon',
      title: 'Hoy tienes pico y placa',
      detail: `${formatWindows(pyp.windows)} · según lo que configuraste`,
      href: '/mi-carro/pico-y-placa',
    });
  } else if (pyp.kind === 'not_today') {
    items.push({
      key: 'pico-y-placa',
      icon: 'car',
      tone: 'info',
      title: 'Hoy no tienes pico y placa',
      detail: `${pyp.next ? `Próximo: ${pyp.tomorrow ? 'mañana' : formatDay(pyp.next)}` : 'Sin próximos días configurados'} · según lo que configuraste`,
      href: '/mi-carro/pico-y-placa',
    });
  }

  // Lo vencido o pendiente primero; lo próximo después (las filas ya llegan ordenadas).
  for (const item of input.statusItems) {
    if (item.status !== 'due' && item.status !== 'soon') continue;
    // Ya va arriba en "Tienes documentos vencidos".
    if (item.kind === 'document' && blockerKeys.has(item.id)) continue;
    const labels = item.kind === 'document' ? documentStatusLabels : maintenanceStatusLabels;
    items.push({
      key: `status-${item.id}`,
      icon: item.icon,
      tone: item.status,
      title: `${item.title}: ${labels[item.status].toLowerCase()}`,
      detail: item.detail,
      href: item.href,
      ...(item.kind === 'maintenance' ? { componentCode: item.id } : {}),
    });
  }

  // Recordatorios del usuario: los vencidos y los próximos.
  for (const reminder of input.customReminders ?? []) {
    const status = customStatus(reminder, input.currentKm ?? 0, input.today);
    if (status.level !== 'due' && status.level !== 'soon') continue;
    items.push({
      key: `custom-${reminder.id}`,
      icon: 'notifications',
      tone: status.level,
      title: reminder.title,
      detail: status.detail,
      href: { pathname: '/mi-carro/recordatorio', params: { id: reminder.id } },
    });
  }

  // Gastos que se repiten: "¿Ya pagaste…?" y se registra con un toque.
  for (const due of input.recurring ?? []) {
    items.push({
      key: `recurring-${due.item.id}`,
      icon: recurringIcon(due.item),
      tone: 'info',
      title: `¿Ya pagaste ${inSentence(due.label)}?`,
      detail: `${formatCop(due.item.amountCop)} · toca para registrarlo`,
      href: { pathname: '/registrar/gasto', params: { recurrente: due.item.id } },
    });
  }

  // Presupuesto: solo desde el 80 % (antes no es algo de "hoy").
  const budget = input.budget;
  if (budget && budget.level !== 'ok') {
    items.push({
      key: 'budget',
      icon: 'expense',
      tone: budget.level === 'over' ? 'due' : 'soon',
      title: budget.level === 'over' ? 'Superaste el presupuesto del mes' : `Llevas el ${budget.percent} % de tu presupuesto`,
      detail:
        budget.level === 'over'
          ? `${formatCop(budget.spentCop)} de ${formatCop(budget.limitCop)} · ${formatCop(budget.overCop)} de más`
          : `${formatCop(budget.spentCop)} de ${formatCop(budget.limitCop)} · quedan ${formatCop(budget.remainingCop)}`,
      href: '/mi-carro/presupuesto',
    });
  }

  if (isWeeklyDue(input.weeklySettings, input.today)) {
    items.push({
      key: 'weekly-inspection',
      icon: 'checklist',
      tone: 'info',
      title: 'Revisión semanal',
      detail: '5 puntos rápidos: llantas, luces, frenos y más',
      href: '/revision-semanal',
    });
  }

  if (input.kmCheckDue) {
    items.push({
      key: 'km-check',
      icon: 'odometer',
      tone: 'info',
      title: '¿Cuánto marca tu carro hoy?',
      detail: `Tu último registro fue ${formatDaysAgo(input.daysSinceReading)}. Míralo en el tablero.`,
      href: '/registrar/kilometraje',
    });
  }

  // Orden estable por importancia: vencido → próximo → para hacer hoy.
  const sorted = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => TONE_ORDER[a.item.tone] - TONE_ORDER[b.item.tone] || a.index - b.index)
    .map(({ item }) => item);

  if (sorted.length === 0) {
    // Sin la fecha de un documento obligatorio nunca se dice "nada pendiente".
    if (readiness?.level === 'missing') {
      return {
        items: [
          {
            key: 'readiness-missing',
            icon: 'statusNoData',
            tone: 'info',
            title: readinessHeadline(readiness),
            detail: unknownSentence(readiness),
            href: '/documentos',
          },
        ],
        more: 0,
      };
    }
    return {
      items: [
        {
          key: 'all-good',
          icon: 'statusOk',
          tone: 'ok',
          title: 'Nada pendiente para hoy',
          detail: 'Según lo que tienes registrado',
        },
      ],
      more: 0,
    };
  }
  return { items: sorted.slice(0, TODAY_MAX_ITEMS), more: Math.max(0, sorted.length - TODAY_MAX_ITEMS) };
}
