/** "Borrar mis registros de prueba": borra lo registrado, conserva el carro y las configuraciones. */
import type { HistoryEntry } from '@/features/history/types';
import { EMPTY_USER_DATA, type UserData } from '@/features/session/types';
import { EMPTY_STORED_USER_DATA } from '@/storage/userDataStore';

import { testRecordsSummary, userDataActions } from '../userDataActions';

const records: HistoryEntry[] = [
  { id: 'fuel-1', kind: 'fuel', date: '2026-10-01', km: 10_030, quantity: 10, unit: 'gal', fullTank: true },
  { id: 'cng-1', kind: 'cng', date: '2026-10-01', km: null, quantity: 5, fullFill: true },
  { id: 'expense-1', kind: 'expense', date: '2026-10-02', category: 'wash', amountCop: 220_000 },
  { id: 'maint-1', kind: 'maintenance', date: '2026-10-03', km: 10_100, types: ['oil'] },
  { id: 'km-1', kind: 'odometer', date: '2026-10-04', km: 500_000 },
  { id: 'doc-1', kind: 'document', date: '2026-10-05', docType: 'soat', expiresAt: '2027-10-05' },
  // Mantenimiento del primer ingreso que se corrigió (queda como registro con su id "onb-m-N").
  { id: 'onb-m-0', kind: 'maintenance', date: '2026-09-01', km: 9_000, types: ['oil'] },
];

const data: UserData = {
  ...EMPTY_USER_DATA,
  records,
  carSheet: { chassisNumber: 'ABC123' },
  budget: { monthlyCop: 800_000, updatedAt: '2026-10-01' },
  contacts: [{ id: 'c1', kind: 'tow', name: 'Grúas', phone: '3001234567' }],
  recurringExpenses: [{ id: 'rec-1', category: 'loan', amountCop: 900_000, dayOfMonth: 5, createdAt: '2026-09-01' }],
};

describe('borrar mis registros de prueba', () => {
  it('cuenta lo que se borraría, por tipo', () => {
    expect(testRecordsSummary(records)).toEqual({ total: 5, energy: 2, expenses: 1, maintenance: 1, odometer: 1 });
  });

  it('borra tanqueos, gastos, mantenimientos y km; conserva documentos y lo del primer ingreso', () => {
    const after = userDataActions.clearTestRecords(data);
    expect(after.records.map((r) => r.id)).toEqual(['doc-1', 'onb-m-0']);
    expect(testRecordsSummary(after.records).total).toBe(0);
  });

  it('conserva el carro y todas las configuraciones', () => {
    const { records: _before, ...rest } = data;
    const { records: _after, ...restAfter } = userDataActions.clearTestRecords(data);
    expect(restAfter).toEqual(rest);
  });
});

describe('borrar TODOS los datos', () => {
  it('deja la app como recién instalada: sin primer ingreso ni borrador', () => {
    expect(EMPTY_STORED_USER_DATA.onboarding).toBeNull();
    expect(EMPTY_STORED_USER_DATA.draft).toBeNull();
    expect(EMPTY_STORED_USER_DATA.records).toEqual([]);
  });

  it('la bienvenida existe y es pública (fuera de las pantallas protegidas)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require('fs') as { existsSync: (p: string) => boolean };
    expect(existsSync('src/app/(onboarding)/bienvenida.tsx')).toBe(true);
  });
});
