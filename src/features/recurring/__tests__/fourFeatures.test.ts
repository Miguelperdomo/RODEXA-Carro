/**
 * Gastos que se repiten, recordatorios propios y contactos.
 * Todos los valores son DATOS DE PRUEBA (no son precios, consumos ni intervalos reales).
 */
import { buildToday, type TodayInput } from '@/features/dashboard/today';
import { normalizePhone, sanitizeContacts, telUrl, validateContact } from '@/features/contacts/rules';
import {
  addMonthsClamped,
  customNotifications,
  customStatus,
  markDone,
  repeatText,
  sanitizeCustomReminders,
  validateCustom,
  type CustomReminder,
} from '@/features/customReminders/rules';
import type { HistoryEntry } from '@/features/history/types';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { EMPTY_USER_DATA } from '@/features/session/types';
import { userDataActions } from '@/features/session/userDataActions';
import { sanitizeUserData } from '@/storage/userDataStore';

import { dueDayIn, recurringDue, recurringLabel, sanitizeRecurring, validateRecurring, type RecurringExpense } from '../rules';

const OCT_10 = new Date(2026, 9, 10, 9, 0);

const garage: RecurringExpense = { id: 'rec-1', category: 'monthly_parking', amountCop: 150_000, dayOfMonth: 5, createdAt: '2026-09-01' };
const loan: RecurringExpense = { id: 'rec-2', category: 'loan', amountCop: 900_000, dayOfMonth: 15, createdAt: '2026-09-01' };
const paidGarage: HistoryEntry = { id: 'e1', kind: 'expense', date: '2026-10-05', category: 'monthly_parking', amountCop: 150_000, recurringId: 'rec-1' };

describe('gastos que se repiten', () => {
  it('pregunta desde el día de pago hasta que se registra', () => {
    expect(recurringDue([garage, loan], [], OCT_10).map((d) => d.item.id)).toEqual(['rec-1']); // el 15 aún no llega
    expect(recurringDue([garage, loan], [paidGarage], OCT_10)).toEqual([]);
    expect(recurringDue([garage], [paidGarage], new Date(2026, 10, 6))).toHaveLength(1); // noviembre: otra vez
  });

  it('uno creado después del día de pago empieza el mes siguiente', () => {
    expect(recurringDue([{ ...garage, createdAt: '2026-10-08' }], [], OCT_10)).toEqual([]);
  });

  it('el 31 en meses cortos es el último día', () => {
    expect(dueDayIn({ ...garage, dayOfMonth: 31 }, 2026, 1)).toBe(28);
    expect(dueDayIn({ ...garage, dayOfMonth: 31 }, 2028, 1)).toBe(29);
  });

  it('nombre propio o el de la categoría', () => {
    expect(recurringLabel(garage)).toBe('Garaje o parqueadero mensual');
    expect(recurringLabel({ ...garage, note: 'Garaje del edificio' })).toBe('Garaje del edificio');
  });

  it('validación: categoría (sin combustible), valor y día', () => {
    expect(validateRecurring({ category: 'loan', amountCop: 100, dayOfMonth: 31 })).toEqual({});
    expect(Object.keys(validateRecurring({ category: 'fuel', amountCop: 0, dayOfMonth: 32 })).sort()).toEqual(['amount', 'category', 'day']);
  });

  it('"Hoy" pregunta "¿Ya pagaste…?" y abre el gasto listo para registrar', () => {
    const base: TodayInput = {
      picoYPlaca: undefined,
      statusItems: [],
      kmCheckDue: false,
      daysSinceReading: 0,
      weeklySettings: { weeklyCheckEnabled: false } as TodayInput['weeklySettings'],
      today: OCT_10,
    };
    const [item] = buildToday({ ...base, recurring: recurringDue([garage], [], OCT_10) }).items;
    expect(item.title).toBe('¿Ya pagaste garaje o parqueadero mensual?');
    expect(item.href).toEqual({ pathname: '/registrar/gasto', params: { recurrente: 'rec-1' } });
    const soat = { ...garage, category: 'soat' as const };
    expect(buildToday({ ...base, recurring: recurringDue([soat], [], OCT_10) }).items[0].title).toBe('¿Ya pagaste SOAT?');
  });

  it('lectura tolerante: descarta los dañados', () => {
    expect(sanitizeRecurring([garage, { id: 'x' }, { ...loan, dayOfMonth: 0 }])).toEqual([garage]);
  });
});

describe('recordatorios propios', () => {
  const plumillas: CustomReminder = { id: 'r1', title: 'Cambiar plumillas', trigger: { type: 'date', date: '2026-10-14' }, createdAt: '2026-10-01' };
  const extintor: CustomReminder = { id: 'r2', title: 'Revisar extintor', trigger: { type: 'km', km: 20_300 }, repeatEvery: 5000, createdAt: '2026-10-01' };

  it('estado por fecha y por km', () => {
    expect(customStatus(plumillas, 0, OCT_10)).toMatchObject({ level: 'soon', detail: 'En 4 días · 14/10/2026' });
    expect(customStatus(plumillas, 0, new Date(2026, 9, 14)).level).toBe('due');
    expect(customStatus(extintor, 20_000, OCT_10)).toMatchObject({ level: 'soon' });
    expect(customStatus(extintor, 21_000, OCT_10)).toMatchObject({ level: 'due' });
    expect(customStatus(extintor, 10_000, OCT_10).level).toBe('ok');
  });

  it('hecho: el de una vez queda hecho; el repetido pasa al siguiente', () => {
    expect(markDone(plumillas, 0, OCT_10).doneAt).toBe('2026-10-10');
    expect(markDone(extintor, 21_000, OCT_10).trigger).toEqual({ type: 'km', km: 26_000 });
    const monthly = { ...plumillas, repeatEvery: 1 };
    expect(markDone(monthly, 0, new Date(2026, 0, 31)).trigger).toEqual({ type: 'date', date: '2026-02-28' });
    expect(repeatText(monthly)).toBe('Cada mes');
    expect(repeatText({ ...plumillas, repeatEvery: 12 })).toBe('Cada año');
  });

  it('suma de meses sin desbordar', () => {
    expect(addMonthsClamped(new Date(2026, 7, 31), 1).getDate()).toBe(30);
  });

  it('validación', () => {
    const ok = { title: 'Plumillas', type: 'date' as const, date: OCT_10, km: null, repeat: false, repeatEvery: null };
    expect(validateCustom(ok, 0)).toEqual({});
    expect(validateCustom({ ...ok, title: ' ' }, 0).title).toBeDefined();
    expect(validateCustom({ ...ok, type: 'km', km: 1000 }, 5000).km).toMatch(/mayor que tu kilometraje/);
    expect(validateCustom({ ...ok, repeat: true, repeatEvery: 0 }, 0).repeatEvery).toBeDefined();
  });

  it('notificación a las 9:00 del día elegido; los de km no (se ven en "Hoy")', () => {
    const list = customNotifications([plumillas, extintor, { ...plumillas, id: 'old', trigger: { type: 'date', date: '2026-10-01' } }], OCT_10);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'custom-r1-2026-10-14', category: 'custom', title: 'Cambiar plumillas' });
    expect(list[0].fireAt.getHours()).toBe(9);
    expect(customNotifications([{ ...plumillas, doneAt: '2026-10-09' }], OCT_10)).toEqual([]);
  });

  it('entran en el plan de avisos del teléfono', () => {
    const data = { odometer: { lastReadingDate: undefined }, history: [], documents: [], components: [], profile: {} } as never;
    const settings = { documentReminders: false, maintenanceReminders: false, odometerReminders: false, fuelReminders: false, activityReminders: false } as never;
    const plan = buildReminderPlan(data, settings, OCT_10, undefined, [plumillas]);
    expect(plan.map((r) => r.id)).toContain('custom-r1-2026-10-14');
  });

  it('lectura tolerante', () => {
    expect(sanitizeCustomReminders([plumillas, extintor, { id: 'x', title: 'a', trigger: { type: 'km', km: -1 }, createdAt: '2026-01-01' }])).toEqual([
      plumillas,
      extintor,
    ]);
  });
});

describe('contactos del carro', () => {
  it('teléfono: se llama solo con números', () => {
    expect(normalizePhone('+57 (601) 555-12-34')).toBe('+576015551234');
    expect(telUrl('300 123 4567')).toBe('tel:3001234567');
    expect(validateContact({ name: 'Taller', phone: '#123' }).phone).toBeDefined();
    expect(validateContact({ name: '', phone: '3001234567' }).name).toBeDefined();
    expect(validateContact({ name: 'Grúa', phone: '300 123 4567' })).toEqual({});
  });

  it('lectura tolerante', () => {
    const ok = { id: 'c1', kind: 'tow', name: 'Grúas', phone: '3001234567' };
    expect(sanitizeContacts([ok, { ...ok, id: 'c2', kind: 'chef' }, { ...ok, id: 'c3', phone: 'abc' }])).toEqual([ok]);
  });
});

describe('las listas se guardan y viajan en la copia de seguridad', () => {
  it('se guardan, se quitan y sobreviven a la lectura', () => {
    const d = userDataActions.setContacts(
      userDataActions.setRecurringExpenses(EMPTY_USER_DATA, [garage]),
      [{ id: 'c1', kind: 'mechanic', name: 'Don Jorge', phone: '3001234567' }],
    );
    const read = sanitizeUserData({ ...d, records: [paidGarage] }).data;
    expect(read.recurringExpenses).toEqual([garage]);
    expect(read.contacts).toHaveLength(1);
    expect(read.records[0]).toMatchObject({ recurringId: 'rec-1' });
    expect('recurringExpenses' in userDataActions.setRecurringExpenses(d, [])).toBe(false);
  });

  it('un elemento dañado se descarta y se informa, sin borrar lo demás', () => {
    const result = sanitizeUserData({ ...EMPTY_USER_DATA, recurringExpenses: [garage, { id: 'x' }] });
    expect(result.data.recurringExpenses).toEqual([garage]);
    expect(result.problems).toContain('1 gastos que se repiten inválido(s)');
  });
});
