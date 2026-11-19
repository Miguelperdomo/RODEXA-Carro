/** Fase 20: calidad y detalles. */
import { Alert } from 'react-native';

import { backupFileName } from '@/features/data/backupFile';
import { folderName } from '@/features/data/backupIO';
import { reminderSettingsKey } from '@/features/notifications/local/LocalReminders';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { darkColors, lightColors, withHighContrast } from '@/shared/theme';
import { appAlert } from '@/shared/ui/AppDialog';
import { parseNumberInput } from '@/shared/ui/parseNumberInput';
import { cmpText } from '@/shared/utils/compare';
import { formatDaysAgo } from '@/shared/utils/format';
import { safePick } from '@/shared/utils/safePick';
import { sanitizeSettings } from '@/storage/settingsStore';

jest.mock('expo-document-picker', () => ({}));
jest.mock('expo-intent-launcher', () => ({ ResultCode: { Success: -1 } }));
jest.mock('expo-file-system', () => ({ Directory: class {}, File: class {} }));
jest.mock('expo-file-system/legacy', () => ({}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(p, 'utf8');

describe('ordenar fechas e ids con < y >', () => {
  it('mismo orden que antes, sin localeCompare en fechas', () => {
    expect(['2026-11-10', '2026-01-02', '2026-11-09'].sort(cmpText)).toEqual(['2026-01-02', '2026-11-09', '2026-11-10']);
    expect(cmpText('a', 'a')).toBe(0);
  });
});

describe('pegar un número', () => {
  it('quita los centavos al pegar, sin dañar el borrado', () => {
    expect(parseNumberInput('$350.000,00', '', 9)).toBe(350000);
    expect(parseNumberInput('350000.5', '', 9)).toBe(350000);
    // Escribir o borrar: nunca se quitan cifras.
    expect(parseNumberInput('1.23', '1.234', 9)).toBe(123);
    expect(parseNumberInput('12', '1', 9)).toBe(12);
    expect(parseNumberInput('', '1', 9)).toBeNull();
  });
});

describe('ventanas y avisos a prueba de fallos', () => {
  it('appAlert: sin la ventana propia montada, usa la del sistema (nunca se pierde)', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    appAlert('Título', 'Mensaje');
    expect(alert).toHaveBeenCalledWith('Título', 'Mensaje', [{ text: 'Entendido' }], undefined);
    alert.mockRestore();
  });

  it('safePick: si la cámara falla, avisa y devuelve null', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    expect(await safePick(() => Promise.reject(new Error('ocupada')))).toBeNull();
    expect(alert.mock.calls[0][0]).toBe('No se pudo abrir la cámara');
    expect(await safePick(() => Promise.resolve(5))).toBe(5);
    alert.mockRestore();
  });

  it('ya no se usa Alert.alert en la app (solo como respaldo de la ventana propia)', () => {
    const files = ['src/app/configuracion/privacidad.tsx', 'src/features/history/useEntryActions.ts', 'src/features/photos/pick.ts'];
    for (const f of files) expect(read(f)).not.toContain('Alert.alert(');
  });

  it('ErrorBoundary con "Reintentar" en la raíz', () => {
    const layout = read('src/app/_layout.tsx');
    expect(layout).toContain('export function ErrorBoundary');
    expect(layout).toContain('Reintentar');
    expect(layout).toContain('<AppDialogHost />');
  });

  it('borrar un registro se puede deshacer', () => {
    const src = read('src/features/history/useEntryActions.ts');
    expect(src).toMatch(/toast\.show\('Registro eliminado', \{\s*label: 'Deshacer'/);
    expect(src).toContain('restoreEntry(stored)');
  });
});

describe('Modo sol y celulares sencillos', () => {
  it('alto contraste en claro y oscuro', () => {
    const light = withHighContrast(lightColors);
    const dark = withHighContrast(darkColors);
    expect(light).toMatchObject({ highContrast: true, background: '#FFFFFF' });
    expect(light.text.primary).toBe('#000000');
    expect(dark).toMatchObject({ highContrast: true, background: '#000000' });
    expect(lightColors.highContrast).toBe(false);
    expect(DEFAULT_SETTINGS.sunMode).toBe(false);
  });

  it('"Antier" junto a Hoy y Ayer', () => {
    expect([0, 1, 2, 3].map(formatDaysAgo)).toEqual(['hoy', 'ayer', 'antier', 'hace 3 días']);
    expect(read('src/shared/ui/DateField.tsx')).toContain('label="Antier"');
  });

  it('sin animaciones si el celular las apaga', () => {
    expect(read('src/shared/ui/OptionSheet.tsx')).toContain("reduceMotionNow() ? 'none' : 'slide'");
    expect(read('src/features/onboarding/components/LoadingDots.tsx')).toContain('useReduceMotion()');
  });
});

describe('avisos del celular', () => {
  it('el plan solo se recalcula con preferencias que lo afectan', () => {
    const base = reminderSettingsKey(DEFAULT_SETTINGS);
    expect(reminderSettingsKey({ ...DEFAULT_SETTINGS, theme: 'dark', largeText: true, sunMode: true })).toBe(base);
    expect(reminderSettingsKey({ ...DEFAULT_SETTINGS, maintenanceReminders: false })).not.toBe(base);
  });

  it('mantenimiento con contexto: "llevas X km desde el último cambio" (solo con datos reales)', () => {
    const data = buildAppDataFromOnboarding(
      {
        user: { name: 'Ana', city: '' },
        profile: { id: 'c', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
        km: 20000,
        maintenance: [],
        documents: {},
        completedAt: '2026-11-01',
      },
      new Date(2026, 10, 2),
      { componentConfigs: { oil: { enabled: true, interval: { km: 5000 }, lastService: { km: 15500, setAt: '2026-11-01' } } } },
    );
    const oil = buildReminderPlan(data, DEFAULT_SETTINGS, new Date(2026, 10, 1, 8)).find((r) => r.category === 'maintenance');
    expect(oil?.body).toContain('Llevas 4.500 km desde el último cambio.');
  });
});

describe('permisos e idioma', () => {
  it('solo cámara, internet, vibración y notificaciones: se bloquean micrófono, almacenamiento y ventanas flotantes', () => {
    const app = JSON.parse(read('app.json')) as { expo: { android: { blockedPermissions: string[] } } };
    expect(app.expo.android.blockedPermissions.sort()).toEqual(
      [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ].sort(),
    );
  });

  it('solo español: una preferencia guardada en inglés vuelve a español', () => {
    expect(sanitizeSettings({ settings: { language: 'en' } }).settings.language).toBe('es');
    expect(read('src/app/configuracion/idioma.tsx')).not.toContain("value: 'en'");
  });
});

describe('copia de seguridad', () => {
  it('la hora en el nombre: dos copias del mismo día no chocan', () => {
    expect(backupFileName('2026-11-11', '1430')).toBe('RODEXA-Carro-copia-2026-11-11-1430.rodexa');
  });

  it('nombre de la carpeta que ve la persona', () => {
    expect(folderName({ name: 'RODEXA', uri: 'content://x/tree/primary%3ADownload%2FRODEXA' })).toBe('RODEXA');
    expect(folderName({ uri: 'content://x/tree/primary%3ADownload%2FRODEXA' })).toBe('RODEXA');
  });

  it('recuerda la carpeta, tiene un camino de respaldo y muestra un diagnóstico si falla', () => {
    const io = read('src/features/data/backupIO.ts');
    expect(io).toContain('StorageAccessFramework.createFileAsync');
    expect(io).toContain('export function lastSaveProblem');
    const screen = read('src/app/configuracion/datos.tsx');
    expect(screen).toContain('saveInSavedFolder(settings.backupFolderUri');
    expect(screen).toContain('envíanos una captura de esto');
    // Restaurar una copia no toca las preferencias: se conservan la carpeta y la foto de este celular.
    expect(DEFAULT_SETTINGS.backupFolderUri).toBe('');
  });
});
