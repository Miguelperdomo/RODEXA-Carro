/** "RODEXA Carro recomienda" nunca dice "todo al día" si hay algo pendiente. Datos de PRUEBA. */
import type { EnergySource } from '@/features/cars/types';
import type { DocumentRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { ComponentConfig, OnboardingData } from '@/features/session/types';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

const doc = (id: string, docType: DocumentRecord['docType'], extra: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id,
  kind: 'document',
  date: '2026-09-01',
  docType,
  ...extra,
});

function recommendations(
  records: HistoryEntry[] = [],
  { energySource = 'gasoline', configs = {}, maintenance = [] }: {
    energySource?: EnergySource;
    configs?: Partial<Record<string, ComponentConfig>>;
    maintenance?: OnboardingData['maintenance'];
  } = {},
) {
  const onboarding: OnboardingData = {
    user: { name: 'Ana', city: '' },
    profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
    km: 20000,
    maintenance,
    documents: {},
    completedAt: '2026-09-25',
  };
  return buildAppDataFromOnboarding(onboarding, TODAY, { records, componentConfigs: configs }).dashboard.recommendations;
}
const ids = (list: ReturnType<typeof recommendations>) => list.map((r) => r.id);

/** SOAT y RTM vigentes + aceite con intervalo y al día: nada pendiente. */
const allGood = {
  records: [doc('s', 'soat', { expiresAt: '2027-06-01' }), doc('r', 'rtm', { expiresAt: '2027-06-01' })],
  configs: { oil: { enabled: true, interval: { km: 5000 } } },
  maintenance: [{ code: 'oil' as const, date: '2026-09-01', km: 19000, costCop: null }],
};

describe('RODEXA Carro recomienda', () => {
  it('sin SOAT ni tecnomecánica registrados: lo pide (no dice "todo al día")', () => {
    const list = recommendations();
    expect(ids(list)).toEqual(expect.arrayContaining(['soat-missing', 'rtm-missing', 'oil-setup']));
    expect(list.length).toBeGreaterThan(0);
  });

  it('aceite vencido según tus registros aparece primero', () => {
    const list = recommendations([doc('s', 'soat', { expiresAt: '2027-06-01' }), doc('r', 'rtm', { expiresAt: '2027-06-01' })], {
      configs: { oil: { enabled: true, interval: { km: 1000 } } },
      maintenance: [{ code: 'oil', date: '2026-08-01', km: 18000, costCop: null }],
    });
    expect(list[0]).toMatchObject({ id: 'maint-oil-due', level: 'due' });
  });

  it('documentos vencidos (SOAT, póliza) y próximos (tecnomecánica) aparecen, vencidos primero', () => {
    const list = recommendations([
      doc('r', 'rtm', { expiresAt: '2026-10-10' }),
      doc('s', 'soat', { expiresAt: '2026-09-01' }),
      doc('p', 'policy', { expiresAt: '2026-09-15' }),
    ]);
    const order = ids(list);
    expect(order).toEqual(expect.arrayContaining(['doc-soat-due', 'doc-policy-due', 'doc-rtm-soon']));
    expect(order.indexOf('doc-soat-due')).toBeLessThan(order.indexOf('doc-rtm-soon'));
    expect(order.indexOf('doc-policy-due')).toBeLessThan(order.indexOf('doc-rtm-soon'));
    expect(list.find((r) => r.id === 'doc-soat-due')?.text).toMatch(/según la fecha que registraste/);
  });

  it('otros mantenimientos vencidos también (frenos)', () => {
    const list = recommendations(allGood.records, {
      ...allGood,
      configs: { ...allGood.configs, brake_check: { enabled: true, interval: { km: 1000 } } },
      maintenance: [...allGood.maintenance, { code: 'brake_check', date: '2026-08-01', km: 18000, costCop: null }],
    });
    expect(ids(list)).toContain('maint-brake_check-due');
  });

  it('impuesto con la fecha límite pasada sin pago registrado aparece', () => {
    const list = recommendations([...allGood.records, doc('t', 'tax', { taxYear: 2026, dueDate: '2026-09-10' })], allGood);
    expect(list.find((r) => r.id === 'doc-tax-due')?.text).toMatch(/Si ya lo pagaste/);
  });

  it('energía sin confirmar: se pide confirmarla', () => {
    expect(ids(recommendations([], { energySource: 'unknown' }))).toContain('energy-missing');
  });

  it('tecnomecánica "aún no aplica" no se pide', () => {
    expect(ids(recommendations([doc('r', 'rtm', { notApplicable: true })]))).not.toContain('rtm-missing');
  });

  it('"Todo al día" (lista vacía) SOLO cuando no hay nada vencido, próximo ni faltante', () => {
    expect(recommendations(allGood.records, allGood)).toEqual([]);
  });
});
