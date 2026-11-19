import { unwrap, wrap } from '../envelope';
import { migrateUserDataV1toV2, USER_MIGRATIONS, USER_SCHEMA_VERSION } from '../migrations/userData';

const USER_SCHEMA = { version: USER_SCHEMA_VERSION, migrations: USER_MIGRATIONS };

/** Datos tal como los guardaba la versión 1 (sin energía en el perfil). */
const v1Data = {
  onboarding: {
    user: { name: 'Ana', city: 'Bogotá' },
    profile: { id: 'car-1', brandCode: 'mazda', brandName: 'Mazda', model: 'Mazda 3', displacementCc: 2000 },
    km: 40000,
    maintenance: [{ code: 'oil', date: '2026-09-01', km: 39000, costCop: null }],
    documents: { soatExpiresAt: '2027-01-10' },
    completedAt: '2026-09-10',
  },
  draft: null,
  userEdits: {},
  profileEdits: {},
  records: [{ id: 'km-1', kind: 'odometer', date: '2026-09-20', km: 40500 }],
  componentConfigs: { oil: { enabled: true, interval: { km: 8000 } } },
  carSheet: { notes: 'Llantas nuevas' },
  unrecognizedRecords: [],
};

describe('migración de datos del usuario (v1 → v2)', () => {
  it('agrega energySource "unknown" sin asumir gasolina', () => {
    const result = unwrap(wrap(v1Data, 1), USER_SCHEMA);
    expect(result.ok).toBe(true);
    const data = (result as { ok: true; data: typeof v1Data }).data;
    expect((data.onboarding.profile as Record<string, unknown>).energySource).toBe('unknown');
  });

  it('conserva todo lo demás: registros, configuración, ficha y datos del perfil', () => {
    const migrated = migrateUserDataV1toV2(v1Data) as typeof v1Data;
    expect(migrated.records).toEqual(v1Data.records);
    expect(migrated.componentConfigs).toEqual(v1Data.componentConfigs);
    expect(migrated.carSheet).toEqual(v1Data.carSheet);
    expect(migrated.onboarding.maintenance).toEqual(v1Data.onboarding.maintenance);
    expect(migrated.onboarding.profile.displacementCc).toBe(2000);
  });

  it('no pisa una energía que ya exista', () => {
    const withEnergy = {
      ...v1Data,
      onboarding: { ...v1Data.onboarding, profile: { ...v1Data.onboarding.profile, energySource: 'diesel' } },
    };
    const migrated = migrateUserDataV1toV2(withEnergy) as typeof withEnergy;
    expect(migrated.onboarding.profile.energySource).toBe('diesel');
  });

  it('sin primer ingreso (null) no inventa un perfil', () => {
    const migrated = migrateUserDataV1toV2({ ...v1Data, onboarding: null }) as { onboarding: unknown };
    expect(migrated.onboarding).toBeNull();
  });

  it('datos con otra forma se devuelven tal cual (la lectura tolerante decide)', () => {
    expect(migrateUserDataV1toV2('texto')).toBe('texto');
    expect(migrateUserDataV1toV2(null)).toBeNull();
  });

  it('datos ya en v2 no se vuelven a migrar', () => {
    const v2 = migrateUserDataV1toV2(v1Data);
    const result = unwrap(wrap(v2, 2), USER_SCHEMA);
    expect(result).toEqual({ ok: true, data: v2 });
  });

  it('las preferencias y el viaje siguen en la versión 1 sin necesitar migración', () => {
    expect(unwrap(wrap({ theme: 'dark' }))).toEqual({ ok: true, data: { theme: 'dark' } });
  });

  it('datos de una versión MÁS NUEVA no se tocan', () => {
    expect(unwrap(wrap(v1Data, USER_SCHEMA_VERSION + 1), USER_SCHEMA)).toEqual({
      ok: false,
      reason: 'newer-version',
    });
  });

  it('si faltara una migración, lo informa en vez de leer datos a medias', () => {
    expect(unwrap(wrap(v1Data, 1), { version: USER_SCHEMA_VERSION + 1, migrations: USER_MIGRATIONS })).toEqual({
      ok: false,
      reason: 'missing-migration',
    });
  });
});
