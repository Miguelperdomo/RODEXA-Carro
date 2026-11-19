import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, View } from 'react-native';

import { costDateOf, entryCost } from '@/features/history/presentation';
import type { BudgetConfig } from '@/features/budget/rules';
import type { CarContact } from '@/features/contacts/rules';
import type { IncomeRecord } from '@/features/income/income';
import type { MyPart } from '@/features/parts/myParts';
import type { FineRecord } from '@/features/law/fines';
import type { CustomReminder } from '@/features/customReminders/rules';
import type { RecurringExpense } from '@/features/recurring/rules';
import type { PicoYPlacaConfig } from '@/features/picoYPlaca/rules';
import type { HistoryEntry } from '@/features/history/types';
import { odometerReadingOf } from '@/features/odometer/recordKm';
import type { ComponentSummary, CarProfile } from '@/features/cars/types';
import { DEMO_DATA_ENABLED } from '@/config/dev';
import { deleteCarPhotos } from '@/features/cars/carPhoto';
import { forgetParking } from '@/features/parking/useParking';
import { mockAppData } from '@/mocks/session';
import { OPENING_BACKGROUND, useTheme } from '@/shared/theme';
import { daysBetween, parseISODate, toISODate, today } from '@/shared/utils/date';
import { createConfirmedState } from '@/storage/confirmedState';
import {
  EMPTY_STORED_USER_DATA,
  clearUserData,
  loadUserData,
  UserDataReadError,
  type UserDataReadFailure,
  saveUserData,
  type StoredUserData,
} from '@/storage/userDataStore';

import { buildAppDataFromOnboarding } from './buildFromOnboarding';
import { DataLoadErrorView } from './components/DataLoadErrorView';
import { emptyAppData } from './emptyAppData';
import type { AppData, CarSheet, ComponentConfig, OnboardingData, UserProfile } from './types';
import {
  recordFrom,
  userDataActions as A,
  type NewDocument,
  type NewExpense,
  type NewEnergyRecord,
  type NewMaintenance,
  type NewOdometerReading,
} from './userDataActions';

export type { NewDocument, NewEnergyRecord, NewExpense, NewMaintenance, NewOdometerReading };

/** Mensaje cuando la escritura en el teléfono falló (el dato NO quedó guardado). */
export const SAVE_FAILED_MESSAGE = 'No se pudo guardar en tu celular. Intenta de nuevo.';

/**
 * Todas las acciones que modifican datos devuelven una promesa: `true` = quedó
 * guardado en el teléfono (y ya se ve en la app); `false` = no se guardó.
 */
type SessionValue = {
  /** ¿Ya se completó el primer ingreso? Decide qué rutas están disponibles. */
  onboardingDone: boolean;
  /** Respuestas en curso del formulario (para el resumen). */
  draft: OnboardingData | null;
  setDraft: (draft: OnboardingData) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  /** Edita el perfil del usuario (nombre, ciudad). */
  updateUser: (changes: UserProfile) => Promise<boolean>;
  /** Edita los datos del carro (marca, modelo, año, cilindraje, placa, uso…). */
  updateCar: (changes: Partial<CarProfile>) => Promise<boolean>;
  /** Registra un tanqueo, carga de GNC o carga eléctrica (Historial, Estadísticas y km si es mayor). */
  addEnergyRecord: (record: NewEnergyRecord) => Promise<boolean>;
  addOdometerReading: (reading: NewOdometerReading) => Promise<boolean>;
  addMaintenance: (record: NewMaintenance) => Promise<boolean>;
  addExpense: (record: NewExpense) => Promise<boolean>;
  addDocument: (record: NewDocument) => Promise<boolean>;
  /** Elimina un registro hecho después del primer ingreso. */
  removeRecord: (id: string) => Promise<boolean>;
  /** Reemplaza un registro por su versión editada (también mantenimientos del primer ingreso). */
  editEntry: (id: string, entry: HistoryEntry) => Promise<boolean>;
  /** Borra un registro (también mantenimientos del primer ingreso). */
  deleteEntry: (id: string) => Promise<boolean>;
  /** "Deshacer" de un borrado: vuelve a poner el registro guardado tal cual (mismo id). */
  restoreEntry: (record: HistoryEntry) => Promise<boolean>;
  saveComponentConfig: (code: ComponentSummary['code'], config: ComponentConfig) => Promise<boolean>;
  /** Ficha de mi carro (datos que anota el usuario). */
  carSheet: CarSheet;
  updateCarSheet: (sheet: CarSheet) => Promise<boolean>;
  /** Borra del teléfono el carro y todos los registros (no las preferencias). */
  deleteAllData: () => Promise<void>;
  /** "Borrar mis registros de prueba" (conserva el carro, los documentos y las configuraciones). */
  clearTestRecords: () => Promise<boolean>;
  /** Pico y placa que configuró el usuario (undefined = sin configurar). */
  picoYPlaca?: PicoYPlacaConfig;
  setPicoYPlaca: (config: PicoYPlacaConfig | null) => Promise<boolean>;
  budget?: BudgetConfig;
  setBudget: (budget: BudgetConfig | null) => Promise<boolean>;
  recurringExpenses: RecurringExpense[];
  setRecurringExpenses: (list: RecurringExpense[]) => Promise<boolean>;
  /** Registra un gasto y, si se pide, lo guarda también como gasto que se repite (en un solo paso). */
  addExpenseWithRecurring: (expense: NewExpense, recurring: RecurringExpense) => Promise<boolean>;
  customReminders: CustomReminder[];
  setCustomReminders: (list: CustomReminder[]) => Promise<boolean>;
  contacts: CarContact[];
  setContacts: (list: CarContact[]) => Promise<boolean>;
  /** Ingresos del carro (aparte de los gastos). */
  incomes: IncomeRecord[];
  setIncomes: (list: IncomeRecord[]) => Promise<boolean>;
  /** Repuestos de mi carro. */
  myParts: MyPart[];
  setMyParts: (list: MyPart[]) => Promise<boolean>;
  /** Comparendos que anotó. */
  fines: FineRecord[];
  setFines: (list: FineRecord[]) => Promise<boolean>;
  /** Lo guardado en el teléfono tal cual (para exportar una copia de seguridad). */
  storedData: StoredUserData;
  /** Importar una copia: reemplaza TODO lo guardado por la copia ya validada. */
  replaceAllData: (data: StoredUserData) => Promise<boolean>;
  data: AppData;
};

type Edits = { user?: UserProfile; profile?: Partial<CarProfile>; records?: HistoryEntry[] };

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Solo para los datos de demostración (sin primer ingreso): aplica ediciones y
 * registros sobre los datos base. Con primer ingreso, todo se arma en
 * buildAppDataFromOnboarding a partir de lo guardado.
 */
export function applyEdits(base: AppData, edits: Edits): AppData {
  const records = edits.records ?? [];
  if (!edits.user && !edits.profile && records.length === 0) return base;
  const profile = { ...base.profile, ...edits.profile };
  const now = today();

  // Un registro con km mayor al último también es una lectura del tablero.
  // Con km desconocido (null) NO es una lectura: el último km conocido se conserva.
  let odometer = base.odometer;
  for (const record of records) {
    const r = odometerReadingOf(record);
    if (!r) continue;
    if (r.km > odometer.registeredKm && r.date >= odometer.lastReadingDate) {
      odometer = {
        registeredKm: r.km,
        lastReadingDate: r.date,
        daysSinceReading: Math.max(0, daysBetween(parseISODate(r.date), now)),
        // El estimado anterior ya no aplica a la nueva lectura.
        estimate: { kind: 'insufficient' },
      };
    }
  }

  const monthKey = toISODate(now).slice(0, 7);
  const addedThisMonth = records
    .filter((r) => costDateOf(r).startsWith(monthKey))
    .reduce((sum, r) => sum + entryCost(r), 0);

  return {
    ...base,
    user: { ...base.user, ...edits.user },
    profile,
    odometer,
    history: records.length > 0 ? [...records, ...base.history] : base.history,
    dashboard: {
      ...base.dashboard,
      odometer,
      weeklyCheckDue: odometer.daysSinceReading >= 7,
      month: { ...base.dashboard.month, totalCop: base.dashboard.month.totalCop + addedThisMonth },
      car: {
        name: `${profile.brandName} ${profile.model}`.trim(),
        subtitle: profile.year ? `Mi carro · ${profile.year}` : 'Mi carro',
      },
    },
  };
}

/** Datos para las pantallas a partir de lo guardado en el teléfono. */
export function buildSessionData(stored: StoredUserData, now: Date, demoEnabled = DEMO_DATA_ENABLED): AppData {
  const { onboarding, userEdits, profileEdits, records, componentConfigs } = stored;
  if (!onboarding) {
    // Sin primer ingreso: vacío. El carro ficticio SOLO si se activó a propósito en desarrollo.
    return demoEnabled
      ? applyEdits(mockAppData, { user: userEdits, profile: profileEdits, records })
      : emptyAppData(now);
  }
  const defined = Object.fromEntries(Object.entries(userEdits).filter(([, v]) => v !== undefined));
  const merged: OnboardingData = {
    ...onboarding,
    user: { ...onboarding.user, ...defined },
    profile: { ...onboarding.profile, ...profileEdits },
  };
  return buildAppDataFromOnboarding(merged, now, { records, componentConfigs });
}

/**
 * Estado de la sesión, GUARDADO EN EL TELÉFONO (storage/userDataStore).
 * 1) Al abrir la app se lee lo guardado; hasta terminar NO se muestra nada ni se
 *    escribe nada (nunca se pisan datos con valores iniciales).
 * 2) Cada cambio se guarda de inmediato (en cola, en orden) y la app lo muestra
 *    SOLO cuando la escritura terminó bien (las pantallas esperan el resultado).
 */
/** Lista vacía compartida (misma referencia: no fuerza redibujos). */
const EMPTY_LIST: never[] = [];

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  const [stored, setStored] = useState<StoredUserData | null>(null);
  // Estado confirmado en el disco + cambios pendientes (antes de hidratar no escribe nada).
  // Se crea una sola vez y vive mientras viva la app (no se usa para dibujar).
  const [store] = useState(() => createConfirmedState<StoredUserData>(saveUserData, setStored));

  // Si no se pudieron cargar los datos, NO se hidrata: sin hidratar, `commit` no escribe
  // nada, así ningún cambio sobrescribe lo guardado. Se muestra un aviso con "Reintentar".
  const [loadError, setLoadError] = useState<UserDataReadFailure | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadUserData()
      .then((data) => {
        if (!alive) return;
        store.hydrate(data);
        setLoadError(null);
        setStored(data);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setLoadError(error instanceof UserDataReadError ? error.reason : 'read-error');
      });
    return () => {
      alive = false;
    };
  }, [store, loadAttempt]);

  const actions = useMemo(() => {
    const commit = (change: (data: StoredUserData) => StoredUserData) => store.commit(change);
    return {
      setDraft: (draft: OnboardingData) => commit((d) => A.setDraft(d, draft)),
      completeOnboarding: () => commit(A.completeOnboarding),
      updateUser: (changes: UserProfile) => commit((d) => A.updateUser(d, changes)),
      updateCar: (changes: Partial<CarProfile>) => commit((d) => A.updateCar(d, changes)),
      addEnergyRecord: (r: NewEnergyRecord) => commit((d) => A.addRecord(d, recordFrom.energy(r))),
      addOdometerReading: (r: NewOdometerReading) => commit((d) => A.addRecord(d, recordFrom.odometer(r))),
      addMaintenance: (r: NewMaintenance) => commit((d) => A.addRecord(d, recordFrom.maintenance(r))),
      addExpense: (r: NewExpense) => commit((d) => A.addRecord(d, recordFrom.expense(r))),
      addDocument: (r: NewDocument) => commit((d) => A.addRecord(d, recordFrom.document(r))),
      removeRecord: (id: string) => commit((d) => A.removeRecord(d, id)),
      editEntry: (id: string, entry: HistoryEntry) => commit((d) => A.editEntry(d, id, entry)),
      deleteEntry: (id: string) => commit((d) => A.deleteEntry(d, id)),
      restoreEntry: (record: HistoryEntry) => commit((d) => (d.records.some((r) => r.id === record.id) ? d : A.addRecord(d, record))),
      saveComponentConfig: (code: ComponentSummary['code'], config: ComponentConfig) =>
        commit((d) => A.saveComponentConfig(d, code, config)),
      updateCarSheet: (sheet: CarSheet) => commit((d) => A.updateCarSheet(d, sheet)),
      replaceAllData: (data: StoredUserData) => commit(() => data),
      setPicoYPlaca: (config: PicoYPlacaConfig | null) => commit((d) => A.setPicoYPlaca(d, config)),
      setBudget: (budget: BudgetConfig | null) => commit((d) => A.setBudget(d, budget)),
      setRecurringExpenses: (list: RecurringExpense[]) => commit((d) => A.setRecurringExpenses(d, list)),
      addExpenseWithRecurring: (expense: NewExpense, recurring: RecurringExpense) =>
        commit((d) =>
          A.setRecurringExpenses(A.addRecord(d, recordFrom.expense({ ...expense, recurringId: recurring.id })), [
            ...(d.recurringExpenses ?? []),
            recurring,
          ]),
        ),
      setCustomReminders: (list: CustomReminder[]) => commit((d) => A.setCustomReminders(d, list)),
      setContacts: (list: CarContact[]) => commit((d) => A.setContacts(d, list)),
      setIncomes: (list: IncomeRecord[]) => commit((d) => A.setIncomes(d, list)),
      setMyParts: (list: MyPart[]) => commit((d) => A.setMyParts(d, list)),
      setFines: (list: FineRecord[]) => commit((d) => A.setFines(d, list)),
      clearTestRecords: () => commit(A.clearTestRecords),
      deleteAllData: async () => {
        await clearUserData();
        // "¿Dónde lo parqueé?" vive en su propia clave: también se olvida.
        await forgetParking();
        // La foto del carro también (vive en su carpeta, no en los datos).
        deleteCarPhotos();
        store.reset(EMPTY_STORED_USER_DATA);
      },
    };
  }, [store]);

  // El día actual: al volver a la app otro día se recalculan "hace X días", vencimientos, etc.
  const [day, setDay] = useState(() => toISODate(today()));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') setDay(toISODate(today()));
    });
    return () => sub.remove();
  }, []);

  // Sin useMemo manual: el React Compiler lo memoiza (con useMemo no podía conservarlo).
  const data = stored ? buildSessionData(stored, parseISODate(day)) : null;

  const value = useMemo<SessionValue | null>(
    () =>
      stored && data
        ? {
            // Con los datos demo activados (solo desarrollo) se salta el primer ingreso.
            onboardingDone: stored.onboarding !== null || DEMO_DATA_ENABLED,
            draft: stored.draft,
            carSheet: stored.carSheet,
            storedData: stored,
            picoYPlaca: stored.picoYPlaca,
            budget: stored.budget,
            recurringExpenses: stored.recurringExpenses ?? EMPTY_LIST,
            customReminders: stored.customReminders ?? EMPTY_LIST,
            contacts: stored.contacts ?? EMPTY_LIST,
            incomes: stored.incomes ?? EMPTY_LIST,
            myParts: stored.myParts ?? EMPTY_LIST,
            fines: stored.fines ?? EMPTY_LIST,
            data,
            ...actions,
          }
        : null,
    [stored, data, actions],
  );

  if (loadError) {
    return (
      <DataLoadErrorView
        reason={loadError}
        onRetry={() => {
          setLoadError(null);
          setLoadAttempt((n) => n + 1);
        }}
      />
    );
  }

  // Cargando lo guardado: fondo neutro (la splash de RODEXA aparece enseguida).
  if (!value) return <View style={{ flex: 1, backgroundColor: OPENING_BACKGROUND[isDark ? 'dark' : 'light'] }} />;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return value;
}

/** Datos para las pantallas (del primer ingreso o de demostración). */
export function useAppData(): AppData {
  return useSession().data;
}
