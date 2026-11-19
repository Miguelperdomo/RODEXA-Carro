/** Lista de ajustes antes de publicar: avisos por ciclo, solo km, costos no negativos y copias sin repetir. */
import { buildNotifications } from '@/features/notifications/build';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { EMPTY_STORED_USER_DATA, sanitizeUserData } from '@/storage/userDataStore';

import { buildAppDataFromOnboarding } from '../buildFromOnboarding';
import type { OnboardingData } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };

const TODAY = new Date(2026, 9, 5);
const onboarding = (date: string, km: number): OnboardingData => ({
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
  km: 20000,
  maintenance: [{ code: 'oil', date, km, costCop: null }],
  documents: {},
  completedAt: '2026-01-01',
});

describe('avisos de mantenimiento por ciclo', () => {
  it('el aviso del siguiente cambio de aceite es otro: no aparece ya leído', () => {
    const configs = { oil: { enabled: true, interval: { km: 5000 } } };
    const idOf = (date: string, km: number) =>
      buildNotifications(buildAppDataFromOnboarding(onboarding(date, km), TODAY, { componentConfigs: configs }), DEFAULT_SETTINGS, TODAY).find((n) =>
        n.id.startsWith('maint-oil'),
      )?.id;
    const first = idOf('2026-01-10', 14500);
    const next = idOf('2026-06-10', 15000);
    expect(first).toBeDefined();
    expect(next).toBeDefined();
    expect(first).not.toBe(next);
  });
});

describe('importar: sin costos negativos', () => {
  it('un mantenimiento o un gasto con valor negativo no se acepta (queda aparte, sin borrarse)', () => {
    const { data } = sanitizeUserData({
      ...EMPTY_STORED_USER_DATA,
      records: [
        { id: 'm', kind: 'maintenance', date: '2026-09-01', km: 1, types: ['oil'], costCop: -50000 },
        { id: 'e', kind: 'expense', date: '2026-09-01', category: 'wash', amountCop: -1000 },
        { id: 'ok', kind: 'expense', date: '2026-09-01', category: 'wash', amountCop: 15000 },
      ],
    });
    expect(data.records.map((r) => r.id)).toEqual(['ok']);
    expect(data.unrecognizedRecords).toHaveLength(2);
  });
});

describe('textos y pantallas', () => {
  const read = (p: string) => readFileSync(p, 'utf8');

  it('solo kilómetros: ya no se puede elegir millas', () => {
    expect(read('src/app/configuracion/preferencias.tsx')).not.toMatch(/prefs\.distance\.mi/);
    expect(read('src/features/settings/SettingsProvider.tsx')).toMatch(/distanceUnit: 'km'/);
  });

  it('Pro solo tiene dos entradas: la insignia de Inicio y una fila en Configuración', () => {
    expect(read('src/app/(tabs)/carro.tsx')).not.toMatch(/· Pro"/);
    expect(read('src/app/(tabs)/estadisticas.tsx')).not.toMatch(/RODEXA Pro/);
    expect(read('src/app/configuracion.tsx')).toMatch(/router\.push\('\/pro'\)/);
    expect(read('src/features/dashboard/components/DashboardHeader.tsx')).toMatch(/router\.push\('\/pro'\)/);
  });

  it('sin "Cerrar sesión" ni la sección "Registrar" duplicada', () => {
    expect(read('src/app/configuracion.tsx')).not.toMatch(/settings\.logout/);
    expect(read('src/app/configuracion/perfil.tsx')).not.toMatch(/settings\.logout/);
    expect(read('src/app/(tabs)/carro.tsx')).not.toMatch(/title="Registrar"/);
  });

  it('"Próximamente" se escribe igual en todas partes', () => {
    for (const p of ['src/features/pro/components/ProGate.tsx', 'src/app/ingresos.tsx', 'src/app/proximamente.tsx', 'src/i18n/es.ts']) {
      expect(read(p)).not.toMatch(/PRÓXIMAMENTE|'Pronto'/);
    }
  });
});
