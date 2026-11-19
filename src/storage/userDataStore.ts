import type { HistoryEntry } from '@/features/history/types';
import { sanitizeBudget } from '@/features/budget/rules';
import { sanitizeContacts } from '@/features/contacts/rules';
import { sanitizeOnboardingCredit } from '@/features/credit/credit';
import { sanitizeIncomes } from '@/features/income/income';
import { sanitizeParts } from '@/features/parts/myParts';
import { sanitizeFines } from '@/features/law/fines';
import { sanitizeCustomReminders } from '@/features/customReminders/rules';
import { sanitizeRecurring } from '@/features/recurring/rules';
import { sanitizePicoYPlaca } from '@/features/picoYPlaca/rules';
import { EMPTY_USER_DATA, type CarSheet, type OnboardingData, type UserData } from '@/features/session/types';

import { isObject, unwrap, wrap } from './envelope';
import { keyValueStore, STORAGE_KEYS } from './keyValueStore';
import { cleanComponentConfigs, cleanProfile, cleanUserEdits } from './sanitizeEdits';
import { clearTravelProgress } from './travelProgressStore';
import { USER_MIGRATIONS, USER_SCHEMA_VERSION } from './migrations/userData';
import { createWriteQueue } from './writeQueue';

const USER_SCHEMA = { version: USER_SCHEMA_VERSION, migrations: USER_MIGRATIONS };

/**
 * Datos del usuario en el teléfono (carro, primer ingreso, registros, configuración
 * de componentes). Lectura tolerante: lo que no se reconoce NO se borra; se guarda
 * aparte (`unrecognizedRecords`) y se vuelve a escribir tal cual.
 */
export type StoredUserData = UserData & { unrecognizedRecords: unknown[] };

export const EMPTY_STORED_USER_DATA: StoredUserData = { ...EMPTY_USER_DATA, unrecognizedRecords: [] };

const queue = createWriteQueue((value) => keyValueStore.set(STORAGE_KEYS.user, value));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && ISO_DATE.test(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/** Km de un registro: número o null EXPLÍCITO (desconocido). `undefined` no es válido. */
const isRecordKm = (v: unknown) => v === null || isNum(v);
const optional = (v: unknown, check: (x: unknown) => boolean) => v === undefined || check(v);
const isString = (v: unknown): v is string => typeof v === 'string';

const isPercent = (v: unknown) => isNum(v) && v >= 0 && v <= 100;
const isNonNegative = (v: unknown) => isNum(v) && v >= 0;

/** Campos comunes de un registro de energía: km, cantidad > 0, costo y precio opcionales ≥ 0. */
function isEnergyBase(value: Record<string, unknown>): boolean {
  return (
    isRecordKm(value.km) &&
    isNum(value.quantity) &&
    value.quantity > 0 &&
    optional(value.costCop, isNonNegative) &&
    optional(value.unitPriceCop, isNonNegative) &&
    optional(value.note, isString)
  );
}

/** ¿El registro tiene la forma esperada? Si no, se conserva aparte (nunca se "arregla" inventando). */
export function isValidEntry(value: unknown): value is HistoryEntry {
  if (!isObject(value) || !isString(value.id) || !isIsoDate(value.date)) return false;
  switch (value.kind) {
    case 'odometer':
      return isNum(value.km) && value.km >= 0;
    case 'maintenance':
      return (
        isRecordKm(value.km) &&
        Array.isArray(value.types) &&
        value.types.length > 0 &&
        value.types.every(isString) &&
        optional(value.costCop, isNonNegative) &&
        optional(value.note, isString)
      );
    case 'expense':
      return (
        isString(value.category) &&
        isNonNegative(value.amountCop) &&
        optional(value.note, isString) &&
        optional(value.recurringId, isString)
      );
    case 'document':
      return (
        isString(value.docType) &&
        optional(value.expiresAt, isIsoDate) &&
        optional(value.issuedAt, isIsoDate) &&
        optional(value.dueDate, isIsoDate) &&
        optional(value.paidAt, isIsoDate) &&
        optional(value.costCop, isNonNegative) &&
        optional(value.taxYear, isNum)
      );
    case 'fuel':
      return (
        isEnergyBase(value) &&
        (value.unit === 'L' || value.unit === 'gal') &&
        typeof value.fullTank === 'boolean' &&
        optional(value.station, isString)
      );
    case 'cng':
      return isEnergyBase(value) && typeof value.fullFill === 'boolean' && optional(value.station, isString);
    case 'charge':
      return (
        isEnergyBase(value) &&
        optional(value.startPercent, isPercent) &&
        optional(value.endPercent, isPercent) &&
        optional(value.location, isString) &&
        optional(value.chargeType, (v) => v === 'ac' || v === 'dc' || v === 'other')
      );
    default:
      return false;
  }
}

/** El crédito del primer ingreso, limpio (inválido → se quita). */
function withCleanCredit(data: OnboardingData): OnboardingData {
  const { credit, ...rest } = data;
  const clean = sanitizeOnboardingCredit(credit);
  return clean ? { ...rest, credit: clean } : rest;
}

function isValidOnboarding(value: unknown): value is OnboardingData {
  if (!isObject(value)) return false;
  const { user, profile, km, maintenance, documents, completedAt } = value;
  return (
    isObject(user) &&
    isString(user.name) &&
    isObject(profile) &&
    isString(profile.brandName) &&
    isString(profile.model) &&
    isNum(km) &&
    Array.isArray(maintenance) &&
    maintenance.every((m) => isObject(m) && isString(m.code) && isIsoDate(m.date) && isRecordKm(m.km)) &&
    isObject(documents) &&
    isIsoDate(completedAt)
  );
}

export type LoadResult = { data: StoredUserData; problems: string[] };

/** Convierte lo leído en datos válidos, sin perder lo que no se entiende. */
export function sanitizeUserData(raw: unknown): LoadResult {
  const problems: string[] = [];
  if (!isObject(raw)) return { data: EMPTY_STORED_USER_DATA, problems: ['estructura inválida'] };

  const onboarding = raw.onboarding === null || raw.onboarding === undefined ? null : raw.onboarding;
  if (onboarding !== null && !isValidOnboarding(onboarding)) problems.push('primer ingreso inválido');
  const draft = raw.draft === null || raw.draft === undefined ? null : raw.draft;

  const rawRecords = Array.isArray(raw.records) ? raw.records : [];
  if (raw.records !== undefined && !Array.isArray(raw.records)) problems.push('registros inválidos');
  const records = rawRecords.filter(isValidEntry);
  const unrecognized = [
    ...(Array.isArray(raw.unrecognizedRecords) ? raw.unrecognizedRecords : []),
    ...rawRecords.filter((r) => !isValidEntry(r)),
  ];
  const picoYPlaca = sanitizePicoYPlaca(raw.picoYPlaca);
  if (raw.picoYPlaca !== undefined && !picoYPlaca) problems.push('pico y placa inválido');
  const budget = sanitizeBudget(raw.budget);
  if (raw.budget !== undefined && !budget) problems.push('presupuesto inválido');
  // Listas del usuario: los elementos dañados se descartan (los demás se conservan).
  const recurringExpenses = sanitizeRecurring(raw.recurringExpenses);
  const customReminders = sanitizeCustomReminders(raw.customReminders);
  const contacts = sanitizeContacts(raw.contacts);
  const incomes = sanitizeIncomes(raw.incomes);
  const myParts = sanitizeParts(raw.myParts);
  const fines = sanitizeFines(raw.fines);
  for (const [name, value, clean] of [
    ['gastos que se repiten', raw.recurringExpenses, recurringExpenses],
    ['recordatorios', raw.customReminders, customReminders],
    ['contactos', raw.contacts, contacts],
    ['ingresos', raw.incomes, incomes],
    ['repuestos', raw.myParts, myParts],
    ['comparendos', raw.fines, fines],
  ] as const) {
    if (value === undefined) continue;
    const dropped = Array.isArray(value) ? value.length - (clean?.length ?? 0) : 1;
    if (dropped > 0) problems.push(`${dropped} ${name} inválido(s)`);
  }
  // Configuración y ediciones: los campos con un tipo inválido se descartan y se informa.
  const componentConfigs = cleanComponentConfigs(raw.componentConfigs);
  const userEdits = cleanUserEdits(raw.userEdits);
  const profileEdits = cleanProfile(raw.profileEdits);
  const validOnboarding = onboarding !== null && isValidOnboarding(onboarding) ? onboarding : null;
  const onboardingProfile = validOnboarding ? cleanProfile(validOnboarding.profile) : undefined;
  const droppedFields =
    componentConfigs.dropped + userEdits.dropped + profileEdits.dropped + (onboardingProfile?.dropped ?? 0);
  if (droppedFields > 0) problems.push(`${droppedFields} dato(s) de configuración inválido(s)`);
  if (rawRecords.length !== records.length) problems.push(`${rawRecords.length - records.length} registro(s) no reconocido(s)`);

  return {
    data: {
      onboarding:
        validOnboarding && onboardingProfile
          ? { ...validOnboarding, profile: onboardingProfile.value as OnboardingData['profile'] }
          : null,
      // El crédito del borrador solo si es válido (si no, se quita sin perder el resto).
      draft: draft !== null && isValidOnboarding(draft) ? withCleanCredit(draft) : null,
      userEdits: userEdits.value,
      profileEdits: profileEdits.value,
      records,
      componentConfigs: componentConfigs.value as StoredUserData['componentConfigs'],
      // Ficha de mi carro: solo textos (lo demás se ignora).
      carSheet: isObject(raw.carSheet)
        ? (Object.fromEntries(Object.entries(raw.carSheet).filter((entry) => typeof entry[1] === 'string')) as CarSheet)
        : {},
      unrecognizedRecords: unrecognized,
      // Pico y placa: solo si tiene la forma esperada (si no, se ignora sin borrar nada más).
      ...(picoYPlaca ? { picoYPlaca } : {}),
      // Presupuesto mensual: igual, solo si es válido.
      ...(budget ? { budget } : {}),
      ...(recurringExpenses?.length ? { recurringExpenses } : {}),
      ...(customReminders?.length ? { customReminders } : {}),
      ...(contacts?.length ? { contacts } : {}),
      ...(incomes?.length ? { incomes } : {}),
      ...(myParts?.length ? { myParts } : {}),
      ...(fines?.length ? { fines } : {}),
    },
    problems,
  };
}

/**
 * Por qué no se pudieron cargar los datos. En estos casos la app NO arranca vacía (eso
 * sobrescribiría lo guardado en el primer cambio): se muestra un aviso y no se escribe nada.
 * - read-error: el teléfono no dejó leer el almacenamiento (tras varios intentos).
 * - newer-version: los datos son de una versión más nueva de la app.
 * - backup-failed: había datos con problemas y no se pudo guardar su copia antes de seguir.
 */
export type UserDataReadFailure = 'read-error' | 'newer-version' | 'backup-failed';

export class UserDataReadError extends Error {
  constructor(public readonly reason: UserDataReadFailure) {
    super(`No se pudieron cargar los datos (${reason}).`);
    this.name = 'UserDataReadError';
  }
}

/** Esperas entre intentos de lectura (un fallo puede ser momentáneo). */
const READ_RETRY_DELAYS_MS = [200, 600];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lee el valor guardado; reintenta antes de rendirse. Lanza `UserDataReadError('read-error')`. */
async function readRaw(): Promise<string | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await keyValueStore.get(STORAGE_KEYS.user);
    } catch (error) {
      if (attempt >= READ_RETRY_DELAYS_MS.length) {
        console.warn('[RODEXA] No se pudo leer el almacenamiento.', error);
        throw new UserDataReadError('read-error');
      }
      await wait(READ_RETRY_DELAYS_MS[attempt]);
    }
  }
}

/**
 * Lee los datos al abrir la app. Si algo no se pudo leer, primero guarda una COPIA
 * INTACTA del valor original; si no puede leerlo o protegerlo, lanza `UserDataReadError`
 * y la app no continúa (así ninguna escritura destruye información del usuario).
 */
export async function loadUserData(): Promise<StoredUserData> {
  const raw = await readRaw();
  if (raw === null) return EMPTY_STORED_USER_DATA;

  const unwrapped = unwrap(raw, USER_SCHEMA);
  if (!unwrapped.ok) {
    const saved = await backupRaw(raw, unwrapped.reason);
    // Datos de una versión más nueva: no se sabe leerlos y no se tocan.
    if (unwrapped.reason === 'newer-version') throw new UserDataReadError('newer-version');
    if (!saved) throw new UserDataReadError('backup-failed');
    return EMPTY_STORED_USER_DATA;
  }
  const { data, problems } = sanitizeUserData(unwrapped.data);
  if (problems.length > 0 && !(await backupRaw(raw, problems.join(', ')))) {
    throw new UserDataReadError('backup-failed');
  }
  return data;
}

/** Copia intacta del valor original. `true` = quedó guardada. */
async function backupRaw(raw: string, reason: string): Promise<boolean> {
  console.warn(`[RODEXA] Datos guardados con problemas (${reason}). Se conserva una copia intacta.`);
  try {
    // Si la copia más reciente ya es idéntica, no se crea otra (antes, una por cada apertura).
    const prefix = `${STORAGE_KEYS.user}:backup:`;
    const latest = (await keyValueStore.keys()).filter((k) => k.startsWith(prefix)).sort().at(-1);
    if (latest && (await keyValueStore.get(latest)) === raw) return true;
    await keyValueStore.set(STORAGE_KEYS.backup(STORAGE_KEYS.user), raw);
    return true;
  } catch (error) {
    console.warn('[RODEXA] No se pudo guardar la copia de seguridad local.', error);
    return false;
  }
}

/**
 * Copia interna de los datos tal como están, antes de un borrado que pidió el usuario
 * (p. ej. "Borrar mis registros de prueba"). Se guarda junto a las demás copias locales.
 */
export async function backupUserData(data: StoredUserData): Promise<boolean> {
  try {
    await queue.flush();
    await keyValueStore.set(STORAGE_KEYS.backup(STORAGE_KEYS.user), wrap(data, USER_SCHEMA_VERSION));
    return true;
  } catch (error) {
    console.warn('[RODEXA] No se pudo guardar la copia antes de borrar.', error);
    return false;
  }
}

/** Guarda el estado completo (cola: siempre el más reciente, en orden). `true` = quedó en el teléfono. */
export function saveUserData(data: StoredUserData): Promise<boolean> {
  return queue.enqueue(wrap(data, USER_SCHEMA_VERSION));
}

/**
 * "Eliminar todos los datos": espera lo pendiente y borra los datos del carro, TODAS sus
 * copias de seguridad locales (`rodexa:user:backup:*`) y el progreso de "Voy a viajar".
 * Las preferencias de la app se conservan (así lo dice el aviso).
 */
export async function clearUserData(): Promise<void> {
  await queue.flush();
  await keyValueStore.remove(STORAGE_KEYS.user);
  const prefix = `${STORAGE_KEYS.user}:backup:`;
  const backups = (await keyValueStore.keys()).filter((key) => key.startsWith(prefix));
  if (backups.length > 0) await keyValueStore.removeMany(backups);
  await clearTravelProgress();
}

export const flushUserData = () => queue.flush();
