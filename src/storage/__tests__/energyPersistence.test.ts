/** Datos de PRUEBA (no son precios ni consumos reales). */
import { unwrap, wrap } from '../envelope';
import { migrateFuelRecordV2toV3, USER_MIGRATIONS, USER_SCHEMA_VERSION } from '../migrations/userData';
import { EMPTY_STORED_USER_DATA, flushUserData, loadUserData, sanitizeUserData, saveUserData } from '../userDataStore';

const mockMemory = new Map<string, string>();
jest.mock('../keyValueStore', () => ({
  keyValueStore: {
    get: async (key: string) => mockMemory.get(key) ?? null,
    set: async (key: string, value: string) => void mockMemory.set(key, value),
    remove: async (key: string) => void mockMemory.delete(key),
    keys: async () => [...mockMemory.keys()],
    removeMany: async (keys: string[]) => keys.forEach((k) => mockMemory.delete(k)),
  },
  STORAGE_KEYS: { user: 'rodexa:user', settings: 'rodexa:settings', backup: (key: string) => `${key}:backup:1` },
}));

beforeEach(() => mockMemory.clear());

/** Tanqueo tal como lo guardaba la versión 2 (valor pagado + precio del galón). */
const oldFuel = {
  id: 'fuel-1',
  kind: 'fuel',
  date: '2026-09-01',
  km: 50000,
  amountCop: 32000,
  pricePerGallonCop: 16000,
  litersCalculated: 7.57082,
  fullTank: true,
  station: 'Estación de prueba',
};

const onboarding = {
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
  km: 49000,
  maintenance: [],
  documents: {},
  completedAt: '2026-08-01',
};

describe('24. migración de tanqueos (v2 → v3)', () => {
  it('agrega cantidad en galones, costo y precio SIN borrar los campos originales', () => {
    const migrated = migrateFuelRecordV2toV3(oldFuel) as Record<string, unknown>;
    expect(migrated).toMatchObject({ quantity: 2, unit: 'gal', costCop: 32000, unitPriceCop: 16000 });
    // Lo que escribió el usuario se conserva tal cual.
    expect(migrated).toMatchObject(oldFuel);
  });

  it('sin precio del galón usa los litros ya calculados', () => {
    const migrated = migrateFuelRecordV2toV3({ ...oldFuel, pricePerGallonCop: undefined }) as Record<string, unknown>;
    expect(migrated).toMatchObject({ quantity: 7.57082, unit: 'L', costCop: 32000 });
    expect(migrated.unitPriceCop).toBeUndefined();
  });

  it('un registro ya migrado u otro tipo no se toca', () => {
    const current = { id: 'c', kind: 'charge', date: '2026-09-01', km: 1, quantity: 30 };
    expect(migrateFuelRecordV2toV3(current)).toBe(current);
    const done = migrateFuelRecordV2toV3(oldFuel);
    expect(migrateFuelRecordV2toV3(done)).toBe(done);
  });

  it('datos v2 completos → v3: el tanqueo queda válido y no va a "no reconocidos"', () => {
    const result = unwrap(wrap({ onboarding, records: [oldFuel] }, 2), {
      version: USER_SCHEMA_VERSION,
      migrations: USER_MIGRATIONS,
    });
    expect(result.ok).toBe(true);
    const { data } = sanitizeUserData((result as { ok: true; data: unknown }).data);
    expect(data.records).toHaveLength(1);
    expect(data.unrecognizedRecords).toEqual([]);
    expect(data.records[0]).toMatchObject({ kind: 'fuel', quantity: 2, unit: 'gal' });
  });

  it('datos v1 pasan por todas las migraciones (energía sin confirmar + tanqueos)', async () => {
    const v1 = { onboarding: { ...onboarding, profile: { ...onboarding.profile, energySource: undefined } }, records: [oldFuel] };
    delete (v1.onboarding.profile as Record<string, unknown>).energySource;
    mockMemory.set('rodexa:user', wrap(v1, 1));
    const data = await loadUserData();
    expect(data.onboarding?.profile.energySource).toBe('unknown');
    expect(data.records[0]).toMatchObject({ quantity: 2, unit: 'gal' });
  });
});

describe('23. persistencia de registros de energía', () => {
  it('tanqueo, GNC y carga sobreviven a guardar y volver a abrir', async () => {
    const records = [
      { id: 'f', kind: 'fuel', date: '2026-09-01', km: 100, quantity: 35, unit: 'L', fullTank: true, costCop: 140000, unitPriceCop: 4000 },
      { id: 'g', kind: 'cng', date: '2026-09-02', km: 200, quantity: 18, fullFill: true },
      { id: 'c', kind: 'charge', date: '2026-09-03', km: 300, quantity: 32, startPercent: 20, endPercent: 80, chargeType: 'ac', location: 'Casa' },
    ] as const;
    await saveUserData({ ...EMPTY_STORED_USER_DATA, onboarding: onboarding as never, records: records as never });
    await flushUserData();
    const loaded = await loadUserData();
    expect(loaded.records).toEqual(records);
    expect(loaded.unrecognizedRecords).toEqual([]);
  });

  it('una carga sin costo se guarda sin inventar un valor', async () => {
    const record = { id: 'c', kind: 'charge', date: '2026-09-03', km: 300, quantity: 32 };
    const { data } = sanitizeUserData({ onboarding, records: [record] });
    expect(data.records[0]).toEqual(record);
    expect('costCop' in data.records[0]).toBe(false);
  });

  it('registros inválidos no se borran: se conservan aparte', () => {
    const bad = [
      { id: 'x', kind: 'charge', date: '2026-09-03', km: 300, quantity: 0 },
      { id: 'y', kind: 'charge', date: '2026-09-03', km: 300, quantity: 10, endPercent: 150 },
      { id: 'z', kind: 'fuel', date: '2026-09-03', km: 300, quantity: 10, unit: 'barriles', fullTank: true },
    ];
    const { data } = sanitizeUserData({ onboarding, records: bad });
    expect(data.records).toEqual([]);
    expect(data.unrecognizedRecords).toEqual(bad);
  });
});
