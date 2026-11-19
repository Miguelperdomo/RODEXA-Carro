import { wrap } from '../envelope';
import { USER_SCHEMA_VERSION } from '../migrations/userData';
import { createConfirmedState } from '../confirmedState';
import {
  clearUserData,
  EMPTY_STORED_USER_DATA,
  flushUserData,
  loadUserData,
  sanitizeUserData,
  saveUserData,
  UserDataReadError,
} from '../userDataStore';

/**
 * Almacenamiento en memoria en lugar de AsyncStorage (mismo contrato get/set/remove).
 * Jest sube `jest.mock` por encima de los imports, así que aplica antes de cargarlos.
 */
const mockMemory = new Map<string, string>();
/** Fallos simulados del teléfono: lecturas que fallan y escrituras de copias que fallan. */
const mockFail = { reads: 0, backupWrites: false };
jest.mock('../keyValueStore', () => ({
  keyValueStore: {
    get: async (key: string) => {
      if (mockFail.reads > 0) {
        mockFail.reads--;
        throw new Error('Row too big to fit into CursorWindow');
      }
      return mockMemory.get(key) ?? null;
    },
    set: async (key: string, value: string) => {
      if (mockFail.backupWrites && key.includes(':backup:')) throw new Error('disco lleno');
      mockMemory.set(key, value);
    },
    remove: async (key: string) => void mockMemory.delete(key),
    keys: async () => [...mockMemory.keys()],
    removeMany: async (keys: string[]) => keys.forEach((k) => mockMemory.delete(k)),
  },
  STORAGE_KEYS: { user: 'rodexa:user', settings: 'rodexa:settings', backup: (key: string) => `${key}:backup:1` },
}));

const onboarding = {
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' },
  km: 1000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-01',
};

beforeEach(() => {
  mockMemory.clear();
  mockFail.reads = 0;
  mockFail.backupWrites = false;
});

describe('almacenamiento corrupto', () => {
  it('JSON inválido: devuelve datos vacíos y guarda una copia intacta', async () => {
    mockMemory.set('rodexa:user', '{esto no es json');
    const data = await loadUserData();
    expect(data).toEqual(EMPTY_STORED_USER_DATA);
    expect(mockMemory.get('rodexa:user:backup:1')).toBe('{esto no es json');
  });

  it('registros no reconocidos se conservan aparte, nunca se borran', () => {
    const { data, problems } = sanitizeUserData({
      onboarding,
      records: [{ id: 'km-1', kind: 'odometer', date: '2026-09-02', km: 1100 }, { kind: 'raro' }],
    });
    expect(data.records).toHaveLength(1);
    expect(data.unrecognizedRecords).toEqual([{ kind: 'raro' }]);
    expect(problems.length).toBeGreaterThan(0);
  });

  it('un primer ingreso mal formado no se toma como válido', () => {
    const { data } = sanitizeUserData({ onboarding: { user: 'x' } });
    expect(data.onboarding).toBeNull();
  });
});

describe('migración al abrir la app', () => {
  it('datos guardados por la versión 1 se leen con energía "Sin confirmar"', async () => {
    mockMemory.set('rodexa:user', wrap({ onboarding, records: [] }, 1));
    const data = await loadUserData();
    expect(data.onboarding?.profile.energySource).toBe('unknown');
    expect(data.onboarding?.profile.model).toBe('Picanto');
  });

  it('al guardar se escribe con la versión nueva', async () => {
    await saveUserData(EMPTY_STORED_USER_DATA);
    await flushUserData();
    expect(JSON.parse(mockMemory.get('rodexa:user')!).schemaVersion).toBe(USER_SCHEMA_VERSION);
  });
});

describe('eliminación de datos', () => {
  it('"Eliminar todos los datos" borra los datos, sus copias y el progreso de viaje; conserva las preferencias', async () => {
    mockMemory.set('rodexa:user', wrap({ onboarding }, USER_SCHEMA_VERSION));
    mockMemory.set('rodexa:user:backup:111', 'copia vieja');
    mockMemory.set('rodexa:user:backup:222', 'otra copia');
    mockMemory.set('rodexa:travel-progress', wrap({ llantas: true }));
    mockMemory.set('rodexa:settings', wrap({ settings: {} }));
    await clearUserData();
    expect([...mockMemory.keys()]).toEqual(['rodexa:settings']);
    expect(await loadUserData()).toEqual(EMPTY_STORED_USER_DATA);
  });
});

describe('si los datos no se pueden leer, nunca se arranca vacío', () => {
  const saved = () => wrap({ onboarding, records: [] }, USER_SCHEMA_VERSION);
  const reasonOf = (p: Promise<unknown>) =>
    p.then(
      () => 'ok',
      (e: unknown) => (e instanceof UserDataReadError ? e.reason : 'otro error'),
    );

  it('un fallo momentáneo de lectura se reintenta y los datos cargan', async () => {
    mockMemory.set('rodexa:user', saved());
    mockFail.reads = 2;
    const data = await loadUserData();
    expect(data.onboarding?.profile.model).toBe('Picanto');
  });

  it('si la lectura sigue fallando: error "read-error" y lo guardado queda intacto', async () => {
    const original = saved();
    mockMemory.set('rodexa:user', original);
    mockFail.reads = 10;
    expect(await reasonOf(loadUserData())).toBe('read-error');
    expect(mockMemory.get('rodexa:user')).toBe(original);
  });

  it('datos de una versión más nueva: no se tocan ni se arranca vacío', async () => {
    const newer = wrap({ onboarding }, USER_SCHEMA_VERSION + 1);
    mockMemory.set('rodexa:user', newer);
    expect(await reasonOf(loadUserData())).toBe('newer-version');
    expect(mockMemory.get('rodexa:user')).toBe(newer);
  });

  it('datos dañados sin poder guardar su copia: no se continúa', async () => {
    mockMemory.set('rodexa:user', '{dañado');
    mockFail.backupWrites = true;
    expect(await reasonOf(loadUserData())).toBe('backup-failed');
    expect(mockMemory.get('rodexa:user')).toBe('{dañado');
  });

  it('registros no reconocidos sin poder guardar la copia: no se continúa', async () => {
    mockMemory.set('rodexa:user', wrap({ onboarding, records: [{ kind: 'raro' }] }, USER_SCHEMA_VERSION));
    mockFail.backupWrites = true;
    expect(await reasonOf(loadUserData())).toBe('backup-failed');
  });

  it('sin cargar los datos, ningún cambio se escribe (la sesión no se hidrata)', async () => {
    const save = jest.fn(async () => true);
    const state = createConfirmedState(save, () => {});
    expect(await state.commit((d) => d)).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });
});
