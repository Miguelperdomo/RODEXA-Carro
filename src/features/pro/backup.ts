import { MAX_BACKUP_CHARS, packBackup, unpackBackup } from '@/features/data/backupFile';
import { isObject, unwrap } from '@/storage/envelope';
import { USER_MIGRATIONS, USER_SCHEMA_VERSION } from '@/storage/migrations/userData';
import { sanitizeUserData, type StoredUserData } from '@/storage/userDataStore';

/**
 * Copia de seguridad de RODEXA Carro: un JSON con todo lo que el usuario registró
 * (el mismo contenido que se guarda en el teléfono). Sin cuenta, sin correo, sin
 * servidor y sin nube: el usuario decide dónde guardarla.
 *
 * {
 *   "format": "rodexa-carro-backup",
 *   "formatVersion": 1,            ← forma de este archivo
 *   "exportedAt": "2026-10-01T…",
 *   "userData": { "schemaVersion": 4, "data": { … } }   ← versión de los datos
 * }
 *
 * Compatibilidad futura: una copia con datos de una versión ANTERIOR se migra igual
 * que al abrir la app; una de una versión MÁS NUEVA se rechaza (no se sabe leerla).
 */
export const BACKUP_FORMAT = 'rodexa-carro-backup';
export const BACKUP_FORMAT_VERSION = 1;

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  exportedAt: string;
  userData: { schemaVersion: number; data: StoredUserData };
};

export function createBackup(data: StoredUserData, now: Date): string {
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    userData: { schemaVersion: USER_SCHEMA_VERSION, data },
  };
  return JSON.stringify(file);
}

/** Contenido del archivo .rodexa (la misma copia, empaquetada y con sello). */
export function backupFileContent(data: StoredUserData, now: Date): string {
  return packBackup(createBackup(data, now));
}

export type BackupSummary = {
  carName: string;
  /** Registros del historial (tanqueos, mantenimientos, gastos, documentos…). */
  records: number;
  exportedAt?: string;
  /** Registros que la app no reconoció: se conservan aparte, sin borrarse. */
  unrecognized: number;
};

export type BackupError =
  | 'empty'
  | 'invalid-json'
  | 'not-rodexa'
  | 'newer-format'
  | 'newer-data'
  | 'corrupt'
  | 'no-car'
  | 'damaged'
  | 'moto-copy'
  | 'too-big'
  | 'unreadable';

export const BACKUP_ERROR_MESSAGES: Record<BackupError, string> = {
  empty: 'No hay ningún texto para importar. Copia primero el contenido de tu copia de RODEXA.',
  'invalid-json': 'El archivo está dañado o incompleto: no es un JSON válido.',
  'not-rodexa': 'Este contenido no es una copia de RODEXA Carro.',
  'newer-format': 'Esta copia es de una versión más nueva de RODEXA Carro. Actualiza la app para importarla.',
  'newer-data': 'Esta copia tiene datos de una versión más nueva de RODEXA Carro. Actualiza la app para importarla.',
  corrupt: 'La copia está dañada: sus datos no tienen la forma esperada.',
  'no-car': 'La copia no tiene ningún carro registrado.',
  damaged: 'El archivo de copia está dañado o fue modificado. Usa otra copia o guárdala de nuevo desde tu otro celular.',
  'moto-copy': 'Esta es una copia de RODEXA Moto. Ábrela en la app RODEXA Moto; aquí solo se recuperan copias de RODEXA Carro.',
  'too-big': 'Este archivo es demasiado grande para ser una copia de RODEXA Carro.',
  unreadable: 'No se pudo leer el archivo. Intenta guardarlo en Descargas y elegirlo desde ahí.',
};

export type ParseBackupResult =
  | { ok: true; data: StoredUserData; summary: BackupSummary; warnings: string[] }
  | { ok: false; error: BackupError; message: string };

const fail = (error: BackupError): ParseBackupResult => ({ ok: false, error, message: BACKUP_ERROR_MESSAGES[error] });

/** Mensaje de un error de copia (también los de leer el archivo). */
export const backupFailure = (error: BackupError): ParseBackupResult => fail(error);

/**
 * Valida una copia antes de importarla: el archivo .rodexa (empaquetado y con sello) o una
 * copia vieja en texto (JSON). Nunca lanza errores ni modifica nada.
 */
export function parseBackup(text: string): ParseBackupResult {
  if (text.trim() === '') return fail('empty');
  // Un archivo enorme no es una copia (una normal pesa unos pocos KB).
  if (text.length > MAX_BACKUP_CHARS) return fail('too-big');
  if (text.trim().startsWith('RODEXA-MOTO-COPIA')) return fail('moto-copy');
  const trimmed = unpackBackup(text);
  if (trimmed === undefined) return fail('damaged');

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return fail('invalid-json');
  }
  if (!isObject(parsed) || parsed.format !== BACKUP_FORMAT) return fail('not-rodexa');
  if (typeof parsed.formatVersion !== 'number' || !Number.isInteger(parsed.formatVersion)) return fail('corrupt');
  if (parsed.formatVersion > BACKUP_FORMAT_VERSION) return fail('newer-format');

  const userData = parsed.userData;
  if (!isObject(userData) || typeof userData.schemaVersion !== 'number' || !('data' in userData)) return fail('corrupt');

  // Mismo sobre y mismas migraciones que el almacenamiento del teléfono.
  const unwrapped = unwrap(JSON.stringify({ schemaVersion: userData.schemaVersion, savedAt: '', data: userData.data }), {
    version: USER_SCHEMA_VERSION,
    migrations: USER_MIGRATIONS,
  });
  if (!unwrapped.ok) return fail(unwrapped.reason === 'newer-version' ? 'newer-data' : 'corrupt');
  if (!isObject(unwrapped.data)) return fail('corrupt');

  const { data, problems } = sanitizeUserData(unwrapped.data);
  if (data.onboarding === null) return fail(problems.includes('primer ingreso inválido') ? 'corrupt' : 'no-car');

  const profile = { ...data.onboarding.profile, ...data.profileEdits };
  return {
    ok: true,
    data,
    summary: {
      carName: [profile.brandName, profile.model, profile.year].filter(Boolean).join(' ') || 'Tu carro',
      records: data.records.length,
      exportedAt: isValidTimestamp(parsed.exportedAt) ? parsed.exportedAt : undefined,
      unrecognized: data.unrecognizedRecords.length,
    },
    warnings: problems,
  };
}

const isValidTimestamp = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));

