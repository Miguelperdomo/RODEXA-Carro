import { EXPENSE_CATEGORIES, NEW_EXPENSE_CATEGORIES, type ExpenseCategoryCode } from '@/features/expenses/catalog';
import type { HistoryEntry } from '@/features/history/types';
import type { IconName } from '@/shared/ui';
import { parseISODate, toISODate } from '@/shared/utils/date';

/**
 * Gastos que se repiten cada mes (garaje, cuota del crédito, seguro…). No se registran
 * solos: cada mes, desde el día elegido, "Hoy" pregunta si ya se pagó y lo deja listo
 * para registrarlo con un toque. Así el gasto real siempre lo confirma el usuario.
 */
export type RecurringExpense = {
  id: string;
  category: ExpenseCategoryCode;
  /** Valor de siempre (se puede cambiar al registrarlo). */
  amountCop: number;
  /** Día del mes en que se paga (1 a 31; en meses más cortos, el último día). */
  dayOfMonth: number;
  /** Nombre propio opcional ("Garaje del edificio"). */
  note?: string;
  /** Desde cuándo existe (AAAA-MM-DD): antes de esa fecha no se pregunta. */
  createdAt: string;
  /** En pausa: no se pregunta ni suma (el "Combustible del mes" fuera de Tranqui). No se borra. */
  paused?: boolean;
  /** Crédito del carro: cuántas cuotas son y cuántas ya se habían pagado antes de anotarlo. */
  credit?: CreditInfo;
};

export type CreditInfo = { totalInstallments: number; paidBefore: number };

/** Tope de cuotas de un crédito (10 años). */
export const MAX_INSTALLMENTS = 120;

/** Cuotas pagadas: las de antes de anotarlo + los pagos registrados en RODEXA (con el id del crédito). */
export function creditPaidCount(item: RecurringExpense, history: HistoryEntry[]): number {
  if (!item.credit) return 0;
  const registered = history.filter((e) => e.kind === 'expense' && e.recurringId === item.id).length;
  return Math.min(item.credit.totalInstallments, item.credit.paidBefore + registered);
}

/** Un crédito ya pagado por completo no vuelve a preguntar. */
export const creditFinished = (item: RecurringExpense, history: HistoryEntry[]) =>
  !!item.credit && creditPaidCount(item, history) >= item.credit.totalInstallments;

export const MAX_RECURRING = 20;
export const MAX_RECURRING_COP = 100_000_000;

/** Nombre para mostrar: el propio o el de la categoría. */
export function recurringLabel(item: RecurringExpense): string {
  return item.note?.trim() || EXPENSE_CATEGORIES.find((c) => c.code === item.category)?.label || 'Gasto';
}

export function recurringIcon(item: RecurringExpense): IconName {
  return EXPENSE_CATEGORIES.find((c) => c.code === item.category)?.icon ?? 'expense';
}

/** Día de pago en un mes concreto (el 31 en febrero → el 28 o 29). */
export function dueDayIn(item: RecurringExpense, year: number, month0: number): number {
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  return Math.min(item.dayOfMonth, lastDay);
}

/** ¿Ya se registró el pago de este mes? (un gasto ligado a este gasto fijo, en el mes). */
export function paidInMonth(item: RecurringExpense, history: HistoryEntry[], monthKey: string): boolean {
  return history.some((e) => e.kind === 'expense' && e.recurringId === item.id && e.date.startsWith(monthKey));
}

export type RecurringDue = { item: RecurringExpense; label: string; dueDate: string };

/**
 * Los que tocan este mes y aún no se registran: desde su día de pago hasta fin de mes.
 * Uno creado después del día de pago de este mes empieza a preguntar el mes siguiente.
 */
export function recurringDue(list: RecurringExpense[] | undefined, history: HistoryEntry[], today: Date): RecurringDue[] {
  if (!list?.length) return [];
  const monthKey = toISODate(today).slice(0, 7);
  return list.flatMap((item) => {
    if (item.paused || creditFinished(item, history)) return [];
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDayIn(item, today.getFullYear(), today.getMonth()));
    const dueIso = toISODate(dueDate);
    if (today.getDate() < dueDate.getDate()) return [];
    if (item.createdAt > dueIso) return [];
    if (paidInMonth(item, history, monthKey)) return [];
    return [{ item, label: recurringLabel(item), dueDate: dueIso }];
  });
}

export type RecurringInput = { category: ExpenseCategoryCode | null; amountCop: number | null; dayOfMonth: number | null };
export type RecurringErrors = { category?: string; amount?: string; day?: string };

/**
 * `allowFuel`: el combustible no se ofrece como gasto que se repite, salvo el "Combustible del
 * mes" que crea el estilo Tranqui (se puede editar y se lee del teléfono).
 */
export function validateRecurring(input: RecurringInput, opts: { allowFuel?: boolean } = {}): RecurringErrors {
  const errors: RecurringErrors = {};
  const categories = opts.allowFuel ? EXPENSE_CATEGORIES : NEW_EXPENSE_CATEGORIES;
  if (!input.category || !categories.some((c) => c.code === input.category)) errors.category = 'Elige una categoría.';
  if (input.amountCop === null || !Number.isInteger(input.amountCop) || input.amountCop <= 0) {
    errors.amount = 'Escribe el valor que pagas cada mes.';
  } else if (input.amountCop > MAX_RECURRING_COP) {
    errors.amount = 'Revisa el valor: parece tener un cero de más.';
  }
  if (input.dayOfMonth === null || !Number.isInteger(input.dayOfMonth) || input.dayOfMonth < 1 || input.dayOfMonth > 31) {
    errors.day = 'El día va de 1 a 31.';
  }
  return errors;
}

const isCreditInfo = (v: unknown): v is CreditInfo => {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    Number.isInteger(c.totalInstallments) &&
    (c.totalInstallments as number) >= 1 &&
    (c.totalInstallments as number) <= MAX_INSTALLMENTS &&
    Number.isInteger(c.paidBefore) &&
    (c.paidBefore as number) >= 0 &&
    (c.paidBefore as number) < (c.totalInstallments as number)
  );
};

const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISODate(v).getTime());

/** Lectura tolerante: los elementos que no tienen la forma esperada se descartan. */
export function sanitizeRecurring(raw: unknown): RecurringExpense[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.flatMap((v): RecurringExpense[] => {
    if (typeof v !== 'object' || v === null) return [];
    const r = v as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.category !== 'string' || !isIso(r.createdAt)) return [];
    const errors = validateRecurring({
      category: r.category as ExpenseCategoryCode,
      amountCop: typeof r.amountCop === 'number' ? r.amountCop : null,
      dayOfMonth: typeof r.dayOfMonth === 'number' ? r.dayOfMonth : null,
    }, { allowFuel: true });
    if (Object.keys(errors).length > 0) return [];
    return [
      {
        id: r.id,
        category: r.category as ExpenseCategoryCode,
        amountCop: r.amountCop as number,
        dayOfMonth: r.dayOfMonth as number,
        createdAt: r.createdAt,
        ...(typeof r.note === 'string' && r.note.trim() ? { note: r.note.trim() } : {}),
        ...(r.paused === true ? { paused: true } : {}),
        ...(isCreditInfo(r.credit) ? { credit: { totalInstallments: r.credit.totalInstallments, paidBefore: r.credit.paidBefore } } : {}),
      },
    ];
  }).slice(0, MAX_RECURRING);
}
