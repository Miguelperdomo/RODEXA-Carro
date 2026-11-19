import { formatCop } from '@/shared/utils/format';

/**
 * Presupuesto mensual: un tope que el usuario elige para lo que gasta en su carro.
 * RODEXA no sugiere montos; solo compara con lo que se registró en el mes (lo mismo
 * que suma "Este mes" y Estadísticas: tanqueos, mantenimientos, gastos y documentos).
 */
export type BudgetConfig = {
  /** Tope del mes en pesos (entero, mayor que 0). */
  monthlyCop: number;
  /** Cuándo lo configuró el usuario (AAAA-MM-DD). */
  updatedAt: string;
};

/** Aviso cuando lo registrado llega a este porcentaje del presupuesto. */
export const BUDGET_ALERT_RATIO = 0.8;
/** Tope razonable para evitar errores de digitación (un cero de más). */
export const MAX_BUDGET_COP = 1_000_000_000;

export type BudgetLevel = 'ok' | 'near' | 'over';

export type BudgetStatus = {
  level: BudgetLevel;
  spentCop: number;
  limitCop: number;
  /** Porción usada (0 = nada; 1 = justo el presupuesto; puede pasar de 1). */
  ratio: number;
  /** Porcentaje entero para mostrar ("85 %"). */
  percent: number;
  /** Lo que queda (0 si ya se pasó). */
  remainingCop: number;
  /** Lo que se pasó (0 si no se ha pasado). */
  overCop: number;
};

export function budgetStatus(budget: BudgetConfig | undefined, spentCop: number): BudgetStatus | undefined {
  if (!budget || !(budget.monthlyCop > 0) || !Number.isFinite(spentCop)) return undefined;
  const spent = Math.max(0, spentCop);
  const ratio = spent / budget.monthlyCop;
  return {
    level: ratio > 1 ? 'over' : ratio >= BUDGET_ALERT_RATIO ? 'near' : 'ok',
    spentCop: spent,
    limitCop: budget.monthlyCop,
    ratio,
    percent: Math.floor(ratio * 100),
    remainingCop: Math.max(0, budget.monthlyCop - spent),
    overCop: Math.max(0, spent - budget.monthlyCop),
  };
}

/** Texto corto (Mi carro, Inicio). */
export function budgetSummary(status: BudgetStatus | undefined): string {
  if (!status) return 'Define un límite para tus gastos del mes';
  if (status.level === 'over') return `Superaste el presupuesto por ${formatCop(status.overCop)}`;
  return `Llevas ${status.percent} % · quedan ${formatCop(status.remainingCop)}`;
}

/**
 * ¿Cruzó un umbral entre dos momentos del MISMO mes? (para avisar una sola vez, justo
 * cuando un registro nuevo hace pasar el 80 % o el 100 %).
 */
export function crossedLevel(before: BudgetStatus | undefined, after: BudgetStatus | undefined): BudgetLevel | undefined {
  if (!before || !after || before.limitCop !== after.limitCop) return undefined;
  const rank: Record<BudgetLevel, number> = { ok: 0, near: 1, over: 2 };
  return rank[after.level] > rank[before.level] ? after.level : undefined;
}

export function validateBudget(amount: number | null): string | undefined {
  if (amount === null) return 'Escribe cuánto quieres gastar como máximo al mes.';
  if (!Number.isInteger(amount) || amount <= 0) return 'El presupuesto debe ser mayor que $0.';
  if (amount > MAX_BUDGET_COP) return 'Revisa el valor: parece tener un cero de más.';
  return undefined;
}

/** Lectura tolerante del almacenamiento: si no tiene la forma esperada, se ignora. */
export function sanitizeBudget(raw: unknown): BudgetConfig | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const v = raw as Record<string, unknown>;
  if (typeof v.monthlyCop !== 'number' || validateBudget(v.monthlyCop) !== undefined) return undefined;
  if (typeof v.updatedAt !== 'string') return undefined;
  return { monthlyCop: v.monthlyCop, updatedAt: v.updatedAt };
}
