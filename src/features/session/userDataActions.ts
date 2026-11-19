import type { EnergyRecord, HistoryEntry } from '@/features/history/types';
import type { BudgetConfig } from '@/features/budget/rules';
import type { CarContact } from '@/features/contacts/rules';
import type { CustomReminder } from '@/features/customReminders/rules';
import { buildCredit, creditOf } from '@/features/credit/credit';
import type { IncomeRecord } from '@/features/income/income';
import type { MyPart } from '@/features/parts/myParts';
import type { FineRecord } from '@/features/law/fines';
import type { RecurringExpense } from '@/features/recurring/rules';
import type { PicoYPlacaConfig } from '@/features/picoYPlaca/rules';
import { parseISODate } from '@/shared/utils/date';
import type { ComponentSummary, CarProfile } from '@/features/cars/types';

import type { CarSheet, ComponentConfig, OnboardingData, UserData, UserProfile, OnboardingMaintenance } from './types';

type Entry<K extends HistoryEntry['kind']> = Extract<HistoryEntry, { kind: K }>;

/** Un tanqueo, carga de GNC o carga eléctrica tal como lo escribió el usuario (sin id). */
export type NewEnergyRecord = EnergyRecord extends infer R ? (R extends EnergyRecord ? Omit<R, 'id'> : never) : never;
export type NewOdometerReading = Omit<Entry<'odometer'>, 'id' | 'kind'>;
export type NewMaintenance = Omit<Entry<'maintenance'>, 'id' | 'kind'>;
export type NewExpense = Omit<Entry<'expense'>, 'id' | 'kind'>;
export type NewDocument = Omit<Entry<'document'>, 'id' | 'kind'>;

export const newId = (kind: string) =>
  `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Cambios sobre los datos del usuario, como funciones puras (dato → dato nuevo).
 * SessionProvider las aplica y guarda el resultado; las pruebas las usan igual.
 */
export const userDataActions = {
  setDraft: <T extends UserData>(d: T, draft: OnboardingData): T => ({ ...d, draft }),
  /**
   * Termina el registro. Si respondió "¿Tu carro está a crédito?", se crea el crédito del carro
   * (un gasto que se repite, como si lo hubiera anotado en Mi carro → Crédito).
   */
  completeOnboarding: <T extends UserData>(d: T): T => {
    if (!d.draft) return d;
    const { credit, ...onboarding } = d.draft;
    const done = { ...d, onboarding, draft: null };
    if (!credit || creditOf(d.recurringExpenses ?? [])) return done;
    const item = buildCredit(credit, newId('credit'), parseISODate(onboarding.completedAt));
    return setList(done, 'recurringExpenses', [...(d.recurringExpenses ?? []), item]);
  },
  updateUser: <T extends UserData>(d: T, changes: UserProfile): T => ({ ...d, userEdits: { ...d.userEdits, ...changes } }),
  /**
   * Con primer ingreso, los cambios se aplican sobre el perfil guardado y un campo
   * en `undefined` se BORRA de verdad (JSON descarta los undefined: si solo se
   * guardaran como edición, al reabrir volvería el valor anterior).
   */
  updateCar: <T extends UserData>(d: T, changes: Partial<CarProfile>): T => {
    if (!d.onboarding) return { ...d, profileEdits: { ...d.profileEdits, ...changes } };
    const merged = { ...d.onboarding.profile, ...d.profileEdits, ...changes };
    const profile = Object.fromEntries(
      Object.entries(merged).filter(([, value]) => value !== undefined),
    ) as CarProfile;
    return { ...d, onboarding: { ...d.onboarding, profile }, profileEdits: {} };
  },
  addRecord: <T extends UserData>(d: T, record: HistoryEntry): T => ({ ...d, records: [...d.records, record] }),
  removeRecord: <T extends UserData>(d: T, id: string): T => ({ ...d, records: d.records.filter((r) => r.id !== id) }),
  /**
   * Reemplaza un registro por su versión editada. Si es un mantenimiento del primer
   * ingreso ("onb-m-N"), se retira de allí (sin mover a los demás) y queda como registro
   * normal CON EL MISMO id: la pantalla que lo muestra sigue mostrando ese mismo registro.
   */
  editEntry: <T extends UserData>(d: T, id: string, entry: HistoryEntry): T => {
    // Km inicial (p. ej. escribió 150.000 en vez de 15.000): se corrige en el primer ingreso.
    if (id === 'onb-km' && entry.kind === 'odometer' && d.onboarding) {
      return { ...d, onboarding: { ...d.onboarding, km: entry.km } };
    }
    if (d.records.some((r) => r.id === id)) {
      return { ...d, records: d.records.map((r) => (r.id === id ? { ...entry, id } : r)) };
    }
    const index = onboardingMaintenanceIndex(d, id);
    if (index === null || !d.onboarding) return d;
    return {
      ...d,
      onboarding: { ...d.onboarding, maintenance: retire(d.onboarding.maintenance, index) },
      records: [...d.records, { ...entry, id }],
    };
  },
  /** Borra un registro (o un mantenimiento del primer ingreso). */
  deleteEntry: <T extends UserData>(d: T, id: string): T => {
    if (d.records.some((r) => r.id === id)) return { ...d, records: d.records.filter((r) => r.id !== id) };
    const index = onboardingMaintenanceIndex(d, id);
    if (index === null || !d.onboarding) return d;
    return { ...d, onboarding: { ...d.onboarding, maintenance: retire(d.onboarding.maintenance, index) } };
  },
  /** Reemplaza la ficha completa (los campos vacíos se quitan). */
  updateCarSheet: <T extends UserData>(d: T, sheet: CarSheet): T => ({
    ...d,
    carSheet: Object.fromEntries(Object.entries(sheet).filter(([, v]) => typeof v === 'string' && v.trim() !== '')),
  }),
  /** Guarda (o quita, con null) el pico y placa configurado. */
  setPicoYPlaca: <T extends UserData>(d: T, config: PicoYPlacaConfig | null): T => {
    const { picoYPlaca: _old, ...rest } = d;
    return (config ? { ...rest, picoYPlaca: config } : rest) as T;
  },
  /** Guarda (o quita, con null) el presupuesto mensual. */
  setBudget: <T extends UserData>(d: T, budget: BudgetConfig | null): T => {
    const { budget: _old, ...rest } = d;
    return (budget ? { ...rest, budget } : rest) as T;
  },
  /**
   * "Borrar mis registros de prueba": quita tanqueos y cargas, gastos, mantenimientos y
   * lecturas de km registrados DESPUÉS del primer ingreso. Se conservan el carro y todo lo
   * del primer ingreso (incluidos sus mantenimientos corregidos, "onb-…"), los documentos y
   * todas las configuraciones.
   */
  clearTestRecords: <T extends UserData>(d: T): T => ({ ...d, records: d.records.filter(keepsOnTestClear) }),
  /** Listas del usuario: se reemplazan completas (vacía → se quita del dato guardado). */
  setRecurringExpenses: <T extends UserData>(d: T, list: RecurringExpense[]): T => setList(d, 'recurringExpenses', list),
  setCustomReminders: <T extends UserData>(d: T, list: CustomReminder[]): T => setList(d, 'customReminders', list),
  setContacts: <T extends UserData>(d: T, list: CarContact[]): T => setList(d, 'contacts', list),
  setIncomes: <T extends UserData>(d: T, list: IncomeRecord[]): T => setList(d, 'incomes', list),
  setMyParts: <T extends UserData>(d: T, list: MyPart[]): T => setList(d, 'myParts', list),
  setFines: <T extends UserData>(d: T, list: FineRecord[]): T => setList(d, 'fines', list),
  saveComponentConfig: <T extends UserData>(d: T, code: ComponentSummary['code'], config: ComponentConfig): T => ({
    ...d,
    componentConfigs: { ...d.componentConfigs, [code]: config },
  }),
};

/** Registros completos a partir de lo que escribe el usuario (id y campos calculados). */
export const recordFrom = {
  /** No se guarda nada calculado de más (los litros de un tanqueo en galones se calculan al leer). */
  energy: (r: NewEnergyRecord): EnergyRecord => ({ ...r, id: newId(r.kind) }) as EnergyRecord,
  odometer: (r: NewOdometerReading): HistoryEntry => ({ ...r, id: newId('km'), kind: 'odometer' }),
  maintenance: (r: NewMaintenance): HistoryEntry => ({ ...r, id: newId('maint'), kind: 'maintenance' }),
  expense: (r: NewExpense): HistoryEntry => ({ ...r, id: newId('expense'), kind: 'expense' }),
  document: (r: NewDocument): HistoryEntry => ({ ...r, id: newId('doc'), kind: 'document' }),
};

/** ¿Se conserva al borrar los registros de prueba? Documentos y lo del primer ingreso. */
function keepsOnTestClear(entry: HistoryEntry): boolean {
  return entry.kind === 'document' || entry.id.startsWith('onb-');
}

export type TestRecordsSummary = { total: number; energy: number; expenses: number; maintenance: number; odometer: number };

/** Cuántos registros borraría "Borrar mis registros de prueba", por tipo. */
export function testRecordsSummary(records: HistoryEntry[]): TestRecordsSummary {
  const summary: TestRecordsSummary = { total: 0, energy: 0, expenses: 0, maintenance: 0, odometer: 0 };
  for (const entry of records) {
    if (keepsOnTestClear(entry)) continue;
    summary.total += 1;
    if (entry.kind === 'expense') summary.expenses += 1;
    else if (entry.kind === 'maintenance') summary.maintenance += 1;
    else if (entry.kind === 'odometer') summary.odometer += 1;
    else summary.energy += 1;
  }
  return summary;
}

function setList<T extends UserData, K extends 'recurringExpenses' | 'customReminders' | 'contacts' | 'incomes' | 'myParts' | 'fines'>(
  d: T,
  key: K,
  list: NonNullable<UserData[K]>,
): T {
  const { [key]: _old, ...rest } = d;
  return (list.length > 0 ? { ...rest, [key]: list } : rest) as T;
}

/** Índice de un mantenimiento del primer ingreso a partir de su id ("onb-m-N"). */
function onboardingMaintenanceIndex(d: UserData, id: string): number | null {
  const match = /^onb-m-(\d+)$/.exec(id);
  if (!match || !d.onboarding) return null;
  const index = Number(match[1]);
  return index < d.onboarding.maintenance.length && !d.onboarding.maintenance[index].removed ? index : null;
}

/** Marca como retirado sin sacarlo de la lista (los demás conservan su posición e id). */
function retire(list: OnboardingMaintenance[], index: number): OnboardingMaintenance[] {
  return list.map((m, i) => (i === index ? { ...m, removed: true } : m));
}

/**
 * ¿Se puede editar o borrar este registro? Los del primer ingreso que son la base
 * (kilometraje inicial, SOAT y Tecnomecánica iniciales) no: el km inicial es la base
 * de los cálculos y los documentos se actualizan registrando uno nuevo.
 */
export function isEditableEntry(id: string): boolean {
  return !id.startsWith('onb-') || id === 'onb-km' || /^onb-m-\d+$/.test(id);
}

/** ¿Se puede borrar? Todo lo editable menos el km inicial (es la base de los cálculos). */
export function isDeletableEntry(id: string): boolean {
  return isEditableEntry(id) && id !== 'onb-km';
}
