import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import { LARGE_TEXT_SCALE, OPENING_BACKGROUND, ThemeProvider } from '@/shared/theme';
import { setFormatPreferences } from '@/shared/utils/formatPreferences';
import { loadSettings, saveSettings, type StoredSettings } from '@/storage/settingsStore';

import { DEFAULT_SETTINGS } from './defaults';
import type { Settings } from './types';

type SettingsValue = {
  settings: Settings;
  update: (changes: Partial<Settings>) => void;
  /** Restaura SOLO las preferencias. No toca carro, historial, mantenimientos ni documentos. */
  resetPreferences: () => void;
  /** Notificaciones leídas (no se reinician al restablecer preferencias). */
  readNotificationIds: string[];
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

/**
 * Preferencias de la app, GUARDADAS EN EL TELÉFONO (storage/settingsStore).
 * Se leen antes de mostrar la app (así el tema correcto aparece desde el inicio)
 * y cada cambio se guarda de inmediato. Envuelve al único ThemeProvider.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  // Antes de leer las preferencias solo se conoce el tema del teléfono (el de la carga nativa).
  const deviceScheme = useColorScheme();
  const [stored, setStored] = useState<StoredSettings | null>(null);
  // Último valor guardado, para encadenar cambios seguidos sin esperar a React.
  const [current] = useState(() => {
    let value: StoredSettings | null = null;
    return { get: () => value, set: (next: StoredSettings) => (value = next) };
  });

  useEffect(() => {
    let alive = true;
    loadSettings().then((value) => {
      if (!alive) return;
      current.set(value);
      setStored(value);
    });
    return () => {
      alive = false;
    };
  }, [current]);

  const commit = useCallback((change: (value: StoredSettings) => StoredSettings) => {
    const previous = current.get();
    // Antes de terminar la lectura inicial no se escribe nada.
    if (!previous) return;
    const next = change(previous);
    current.set(next);
    setStored(next);
    saveSettings(next).then((saved) => {
      // No quedó en el teléfono: se vuelve a lo guardado (sin cambios más nuevos en camino).
      if (!saved && current.get() === next) {
        current.set(previous);
        setStored(previous);
      }
    });
  }, [current]);

  const update = useCallback(
    (changes: Partial<Settings>) => commit((v) => ({ ...v, settings: { ...v.settings, ...changes } })),
    [commit],
  );
  const resetPreferences = useCallback(
    // "Avísame cuando salga" (Más apps de RODEXA) no es una preferencia: se conserva.
    // El estilo (Tranqui / Al detalle) y el combustible tampoco: se cambian en "Mi estilo".
    () => commit((v) => ({ ...v, settings: {
          ...DEFAULT_SETTINGS,
          usageStyle: v.settings.usageStyle,
          fuelTracking: v.settings.fuelTracking,
          // La foto del carro es un dato, no una preferencia.
          carPhotoUri: v.settings.carPhotoUri,
          lastBackupAt: v.settings.lastBackupAt,
          backupFolderUri: v.settings.backupFolderUri,
          backupFolderName: v.settings.backupFolderName,
          // Lo que escribió para "¿Cuánto me ahorro?" es un dato suyo, no una preferencia.
          transitFareCop: v.settings.transitFareCop,
          transitTripsPerMonth: v.settings.transitTripsPerMonth,
          familyAppsNotify: v.settings.familyAppsNotify,
          proNotifyMe: v.settings.proNotifyMe,
          proLaunchSeen: v.settings.proLaunchSeen,
        },
      })),
    [commit],
  );
  const markRead = useCallback(
    (id: string) =>
      commit((v) => (v.readNotificationIds.includes(id) ? v : { ...v, readNotificationIds: [...v.readNotificationIds, id] })),
    [commit],
  );
  const markAllRead = useCallback(
    (ids: string[]) =>
      commit((v) => ({ ...v, readNotificationIds: Array.from(new Set([...v.readNotificationIds, ...ids])) })),
    [commit],
  );

  // Sin useMemo manual: el React Compiler memoiza el valor (con useMemo no podía conservarlo).
  const value: SettingsValue | null = stored
    ? {
        settings: stored.settings,
        update,
        resetPreferences,
        readNotificationIds: stored.readNotificationIds,
        markRead,
        markAllRead,
      }
    : null;

  // Cargando lo guardado: el fondo de la apertura (la splash de RODEXA aparece enseguida).
  if (!value) return <View style={{ flex: 1, backgroundColor: OPENING_BACKGROUND[deviceScheme === 'dark' ? 'dark' : 'light'] }} />;

  // Formatos globales (km/mi, fecha) disponibles para todas las funciones de formato.
  // Solo kilómetros (como el tablero): las millas se retiraron.
  setFormatPreferences({ distanceUnit: 'km', dateFormat: value.settings.dateFormat });

  return (
    <SettingsContext.Provider value={value}>
      <ThemeProvider
        preference={value.settings.theme}
        textScale={value.settings.largeText ? LARGE_TEXT_SCALE : 1}
        highContrast={value.settings.sunMode}>
        {children}
      </ThemeProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return value;
}
