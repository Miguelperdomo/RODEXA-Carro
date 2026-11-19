/**
 * Pruebas de documentos y su integración con gastos. Fechas y valores son DATOS DE
 * PRUEBA (no son precios, plazos ni requisitos reales).
 */
import type { CarProfile, DocumentSummary } from '@/features/cars/types';
import { findPossibleDuplicatePayment } from '@/features/expenses/duplicates';
import { costDateOf, entryCost, groupByMonth } from '@/features/history/presentation';
import type { DocumentRecord, HistoryEntry } from '@/features/history/types';
import { buildNotifications } from '@/features/notifications/build';
import { documentReminderBody } from '@/features/notifications/local/messages';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';
import { userDataActions as A } from '@/features/session/userDataActions';
import { EMPTY_USER_DATA } from '@/features/session/types';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { computeMonthStats, computeRollingYearStats } from '@/features/stats/compute';
import { sanitizeSettings } from '@/storage/settingsStore';

import { DOCUMENT_DEFINITIONS, documentExpenseCategory } from '../catalog';
import { documentStatusText } from '../presentation';
import { buildDocumentSummaries, needsAttention } from '../summary';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

const doc = (id: string, docType: DocumentRecord['docType'], extra: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id,
  kind: 'document',
  date: '2026-09-01',
  docType,
  ...extra,
});
const summaryOf = (entries: HistoryEntry[], key: string) =>
  buildDocumentSummaries(entries, TODAY).find((d) => d.key === key)!;

describe('catálogo de documentos', () => {
  it('la licencia de tránsito no vence; el impuesto tiene fecha límite; "Otro" es opcional', () => {
    expect(DOCUMENT_DEFINITIONS.transit_license.expiry).toBe('none');
    expect(DOCUMENT_DEFINITIONS.tax.expiry).toBe('due_date');
    expect(DOCUMENT_DEFINITIONS.other.expiry).toBe('optional');
    expect(DOCUMENT_DEFINITIONS.soat.expiry).toBe('expires');
  });

  it('categorías de gasto: SOAT, RTM, impuestos, seguros; la licencia de conducción NO cuenta', () => {
    expect(documentExpenseCategory('soat')).toBe('soat');
    expect(documentExpenseCategory('rtm')).toBe('rtm');
    expect(documentExpenseCategory('tax')).toBe('tax');
    expect(documentExpenseCategory('policy')).toBe('insurance');
    expect(documentExpenseCategory('license')).toBeUndefined();
    expect(documentExpenseCategory('transit_license')).toBeUndefined();
  });
});

describe('estados', () => {
  it('vigente, próximo (límite de 30 días), vencido, sin fecha', () => {
    expect(summaryOf([doc('a', 'soat', { expiresAt: '2026-12-01' })], 'soat').status).toBe('ok');
    expect(summaryOf([doc('a', 'soat', { expiresAt: '2026-10-30' })], 'soat').status).toBe('soon');
    expect(summaryOf([doc('a', 'soat', { expiresAt: '2026-10-31' })], 'soat').status).toBe('ok');
    expect(summaryOf([doc('a', 'soat', { expiresAt: '2026-09-29' })], 'soat').status).toBe('due');
    expect(summaryOf([doc('a', 'soat')], 'soat').status).toBe('nodata');
  });

  it('RTM "aún no aplica"; sin registrar se lista pero no se inventa', () => {
    expect(summaryOf([doc('a', 'rtm', { notApplicable: true })], 'rtm').status).toBe('na');
    const missing = summaryOf([], 'soat');
    expect(missing).toMatchObject({ status: 'nodata', records: 0, detail: 'Sin registrar' });
  });

  it('la licencia de tránsito nunca aparece "vencida", aunque tuviera una fecha', () => {
    const s = summaryOf([doc('a', 'transit_license', { expiresAt: '2020-01-01' })], 'transit_license');
    expect(s.status).toBe('ok');
    expect(s.alertDate).toBeUndefined();
    expect(documentStatusText(s)).toBe('Al día');
  });

  it('impuesto: pagado, pendiente, fecha límite pasada, exento; manda el año más reciente', () => {
    expect(summaryOf([doc('a', 'tax', { taxYear: 2026, paidAt: '2026-05-01' })], 'tax').detail).toBe('Pagado 2026');
    expect(summaryOf([doc('a', 'tax', { taxYear: 2026, dueDate: '2026-10-15' })], 'tax').status).toBe('soon');
    expect(summaryOf([doc('a', 'tax', { taxYear: 2026, dueDate: '2026-09-01' })], 'tax').status).toBe('due');
    expect(summaryOf([doc('a', 'tax', { taxYear: 2026, exempt: true })], 'tax').status).toBe('na');
    const years = [doc('old', 'tax', { taxYear: 2025, paidAt: '2025-05-01' }), doc('new', 'tax', { taxYear: 2026, dueDate: '2026-12-01', date: '2026-01-01' })];
    expect(summaryOf(years, 'tax')).toMatchObject({ latestRecordId: 'new', records: 2 });
  });

  it('cada "Otro" es un documento propio con sus renovaciones', () => {
    const entries = [
      doc('o1', 'other', { seriesId: 's1', name: 'Permiso A', hasExpiry: true, expiresAt: '2027-01-01' }),
      doc('o2', 'other', { seriesId: 's1', name: 'Permiso A', hasExpiry: true, expiresAt: '2028-01-01', date: '2026-09-10' }),
      doc('o3', 'other', { seriesId: 's2', name: 'Certificado B', hasExpiry: false }),
    ];
    const summaries = buildDocumentSummaries(entries, TODAY).filter((d) => d.type === 'other');
    expect(summaries.map((d) => d.key)).toEqual(['other:s1', 'other:s2']);
    expect(summaries[0]).toMatchObject({ title: 'Permiso A', records: 2, latestRecordId: 'o2' });
    expect(summaries[1].detail).toBe('Registrado · sin vencimiento');
  });

  it('la renovación más reciente manda', () => {
    const entries = [doc('a', 'soat', { expiresAt: '2026-09-15' }), doc('b', 'soat', { expiresAt: '2027-09-15', date: '2026-09-20' })];
    expect(summaryOf(entries, 'soat')).toMatchObject({ status: 'ok', latestRecordId: 'b', records: 2 });
  });
});

describe('integración con gastos', () => {
  const payments = [
    doc('s', 'soat', { expiresAt: '2027-09-10', costCop: 500000, paidAt: '2026-09-10' }),
    doc('r', 'rtm', { expiresAt: '2027-09-12', costCop: 200000, paidAt: '2026-09-12' }),
    doc('t', 'tax', { taxYear: 2026, costCop: 800000, paidAt: '2026-09-14' }),
    doc('p', 'policy', { expiresAt: '2027-09-15', costCop: 1200000, paidAt: '2026-09-15' }),
  ];

  it('SOAT $500.000, RTM $200.000, impuesto $800.000 y póliza $1.200.000 en su categoría', () => {
    const stats = computeMonthStats(payments, '2026-09', TODAY);
    const byKey = Object.fromEntries(stats.byCategory.map((c) => [c.key, c.amountCop]));
    expect(byKey).toEqual({ soat: 500000, rtm: 200000, tax: 800000, insurance: 1200000 });
    expect(stats.totalCop).toBe(2700000);
  });

  it('la licencia de conducción no suma al costo del carro; un documento sin valor suma 0', () => {
    expect(entryCost(doc('l', 'license', { costCop: 100000 }))).toBe(0);
    expect(entryCost(doc('s', 'soat'))).toBe(0);
  });

  it('cuenta en el mes de la fecha de pago, igual en Estadísticas, Historial e Inicio', () => {
    const entry = doc('s', 'soat', { date: '2026-10-02', costCop: 500000, paidAt: '2026-09-28', expiresAt: '2027-09-28' });
    expect(costDateOf(entry)).toBe('2026-09-28');
    expect(computeMonthStats([entry], '2026-09', TODAY).totalCop).toBe(500000);
    expect(groupByMonth([entry])[0]).toMatchObject({ key: '2026-09', totalCop: 500000 });

    const onboarding: OnboardingData = {
      user: { name: 'Ana', city: '' },
      profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
      km: 1000,
      maintenance: [],
      documents: {},
      completedAt: '2026-09-01',
    };
    const data = buildAppDataFromOnboarding(onboarding, TODAY, { records: payments });
    expect(data.dashboard.month.totalCop).toBe(2700000);
  });

  it('editar el valor o eliminar el documento recalcula (no se guardan totales)', () => {
    const base = { ...EMPTY_USER_DATA, records: [payments[0]] };
    const edited = A.editEntry(base, 's', { ...payments[0], costCop: 450000 });
    expect(computeMonthStats(edited.records, '2026-09', TODAY).totalCop).toBe(450000);
    const deleted = A.deleteEntry(edited, 's');
    expect(computeMonthStats(deleted.records, '2026-09', TODAY).totalCop).toBe(0);
  });

  it('registrar o renovar un documento NO crea un gasto aparte', () => {
    const data = A.addRecord(A.addRecord(EMPTY_USER_DATA, payments[0]), doc('s2', 'soat', { costCop: 520000, paidAt: '2027-09-01' }));
    expect(data.records.every((r) => r.kind === 'document')).toBe(true);
    expect(data.records).toHaveLength(2);
  });
});

describe('posibles pagos duplicados', () => {
  const soat = doc('s', 'soat', { costCop: 500000, paidAt: '2026-09-10' });
  it('misma categoría, mismo valor, ≤ 7 días → advertencia', () => {
    expect(findPossibleDuplicatePayment([soat], { category: 'soat', amountCop: 500000, date: '2026-09-15' })).toBe(soat);
    const manual: HistoryEntry = { id: 'e', kind: 'expense', date: '2026-09-12', category: 'soat', amountCop: 500000 };
    expect(findPossibleDuplicatePayment([manual], { category: 'soat', amountCop: 500000, date: '2026-09-10' })).toBe(manual);
  });
  it('si cambia la categoría, el valor o pasan más de 7 días → sin advertencia', () => {
    expect(findPossibleDuplicatePayment([soat], { category: 'rtm', amountCop: 500000, date: '2026-09-10' })).toBeUndefined();
    expect(findPossibleDuplicatePayment([soat], { category: 'soat', amountCop: 400000, date: '2026-09-10' })).toBeUndefined();
    expect(findPossibleDuplicatePayment([soat], { category: 'soat', amountCop: 500000, date: '2026-09-20' })).toBeUndefined();
    expect(findPossibleDuplicatePayment([soat], { category: 'soat', amountCop: 500000, date: '2026-09-10', excludeId: 's' })).toBeUndefined();
  });
});

/** Datos de la app con solo estos documentos (el resto vacío). */
function appWith(records: HistoryEntry[], profile: Partial<CarProfile> = {}) {
  const onboarding: OnboardingData = {
    user: { name: 'Ana', city: '' },
    profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline', ...profile },
    km: 1000,
    maintenance: [],
    documents: {},
    completedAt: '2026-09-29',
  };
  return buildAppDataFromOnboarding(onboarding, TODAY, { records });
}
const onlyDocs = { ...DEFAULT_SETTINGS, odometerReminders: false, activityReminders: false, fuelReminders: false, maintenanceReminders: false };
const docReminders = (records: HistoryEntry[], settings = onlyDocs) =>
  buildReminderPlan(appWith(records), settings, TODAY).filter((r) => r.href.startsWith('/documentos/'));
const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('recordatorios', () => {
  it('30, 7 y 1 día antes y un solo aviso al día siguiente; abren el detalle', () => {
    const reminders = docReminders([doc('p', 'policy', { expiresAt: '2026-12-31' })]);
    expect(reminders.map((r) => dayOf(r.fireAt))).toEqual(['2026-12-01', '2026-12-24', '2026-12-30', '2027-01-01']);
    expect(reminders.every((r) => r.href === '/documentos/policy' && r.title === 'Póliza de seguro')).toBe(true);
    expect(reminders.at(-1)?.body).toBe('Venció ayer según la fecha que registraste. Si ya lo renovaste, actualiza el documento.');
  });

  it('impuesto pendiente avisa por su fecha límite; pagado o exento no', () => {
    expect(docReminders([doc('t', 'tax', { taxYear: 2026, dueDate: '2026-12-31' })])).toHaveLength(4);
    expect(docReminders([doc('t', 'tax', { taxYear: 2026, dueDate: '2026-12-31', paidAt: '2026-10-01' })])).toHaveLength(0);
    expect(docReminders([doc('t', 'tax', { taxYear: 2026, exempt: true })])).toHaveLength(0);
  });

  it('sin fecha, sin vencimiento, RTM "aún no aplica" o interruptor apagado: sin avisos', () => {
    expect(docReminders([doc('s', 'soat')])).toHaveLength(0);
    expect(docReminders([doc('l', 'transit_license', { expiresAt: '2026-12-31' })])).toHaveLength(0);
    expect(docReminders([doc('r', 'rtm', { notApplicable: true })])).toHaveLength(0);
    expect(docReminders([doc('p', 'policy', { expiresAt: '2026-12-31' })], { ...onlyDocs, remindPolicy: false })).toHaveLength(0);
    expect(docReminders([doc('p', 'policy', { expiresAt: '2026-12-31' })], { ...onlyDocs, documentReminders: false })).toHaveLength(0);
  });

  it('un "Otro" con fecha avisa y su enlace identifica su serie', () => {
    const reminders = docReminders([doc('o', 'other', { seriesId: 's1', name: 'Permiso', hasExpiry: true, expiresAt: '2026-12-31' })]);
    expect(reminders[0].href).toBe(`/documentos/${encodeURIComponent('other:s1')}`);
  });

  it('dentro de la app: solo próximos o vencidos, y abren el detalle', () => {
    const list = buildNotifications(appWith([doc('s', 'soat', { expiresAt: '2026-10-05' }), doc('r', 'rtm', { expiresAt: '2027-05-01' })]), DEFAULT_SETTINGS, TODAY)
      .filter((n) => n.category === 'documents');
    expect(list).toHaveLength(1);
    expect(list[0].href).toEqual({ pathname: '/documentos/[key]', params: { key: 'soat' } });
  });
});

describe('Inicio', () => {
  it('solo documentos próximos o vencidos; los vigentes no ocupan espacio', () => {
    const data = appWith([doc('s', 'soat', { expiresAt: '2027-06-01' }), doc('r', 'rtm', { expiresAt: '2026-10-05' })]);
    const docRows = data.dashboard.statusItems.filter((i) => i.kind === 'document');
    expect(docRows.map((i) => i.id)).toEqual(['rtm']);
    expect(data.documents.filter(needsAttention).map((d) => d.key)).toEqual(['rtm']);
  });

  it('se mantiene la sugerencia "Agrega la fecha de tu SOAT" si no hay SOAT', () => {
    expect(appWith([]).dashboard.recommendations.map((r) => r.id)).toContain('soat-missing');
    expect(appWith([doc('s', 'soat', { expiresAt: '2027-06-01' })]).dashboard.recommendations.map((r) => r.id)).not.toContain('soat-missing');
  });
});

describe('textos', () => {
  it('ningún texto de documentos afirma habilitación ni consecuencias legales', () => {
    const forbidden = /habilit|inhabilit|circular|multa|ilegal|sanci/i;
    const summaries: DocumentSummary[] = buildDocumentSummaries(
      [
        doc('s', 'soat', { expiresAt: '2026-09-01' }),
        doc('t', 'tax', { taxYear: 2026, dueDate: '2026-09-01' }),
        doc('p', 'policy', { expiresAt: '2026-10-05' }),
      ],
      TODAY,
    );
    const texts = [
      ...summaries.map((s) => s.detail),
      ...(['soat', 'rtm', 'license', 'tax', 'policy'] as const).flatMap((type) =>
        ([30, 7, 1, 'after'] as const).map((when) => documentReminderBody({ type, title: 'X', taxYear: 2026 }, when)),
      ),
    ];
    for (const text of texts) expect(text).not.toMatch(forbidden);
  });
});

describe('preferencias nuevas', () => {
  it('póliza, impuesto y otros arrancan encendidos en preferencias guardadas antes', () => {
    const old = { settings: { theme: 'dark', remindSoat: false } };
    const { settings } = sanitizeSettings(old);
    expect(settings.remindPolicy).toBe(true);
    expect(settings.remindTax).toBe(true);
    expect(settings.remindOther).toBe(true);
    expect(settings.remindSoat).toBe(false);
  });
});

describe('últimos 12 meses', () => {
  it('suma los pagos del período, incluye documentos y excluye lo anterior', () => {
    const entries: HistoryEntry[] = [
      doc('s', 'soat', { costCop: 500000, paidAt: '2026-01-10', expiresAt: '2027-01-10' }),
      doc('t', 'tax', { taxYear: 2026, costCop: 800000, paidAt: '2026-05-10' }),
      { id: 'e', kind: 'expense', date: '2026-09-05', category: 'wash', amountCop: 30000 },
      { id: 'old', kind: 'expense', date: '2025-09-30', category: 'wash', amountCop: 99999 },
    ];
    const year = computeRollingYearStats(entries, TODAY);
    expect(year).toMatchObject({ fromMonth: '2025-10', toMonth: '2026-09', totalCop: 1330000 });
    expect(year.byCategory.map((c) => c.key)).toEqual(['tax', 'soat', 'wash']);
    // Promedio desde el primer registro del período (enero → septiembre = 9 meses), no ÷ 12.
    expect(year.monthsCovered).toBe(9);
    expect(year.monthlyAverageCop).toBe(Math.round(1330000 / 9));
    expect(year.costPerKmCop).toBeUndefined();
  });

  it('sin registros: sin promedio inventado', () => {
    expect(computeRollingYearStats([], TODAY)).toMatchObject({ totalCop: 0, monthsCovered: 0, monthlyAverageCop: undefined });
  });
});
