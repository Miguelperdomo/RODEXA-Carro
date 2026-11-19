/** Datos de PRUEBA. */
import { buildDocumentSummaries } from '@/features/documents/summary';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';

import { unwrap, wrap } from '../envelope';
import { migrateDocumentRecordV3toV4, USER_MIGRATIONS, USER_SCHEMA_VERSION } from '../migrations/userData';
import { sanitizeUserData } from '../userDataStore';

const TODAY = new Date(2026, 8, 30);
const SCHEMA = { version: USER_SCHEMA_VERSION, migrations: USER_MIGRATIONS };

describe('migración de documentos (v3 → v4)', () => {
  it('un impuesto guardado con "vencimiento" pasa a tener esa fecha como fecha límite, sin inventar el año', () => {
    const old = { id: 't', kind: 'document', date: '2026-01-01', docType: 'tax', expiresAt: '2026-10-15' };
    const migrated = migrateDocumentRecordV3toV4(old) as Record<string, unknown>;
    expect(migrated).toMatchObject({ ...old, dueDate: '2026-10-15' });
    expect(migrated.taxYear).toBeUndefined();
  });

  it('cada "Otro" recibe su serie y "tiene vencimiento" según tenía fecha', () => {
    const withDate = { id: 'o1', kind: 'document', date: '2026-01-01', docType: 'other', name: 'Permiso', expiresAt: '2027-01-01' };
    const withoutDate = { id: 'o2', kind: 'document', date: '2026-01-01', docType: 'other', name: 'Certificado' };
    expect(migrateDocumentRecordV3toV4(withDate)).toMatchObject({ seriesId: 'o1', hasExpiry: true });
    expect(migrateDocumentRecordV3toV4(withoutDate)).toMatchObject({ seriesId: 'o2', hasExpiry: false });
  });

  it('SOAT, RTM, licencia y gastos manuales no cambian', () => {
    const soat = { id: 's', kind: 'document', date: '2026-01-01', docType: 'soat', expiresAt: '2027-01-01' };
    const expense = { id: 'e', kind: 'expense', date: '2026-01-01', category: 'soat', amountCop: 500000 };
    expect(migrateDocumentRecordV3toV4(soat)).toBe(soat);
    expect(migrateDocumentRecordV3toV4(expense)).toBe(expense);
  });

  it('datos v3 completos: SOAT y RTM del primer ingreso siguen siendo la base', () => {
    const onboarding = {
      user: { name: 'Ana', city: '' },
      profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
      km: 1000,
      maintenance: [],
      documents: { soatExpiresAt: '2027-03-01', rtmExpiresAt: '2026-10-10' },
      completedAt: '2026-09-01',
    };
    const records = [{ id: 't', kind: 'document', date: '2026-02-01', docType: 'tax', expiresAt: '2026-10-15' }];
    const result = unwrap(wrap({ onboarding, records }, 3), SCHEMA);
    expect(result.ok).toBe(true);
    const { data } = sanitizeUserData((result as { ok: true; data: unknown }).data);
    expect(data.records).toHaveLength(1);
    expect(data.unrecognizedRecords).toEqual([]);

    const app = buildAppDataFromOnboarding(data.onboarding!, TODAY, { records: data.records });
    const byKey = Object.fromEntries(buildDocumentSummaries(app.history, TODAY).map((d) => [d.key, d]));
    expect(byKey.soat).toMatchObject({ status: 'ok', expiresAt: '2027-03-01' });
    expect(byKey.rtm).toMatchObject({ status: 'soon', expiresAt: '2026-10-10' });
    expect(byKey.tax).toMatchObject({ status: 'soon', alertDate: '2026-10-15' });
  });
});
