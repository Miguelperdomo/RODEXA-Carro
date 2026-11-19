/** Fase 15: ingresos, crédito del carro (con su paso en el primer ingreso y su aviso) y ahorro. */
import type { HistoryEntry } from '@/features/history/types';
import {
  periodRange,
  QUICK_AMOUNTS,
  sanitizeIncomes,
  sortIncomes,
  summarize,
  validateIncome,
  incomeSavedMessage,
  type IncomeRecord,
} from '@/features/income/income';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { EMPTY_FORM, toOnboardingData, validateStep } from '@/features/onboarding/form';
import { recurringDue, sanitizeRecurring } from '@/features/recurring/rules';
import { savingsShareText, transitSavings, tripsPerMonth } from '@/features/savings/transitSavings';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import { userDataActions as actions } from '@/features/session/userDataActions';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { EMPTY_STORED_USER_DATA, sanitizeUserData } from '@/storage/userDataStore';

import {
  buildCredit,
  creditCreatedAt,
  creditOf,
  creditProgress,
  creditShort,
  upcomingCreditDues,
  validateCredit,
} from '../credit';

const expense = (id: string, date: string, amountCop: number, recurringId?: string): HistoryEntry =>
  ({ id, kind: 'expense', date, amountCop, category: 'loan', ...(recurringId ? { recurringId } : {}) }) as HistoryEntry;

describe('ingresos', () => {
  const incomes: IncomeRecord[] = [
    { id: 'i1', date: '2026-11-09', amountCop: 100000, work: 'passengers' },
    { id: 'i2', date: '2026-11-11', amountCop: 50000, work: 'delivery' },
    { id: 'i3', date: '2026-10-30', amountCop: 70000, work: 'other' },
  ];
  const NOW = new Date(2026, 10, 11); // miércoles 11 de noviembre

  it('Hoy / Semana (desde el lunes) / Mes', () => {
    expect(periodRange('day', NOW)).toEqual({ from: '2026-11-11', to: '2026-11-11' });
    expect(periodRange('week', NOW)).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(periodRange('month', NOW)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
  });

  it('Entró, Gastos y Te quedó (puede ser negativo)', () => {
    const history = [expense('e1', '2026-11-10', 30000)];
    expect(summarize(incomes, history, periodRange('week', NOW))).toEqual({ incomeCop: 150000, expensesCop: 30000, leftCop: 120000, count: 2 });
    expect(summarize([], history, periodRange('week', NOW)).leftCop).toBe(-30000);
  });

  it('atajos +10, +20 y +50 mil; validación y mensaje al guardar', () => {
    expect(QUICK_AMOUNTS).toEqual([10000, 20000, 50000]);
    expect(validateIncome({ amount: null, work: null })).toEqual({ amount: 'Escribe cuánto generaste.', work: 'Elige en qué trabajaste.' });
    expect(validateIncome({ amount: 60_000_000, work: 'other' }).amount).toMatch(/muy alto/);
    expect(incomeSavedMessage(incomes, { date: '2026-11-11', amountCop: 20000, work: 'other' }, NOW)).toBe('Ingreso guardado. Hoy llevas $70.000');
  });

  it('orden del más reciente y lectura tolerante', () => {
    expect(sortIncomes(incomes).map((i) => i.id)).toEqual(['i2', 'i1', 'i3']);
    expect(sanitizeIncomes([...incomes, { id: 'x', date: 'mal', amountCop: 1, work: 'other' }, { id: 'y', date: '2026-11-01', amountCop: -5, work: 'other' }])).toHaveLength(3);
    expect(sanitizeIncomes([{ id: 'z', date: '2026-11-01', amountCop: 1000, work: 'plataforma' }])).toEqual([]);
  });

  it('se guardan con los datos del carro (y van en la copia de seguridad)', () => {
    const stored = actions.setIncomes(EMPTY_STORED_USER_DATA, incomes);
    expect(sanitizeUserData(JSON.parse(JSON.stringify(stored))).data.incomes).toEqual(incomes);
    expect(actions.setIncomes(stored, []).incomes).toBeUndefined();
  });
});

describe('crédito del carro', () => {
  const TODAY = new Date(2026, 10, 11); // 11 de noviembre
  const credit = buildCredit({ amountCop: 900000, totalInstallments: 48, paidBefore: 10, dayOfMonth: 5, paidThisMonth: true }, 'c1', TODAY);

  it('validación de cuota, cuotas, pagadas y día', () => {
    expect(validateCredit({ amountCop: null, totalInstallments: 0, paidBefore: 5, dayOfMonth: 40 })).toMatchObject({ amount: expect.any(String), total: expect.any(String), day: expect.any(String) });
    expect(validateCredit({ amountCop: 1, totalInstallments: 10, paidBefore: 10, dayOfMonth: 5 }).paid).toBeDefined();
    expect(validateCredit({ amountCop: 1, totalInstallments: 10, paidBefore: 0, dayOfMonth: 5 })).toEqual({});
  });

  it('progreso, próxima cuota y cuándo termina (sin intereses)', () => {
    const p = creditProgress(credit, [], TODAY);
    // 38 cuotas desde diciembre de 2026: la última es en enero de 2030.
    expect(p).toMatchObject({ total: 48, paid: 10, remaining: 38, paidThisMonth: true, nextDue: '2026-12-05', lastMonth: '2030-01', paidCop: 9_000_000 });
    expect(creditShort(p)).toBe('38 cuotas por pagar · terminas en Enero 2030');
  });

  it('"¿Ya pagaste la cuota de este mes?": sí → no pregunta este mes; no → pregunta ya', () => {
    expect(creditCreatedAt(5, true, TODAY)).toBe('2026-11-06');
    expect(creditCreatedAt(5, false, TODAY)).toBe('2026-11-01');
    expect(creditCreatedAt(20, null, TODAY)).toBe('2026-11-11');
    expect(recurringDue([credit], [], TODAY)).toHaveLength(0);
    const notPaid = buildCredit({ amountCop: 900000, totalInstallments: 48, paidBefore: 10, dayOfMonth: 5, paidThisMonth: false }, 'c2', TODAY);
    expect(recurringDue([notPaid], [], TODAY)).toHaveLength(1);
  });

  it('cada pago registrado avanza el contador; terminado, ya no pregunta', () => {
    const short = buildCredit({ amountCop: 100, totalInstallments: 2, paidBefore: 1, dayOfMonth: 5, paidThisMonth: false }, 'c3', TODAY);
    const history = [expense('p1', '2026-11-05', 100, 'c3')];
    expect(creditProgress(short, history, TODAY)).toMatchObject({ paid: 2, finished: true });
    expect(creditShort(creditProgress(short, history, TODAY))).toBe('Crédito pagado por completo');
    expect(recurringDue([short], history, new Date(2026, 11, 10))).toHaveLength(0);
  });

  it('aviso 2 días antes de las próximas 2 cuotas', () => {
    expect(upcomingCreditDues(credit, [], TODAY)).toEqual(['2026-12-05', '2027-01-05']);
    const data = buildAppDataFromOnboarding(
      { user: { name: 'Ana', city: '' }, profile: { id: 'c', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' }, km: 1000, maintenance: [], documents: {}, completedAt: '2026-11-01' },
      TODAY,
    );
    const plan = buildReminderPlan(data, DEFAULT_SETTINGS, TODAY, undefined, [], [credit]).filter((r) => r.category === 'credit');
    expect(plan.map((r) => r.fireAt.getDate())).toEqual([3, 3]);
    expect(plan[0].body).toMatch(/cuota del carro/);
    expect(buildReminderPlan(data, { ...DEFAULT_SETTINGS, creditReminders: false }, TODAY, undefined, [], [credit]).some((r) => r.category === 'credit')).toBe(false);
  });

  it('se guarda sin migraciones; datos dañados se descartan', () => {
    expect(sanitizeRecurring([credit])).toEqual([credit]);
    const broken = { ...credit, credit: { totalInstallments: 5, paidBefore: 9 } };
    expect(sanitizeRecurring([broken])?.[0].credit).toBeUndefined();
  });
});

describe('primer ingreso: "¿Tu carro está a crédito?"', () => {
  const base = { ...EMPTY_FORM, name: 'Ana', km: 1000 };

  it('se puede saltar', () => {
    expect(validateStep('credit', base)).toEqual({});
    expect(toOnboardingData(base, new Date(2026, 10, 11)).credit).toBeUndefined();
  });

  it('con "Sí" pide los datos y, si ya pasó el día, si pagó la de este mes', () => {
    const errors = validateStep('credit', { ...base, creditHas: true, creditAmount: 500000, creditTotal: 36, creditDay: 1 });
    expect(errors.creditPaidThisMonth).toBe('Elige una opción.');
  });

  it('al terminar el registro se crea el crédito del carro', () => {
    const form = { ...base, creditHas: true, creditAmount: 500000, creditTotal: 36, creditPaid: 3, creditDay: 28, creditPaidThisMonth: null };
    const draft = toOnboardingData(form, new Date(2026, 10, 11));
    expect(draft.credit).toEqual({ amountCop: 500000, totalInstallments: 36, paidBefore: 3, dayOfMonth: 28, paidThisMonth: null });
    const done = actions.completeOnboarding({ ...EMPTY_STORED_USER_DATA, draft });
    expect(done.onboarding?.credit).toBeUndefined();
    expect(creditOf(done.recurringExpenses ?? [])).toMatchObject({ amountCop: 500000, dayOfMonth: 28, credit: { totalInstallments: 36, paidBefore: 3 } });
  });
});

describe('¿Cuánto me ahorro en carro?', () => {
  it('pasaje y viajes los escribe la persona; si el carro sale más caro, se dice', () => {
    expect(tripsPerMonth(2, 5)).toBe(43);
    expect(transitSavings(0, 43, 100)).toBeUndefined();
    const cheaper = transitSavings(3200, 43, 100000)!;
    expect(cheaper.savedCop).toBe(37600);
    expect(savingsShareText(cheaper, 'noviembre')).toBe('En noviembre mi carro me ahorró $37.600 frente al transporte público. Lo calculé con RODEXA Carro.');
    const dearer = transitSavings(3200, 43, 900000)!;
    expect(dearer.savedCop).toBeLessThan(0);
    expect(savingsShareText(dearer, 'noviembre')).toContain('le he invertido $900.000');
  });
});
