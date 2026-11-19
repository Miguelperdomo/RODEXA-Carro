/**
 * Presupuesto mensual. Los montos son DATOS DE PRUEBA: RODEXA no sugiere presupuestos.
 */
import { buildToday, type TodayInput } from '@/features/dashboard/today';
import type { StatusItem } from '@/features/dashboard/types';
import { userDataActions } from '@/features/session/userDataActions';
import { EMPTY_USER_DATA } from '@/features/session/types';
import { sanitizeUserData } from '@/storage/userDataStore';

import {
  BUDGET_ALERT_RATIO,
  budgetStatus,
  budgetSummary,
  crossedLevel,
  sanitizeBudget,
  validateBudget,
  type BudgetConfig,
} from '../rules';

const budget: BudgetConfig = { monthlyCop: 1_000_000, updatedAt: '2026-10-01' };

describe('estado del presupuesto', () => {
  it('sin presupuesto no hay estado (nunca se supone uno)', () => {
    expect(budgetStatus(undefined, 500_000)).toBeUndefined();
    expect(budgetSummary(undefined)).toBe('Define un límite para tus gastos del mes');
  });

  it('al día, cerca (desde el 80 %) y pasado', () => {
    expect(budgetStatus(budget, 500_000)).toMatchObject({ level: 'ok', percent: 50, remainingCop: 500_000, overCop: 0 });
    expect(budgetStatus(budget, 1_000_000 * BUDGET_ALERT_RATIO)?.level).toBe('near');
    expect(budgetStatus(budget, 1_000_000)?.level).toBe('near');
    expect(budgetStatus(budget, 1_200_000)).toMatchObject({ level: 'over', percent: 120, remainingCop: 0, overCop: 200_000 });
  });

  it('nunca NaN ni negativos', () => {
    expect(budgetStatus(budget, Number.NaN)).toBeUndefined();
    expect(budgetStatus(budget, -10)).toMatchObject({ spentCop: 0, percent: 0 });
  });

  it('textos cortos', () => {
    expect(budgetSummary(budgetStatus(budget, 850_000))).toBe('Llevas 85 % · quedan $150.000');
    expect(budgetSummary(budgetStatus(budget, 1_200_000))).toBe('Superaste el presupuesto por $200.000');
  });
});

describe('aviso al cruzar un umbral', () => {
  it('avisa solo cuando sube de nivel, con el mismo presupuesto', () => {
    const ok = budgetStatus(budget, 700_000);
    const near = budgetStatus(budget, 850_000);
    const over = budgetStatus(budget, 1_100_000);
    expect(crossedLevel(ok, near)).toBe('near');
    expect(crossedLevel(near, over)).toBe('over');
    expect(crossedLevel(ok, over)).toBe('over');
    expect(crossedLevel(near, budgetStatus(budget, 900_000))).toBeUndefined();
    expect(crossedLevel(near, ok)).toBeUndefined(); // borró un gasto: no se avisa
  });

  it('cambiar el presupuesto no dispara avisos', () => {
    const before = budgetStatus(budget, 850_000);
    const lower = budgetStatus({ ...budget, monthlyCop: 500_000 }, 850_000);
    expect(crossedLevel(before, lower)).toBeUndefined();
    expect(crossedLevel(undefined, before)).toBeUndefined();
  });
});

describe('validación y guardado', () => {
  it('el valor debe ser un entero mayor que 0 y sin un cero de más', () => {
    expect(validateBudget(null)).toBeDefined();
    expect(validateBudget(0)).toBeDefined();
    expect(validateBudget(-5)).toBeDefined();
    expect(validateBudget(10.5)).toBeDefined();
    expect(validateBudget(5_000_000_000)).toMatch(/cero de más/);
    expect(validateBudget(800_000)).toBeUndefined();
  });

  it('lectura tolerante', () => {
    expect(sanitizeBudget(budget)).toEqual(budget);
    expect(sanitizeBudget({ monthlyCop: 'mucho', updatedAt: 'x' })).toBeUndefined();
    expect(sanitizeBudget(null)).toBeUndefined();
  });

  it('se guarda y se quita sin tocar lo demás', () => {
    const withBudget = userDataActions.setBudget(EMPTY_USER_DATA, budget);
    expect(withBudget.budget).toEqual(budget);
    expect(withBudget.records).toBe(EMPTY_USER_DATA.records);
    expect('budget' in userDataActions.setBudget(withBudget, null)).toBe(false);
  });

  it('sobrevive al guardado y a la copia de seguridad; si está dañado se ignora y se informa', () => {
    expect(sanitizeUserData({ ...EMPTY_USER_DATA, budget }).data.budget).toEqual(budget);
    const broken = sanitizeUserData({ ...EMPTY_USER_DATA, budget: { monthlyCop: -1 } });
    expect(broken.data.budget).toBeUndefined();
    expect(broken.problems).toContain('presupuesto inválido');
  });
});

describe('bloque "Hoy"', () => {
  const base: TodayInput = {
    picoYPlaca: undefined,
    statusItems: [],
    kmCheckDue: false,
    daysSinceReading: 0,
    weeklySettings: { weeklyCheckEnabled: false } as TodayInput['weeklySettings'],
    today: new Date(2026, 9, 6, 9, 0),
  };

  it('el presupuesto aparece solo desde el 80 %', () => {
    expect(buildToday({ ...base, budget: budgetStatus(budget, 500_000) }).items[0].key).toBe('all-good');
    expect(buildToday({ ...base, budget: budgetStatus(budget, 850_000) }).items[0]).toMatchObject({
      key: 'budget',
      tone: 'soon',
      title: 'Llevas el 85 % de tu presupuesto',
    });
    expect(buildToday({ ...base, budget: budgetStatus(budget, 1_100_000) }).items[0]).toMatchObject({
      tone: 'due',
      title: 'Superaste el presupuesto del mes',
    });
  });

  it('marca el componente de cada mantenimiento (para no repetir "Próximo mantenimiento")', () => {
    const oil: StatusItem = {
      id: 'oil',
      kind: 'maintenance',
      title: 'Aceite',
      icon: 'oil',
      status: 'soon',
      detail: '',
      href: '/carro',
    };
    const soat: StatusItem = { ...oil, id: 'soat-1', kind: 'document', title: 'SOAT', status: 'due' };
    const { items } = buildToday({ ...base, statusItems: [soat, oil] });
    expect(items.map((i) => i.componentCode)).toEqual([undefined, 'oil']);
  });
});
