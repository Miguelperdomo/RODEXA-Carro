import type { HistoryEntry } from '@/features/history/types';
import type { OnboardingCredit } from '@/features/session/types';
import {
  creditPaidCount,
  dueDayIn,
  MAX_INSTALLMENTS,
  paidInMonth,
  type CreditInfo,
  type RecurringExpense,
} from '@/features/recurring/rules';
import { addDays, addMonths, formatMonthYear, parseISODate, toISODate } from '@/shared/utils/date';

/**
 * Crédito de mi carro. Es un gasto que se repite (categoría "Cuota del crédito o leasing") con
 * datos de más: cuántas cuotas son y cuántas ya se habían pagado antes de anotarlo. Así usa lo
 * que ya existe: "Hoy" pregunta por la cuota desde su día de pago y el pago queda como gasto
 * en el historial. RODEXA NO calcula intereses: solo cuenta cuotas con el valor fijo que la
 * persona escribió.
 */
export { MAX_INSTALLMENTS };

export type CreditItem = RecurringExpense & { credit: CreditInfo };

export const CREDIT_NAME = 'Cuota del carro';

/** El crédito del carro (solo hay uno). */
export function creditOf(items: RecurringExpense[]): CreditItem | undefined {
  return items.find((x): x is CreditItem => !!x.credit);
}

/** Pagos de la cuota registrados en RODEXA, del más reciente al más antiguo. */
export function creditPayments(item: RecurringExpense, history: HistoryEntry[]) {
  return history
    .filter((e): e is Extract<HistoryEntry, { kind: 'expense' }> => e.kind === 'expense' && e.recurringId === item.id)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const monthKey = (d: Date) => toISODate(d).slice(0, 7);

/** ¿Ya pasó (o es hoy) el día de pago de este mes? */
export function creditDueDayPassed(dayOfMonth: number, today: Date): boolean {
  return today.getDate() >= Math.min(dayOfMonth, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
}

export type CreditProgress = {
  total: number;
  paid: number;
  remaining: number;
  /** 0 a 1. */
  ratio: number;
  finished: boolean;
  /** La cuota de este mes ya está pagada (registrada en RODEXA o marcada al anotar el crédito). */
  paidThisMonth: boolean;
  /** Próximo pago (AAAA-MM-DD). Sin valor si ya terminó. */
  nextDue?: string;
  /** Mes de la última cuota ("2028-01"). Sin valor si ya terminó. */
  lastMonth?: string;
  /** Con la cuota fija que anotó (sin intereses de mora ni abonos). */
  paidCop: number;
  remainingCop: number;
};

export function creditProgress(item: CreditItem, history: HistoryEntry[], today: Date): CreditProgress {
  const total = item.credit.totalInstallments;
  const paid = creditPaidCount(item, history);
  const remaining = total - paid;
  const finished = remaining === 0;
  const thisMonthDue = toISODate(new Date(today.getFullYear(), today.getMonth(), dueDayIn(item, today.getFullYear(), today.getMonth())));
  // Pagada este mes: registrada, o al anotarlo dijo que ya la pagó (creado después del día de pago).
  const paidNow = paidInMonth(item, history, monthKey(today)) || item.createdAt > thisMonthDue;
  const nextMonthStart = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), paidNow ? 1 : 0);
  const nextDay = dueDayIn(item, nextMonthStart.getFullYear(), nextMonthStart.getMonth());
  return {
    total,
    paid,
    remaining,
    ratio: total > 0 ? paid / total : 0,
    finished,
    paidThisMonth: paidNow,
    nextDue: finished ? undefined : toISODate(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), nextDay)),
    lastMonth: finished ? undefined : monthKey(addMonths(nextMonthStart, remaining - 1)),
    paidCop: item.amountCop * paid,
    remainingCop: item.amountCop * remaining,
  };
}

/** "2028-01" → "Enero 2028". */
export function monthLabel(month: string): string {
  const label = formatMonthYear(parseISODate(`${month}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Texto corto para Mi carro: "14 cuotas por pagar · terminas en Enero 2028". */
export function creditShort(p: CreditProgress): string {
  if (p.finished) return 'Crédito pagado por completo';
  const left = `${p.remaining} ${p.remaining === 1 ? 'cuota' : 'cuotas'} por pagar`;
  return p.lastMonth ? `${left} · terminas en ${monthLabel(p.lastMonth)}` : left;
}

export type CreditInput = {
  amountCop: number | null;
  totalInstallments: number | null;
  paidBefore: number | null;
  dayOfMonth: number | null;
};

export type CreditErrors = { amount?: string; total?: string; paid?: string; day?: string };

export function validateCredit(input: CreditInput): CreditErrors {
  const errors: CreditErrors = {};
  if (input.amountCop === null || input.amountCop <= 0) errors.amount = 'Escribe el valor de la cuota.';
  else if (input.amountCop > 100_000_000) errors.amount = 'Revisa el valor: parece tener un cero de más.';
  if (
    input.totalInstallments === null ||
    !Number.isInteger(input.totalInstallments) ||
    input.totalInstallments < 1 ||
    input.totalInstallments > MAX_INSTALLMENTS
  ) {
    errors.total = `Escribe cuántas cuotas son (de 1 a ${MAX_INSTALLMENTS}).`;
  }
  if (
    input.paidBefore !== null &&
    (!Number.isInteger(input.paidBefore) ||
      input.paidBefore < 0 ||
      (input.totalInstallments !== null && input.paidBefore >= input.totalInstallments))
  ) {
    errors.paid = 'Deben ser menos cuotas que el total.';
  }
  if (input.dayOfMonth === null || !Number.isInteger(input.dayOfMonth) || input.dayOfMonth < 1 || input.dayOfMonth > 31) {
    errors.day = 'El día va de 1 a 31.';
  }
  return errors;
}

/**
 * Desde cuándo "Hoy" pregunta por la cuota. Si el día de pago de este mes ya pasó:
 * - "Ya la pagué" → desde el día siguiente al pago (este mes no se pregunta);
 * - "Todavía no" → desde el 1 del mes (se pregunta ya, para registrarla).
 * Si el día de pago aún no llega, desde hoy.
 */
export function creditCreatedAt(dayOfMonth: number, paidThisMonth: boolean | null, today: Date): string {
  if (!creditDueDayPassed(dayOfMonth, today)) return toISODate(today);
  const due = new Date(today.getFullYear(), today.getMonth(), Math.min(dayOfMonth, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()));
  return paidThisMonth ? toISODate(addDays(due, 1)) : `${monthKey(today)}-01`;
}

/** El crédito completo a partir de lo que escribió la persona. */
export function buildCredit(
  input: { amountCop: number; totalInstallments: number; paidBefore: number; dayOfMonth: number; paidThisMonth: boolean | null },
  id: string,
  today: Date,
): CreditItem {
  return {
    id,
    category: 'loan',
    amountCop: input.amountCop,
    dayOfMonth: input.dayOfMonth,
    note: CREDIT_NAME,
    createdAt: creditCreatedAt(input.dayOfMonth, input.paidThisMonth, today),
    credit: {
      totalInstallments: input.totalInstallments,
      paidBefore: Math.min(Math.max(0, input.paidBefore), input.totalInstallments - 1),
    },
  };
}

/** Lectura tolerante del crédito del primer ingreso (inválido → undefined). */
export function sanitizeOnboardingCredit(raw: unknown): OnboardingCredit | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const input = {
    amountCop: num(r.amountCop),
    totalInstallments: num(r.totalInstallments),
    paidBefore: num(r.paidBefore),
    dayOfMonth: num(r.dayOfMonth),
  };
  if (Object.keys(validateCredit(input)).length > 0 || input.paidBefore === null) return undefined;
  return {
    amountCop: input.amountCop!,
    totalInstallments: input.totalInstallments!,
    paidBefore: input.paidBefore,
    dayOfMonth: input.dayOfMonth!,
    paidThisMonth: typeof r.paidThisMonth === 'boolean' ? r.paidThisMonth : null,
  };
}

/** Avisos del celular: 2 días antes de cada cuota que falte (las próximas 2). */
export const CREDIT_REMINDER_DAYS_BEFORE = 2;

export function upcomingCreditDues(item: CreditItem, history: HistoryEntry[], today: Date, count = 2): string[] {
  const p = creditProgress(item, history, today);
  if (p.finished || !p.nextDue) return [];
  const first = parseISODate(p.nextDue);
  const dues: string[] = [];
  for (let i = 0; i < Math.min(count, p.remaining); i += 1) {
    const month = addMonths(new Date(first.getFullYear(), first.getMonth(), 1), i);
    dues.push(toISODate(new Date(month.getFullYear(), month.getMonth(), dueDayIn(item, month.getFullYear(), month.getMonth()))));
  }
  return dues;
}
