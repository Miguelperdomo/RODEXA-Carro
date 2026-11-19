import { costDateOf, entryCost } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import type { IconName } from '@/shared/ui';
import { addDays, addMonths, parseISODate, toISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

/**
 * Ingresos de mi carro (gratis): lo que la persona genera trabajando con su carro. Sin
 * nombres de empresas ni de plataformas: solo el tipo de trabajo. Se guarda en el celular,
 * APARTE de los gastos (nunca se mezcla en los totales de gastos ni en el presupuesto).
 */
export type WorkType = 'passengers' | 'delivery' | 'courier' | 'business' | 'other';

export type IncomeRecord = {
  id: string;
  /** Fecha ISO (AAAA-MM-DD). */
  date: string;
  /** Siempre mayor que 0. */
  amountCop: number;
  work: WorkType;
  note?: string;
};

export type NewIncome = Omit<IncomeRecord, 'id'>;

export const WORK_TYPES: { code: WorkType; label: string; icon: IconName }[] = [
  { code: 'passengers', label: 'Transporte de pasajeros', icon: 'usagePersonal' },
  { code: 'delivery', label: 'Domicilios', icon: 'location' },
  { code: 'courier', label: 'Mensajería y envíos', icon: 'contact' },
  { code: 'business', label: 'Mi propio negocio', icon: 'workshop' },
  { code: 'other', label: 'Otro', icon: 'income' },
];

export const workOf = (code: WorkType) => WORK_TYPES.find((w) => w.code === code) ?? WORK_TYPES[WORK_TYPES.length - 1];

/** Tope de un ingreso (evita un cero de más). */
export const MAX_INCOME_COP = 50_000_000;
/** Máximo de ingresos guardados. */
export const MAX_INCOMES = 5000;
/** Atajos que se SUMAN al valor escrito. */
export const QUICK_AMOUNTS = [10_000, 20_000, 50_000];

export type IncomePeriod = 'day' | 'week' | 'month';

export const PERIOD_LABEL: Record<IncomePeriod, string> = { day: 'Hoy', week: 'Esta semana', month: 'Este mes' };

/** Rango [desde, hasta] (ISO, incluidos) del periodo que contiene `now`. La semana empieza el lunes. */
export function periodRange(period: IncomePeriod, now: Date): { from: string; to: string } {
  const day = toISODate(now);
  if (period === 'day') return { from: day, to: day };
  if (period === 'week') {
    const monday = addDays(now, -((now.getDay() + 6) % 7));
    return { from: toISODate(monday), to: toISODate(addDays(monday, 6)) };
  }
  const month = day.slice(0, 7);
  return { from: `${month}-01`, to: toISODate(addDays(addMonths(parseISODate(`${month}-01`), 1), -1)) };
}

const inRange = (date: string, r: { from: string; to: string }) => date >= r.from && date <= r.to;

export type IncomeSummary = {
  incomeCop: number;
  /** Gastos del carro registrados en el mismo periodo (combustible, mantenimiento, documentos…). */
  expensesCop: number;
  /** Te quedó = entró − gastos registrados (puede ser negativo). */
  leftCop: number;
  count: number;
};

export function summarize(incomes: IncomeRecord[], history: HistoryEntry[], range: { from: string; to: string }): IncomeSummary {
  const mine = incomes.filter((i) => inRange(i.date, range));
  const incomeCop = mine.reduce((sum, i) => sum + i.amountCop, 0);
  const expensesCop = history.filter((e) => inRange(costDateOf(e), range)).reduce((sum, e) => sum + entryCost(e), 0);
  return { incomeCop, expensesCop, leftCop: incomeCop - expensesCop, count: mine.length };
}

/** Del más reciente al más antiguo (fechas e ids con < y >, no con localeCompare). */
export function sortIncomes(incomes: IncomeRecord[]): IncomeRecord[] {
  const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  return [...incomes].sort((a, b) => cmp(b.date, a.date) || cmp(b.id, a.id));
}

/** Último tipo de trabajo usado (para dejarlo elegido al registrar otro). */
export const lastWork = (incomes: IncomeRecord[]): WorkType | null => sortIncomes(incomes)[0]?.work ?? null;

export function validateIncome(input: { amount: number | null; work: WorkType | null }): { amount?: string; work?: string } {
  const errors: { amount?: string; work?: string } = {};
  if (input.amount === null || input.amount <= 0) errors.amount = 'Escribe cuánto generaste.';
  else if (input.amount > MAX_INCOME_COP) errors.amount = 'Ese valor se ve muy alto. Revísalo.';
  if (!input.work) errors.work = 'Elige en qué trabajaste.';
  return errors;
}

/** Mensaje al guardar: lo que llevas hoy (solo con lo registrado). */
export function incomeSavedMessage(incomes: IncomeRecord[], saved: NewIncome, now: Date): string {
  const today = toISODate(now);
  if (saved.date !== today) return 'Ingreso guardado';
  const total = incomes.filter((i) => i.date === today).reduce((sum, i) => sum + i.amountCop, 0) + saved.amountCop;
  return `Ingreso guardado. Hoy llevas ${formatCop(total)}`;
}

const WORK_CODES = WORK_TYPES.map((w) => w.code) as string[];
const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISODate(v).getTime());

/** Lectura tolerante: los ingresos que no tienen la forma esperada se descartan. */
export function sanitizeIncomes(raw: unknown): IncomeRecord[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .flatMap((v): IncomeRecord[] => {
      if (typeof v !== 'object' || v === null) return [];
      const r = v as Record<string, unknown>;
      if (typeof r.id !== 'string' || !isIso(r.date) || typeof r.work !== 'string' || !WORK_CODES.includes(r.work)) return [];
      if (typeof r.amountCop !== 'number' || !Number.isInteger(r.amountCop) || r.amountCop <= 0 || r.amountCop > MAX_INCOME_COP) return [];
      return [
        {
          id: r.id,
          date: r.date,
          amountCop: r.amountCop,
          work: r.work as WorkType,
          ...(typeof r.note === 'string' && r.note.trim() ? { note: r.note.trim().slice(0, 120) } : {}),
        },
      ];
    })
    .slice(0, MAX_INCOMES);
}

export const INCOME_COPY = {
  title: 'Ingresos de mi carro',
  rowDescription: 'Cuánto generas con tu carro y cuánto te quedó',
  disclaimer: 'Según lo que registraste. Si te faltan gastos por anotar, lo que te quedó es menos.',
  negative: 'Los gastos del carro registrados en este periodo son más que lo que entró.',
  emptyTitle: 'Registra tu primer ingreso',
  emptyMessage: 'Anota lo que generas con tu carro y mira cuánto te deja después de sus gastos.',
  closing: 'Se guarda solo en tu celular. No se conecta a ninguna aplicación ni es una app de contabilidad.',
} as const;
