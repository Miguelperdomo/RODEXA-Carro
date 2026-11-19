import { isObject, type Migrations } from '../envelope';

/**
 * Versión actual de los datos del usuario (`rodexa:user`).
 * - 1: primera versión.
 * - 2: el perfil del carro tiene `energySource`. Lo que venía de la versión 1 queda
 *   "unknown" (Sin confirmar): nunca se asume gasolina. La app lo pide en Mi carro.
 * - 3: los tanqueos pasan al modelo de energía (cantidad + unidad + costo + precio
 *   unitario). Se AGREGAN los campos nuevos a partir de lo que escribió el usuario
 *   (valor pagado y precio del galón) y se CONSERVAN los originales tal cual.
 * - 4: documentos organizados por catálogo. Un impuesto guardado con "vencimiento" pasa
 *   a tener esa fecha como FECHA LÍMITE (se conserva la original; el año no se deduce).
 *   Cada "Otro" recibe su serie (para agrupar renovaciones) y "tiene vencimiento" si
 *   tenía fecha. Todo lo demás (SOAT, RTM, licencia, gastos manuales) no cambia.
 */
export const USER_SCHEMA_VERSION = 4;

/** Agrega `energySource: "unknown"` a un perfil que no lo tiene. No toca nada más. */
function withEnergySource(profile: unknown): unknown {
  if (!isObject(profile) || 'energySource' in profile) return profile;
  return { ...profile, energySource: 'unknown' };
}

/** Aplica el cambio al perfil de un primer ingreso (guardado o en borrador), si existe. */
function migrateOnboarding(onboarding: unknown): unknown {
  if (!isObject(onboarding)) return onboarding;
  return { ...onboarding, profile: withEnergySource(onboarding.profile) };
}

export function migrateUserDataV1toV2(data: unknown): unknown {
  // Datos con otra forma: se devuelven igual y la lectura tolerante decide qué conservar.
  if (!isObject(data)) return data;
  return {
    ...data,
    onboarding: migrateOnboarding(data.onboarding),
    draft: migrateOnboarding(data.draft),
    // `profileEdits` no se toca: agregarle "unknown" pisaría un valor que el usuario ya eligió.
  };
}

const isPositiveNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Tanqueo v2 → v3. El usuario había escrito valor pagado + precio del galón, así que
 * la cantidad original es en GALONES (= valor ÷ precio): se guarda así, sin redondear.
 * Si faltara el precio, se usan los litros que ya estaban calculados. Nada se borra.
 */
export function migrateFuelRecordV2toV3(record: unknown): unknown {
  if (!isObject(record) || record.kind !== 'fuel' || 'quantity' in record) return record;
  const { amountCop, pricePerGallonCop, litersCalculated } = record;
  const byGallon = isPositiveNumber(pricePerGallonCop) && isNumber(amountCop) && amountCop >= 0;
  const quantity = byGallon ? amountCop / pricePerGallonCop : isPositiveNumber(litersCalculated) ? litersCalculated : undefined;
  // Sin forma de saber la cantidad: se deja igual (la lectura tolerante lo conserva aparte).
  if (quantity === undefined || !(quantity > 0)) return record;
  return {
    ...record,
    quantity,
    unit: byGallon ? 'gal' : 'L',
    ...(isNumber(amountCop) && amountCop >= 0 ? { costCop: amountCop } : {}),
    ...(byGallon ? { unitPriceCop: pricePerGallonCop } : {}),
  };
}

export function migrateUserDataV2toV3(data: unknown): unknown {
  if (!isObject(data) || !Array.isArray(data.records)) return data;
  return { ...data, records: data.records.map(migrateFuelRecordV2toV3) };
}

/** Documento v3 → v4 (solo impuesto y "Otro"; agrega campos, nunca borra). */
export function migrateDocumentRecordV3toV4(record: unknown): unknown {
  if (!isObject(record) || record.kind !== 'document') return record;
  if (record.docType === 'tax' && typeof record.expiresAt === 'string' && !('dueDate' in record)) {
    return { ...record, dueDate: record.expiresAt };
  }
  if (record.docType === 'other' && !('seriesId' in record) && typeof record.id === 'string') {
    return { ...record, seriesId: record.id, hasExpiry: typeof record.expiresAt === 'string' };
  }
  return record;
}

export function migrateUserDataV3toV4(data: unknown): unknown {
  if (!isObject(data) || !Array.isArray(data.records)) return data;
  return { ...data, records: data.records.map(migrateDocumentRecordV3toV4) };
}

export const USER_MIGRATIONS: Migrations = {
  1: migrateUserDataV1toV2,
  2: migrateUserDataV2toV3,
  3: migrateUserDataV3toV4,
};
