import type { ExpenseCategoryCode } from '@/features/expenses/catalog';
import type { MaintenanceItemCode } from '@/features/maintenance/catalog';
import type { DocumentType } from '@/features/cars/types';
import type { RecordKm } from '@/features/odometer/recordKm';

/** Un evento del historial. `date` en formato ISO (AAAA-MM-DD). */
export type HistoryEntry =
  | { id: string; kind: 'odometer'; date: string; km: number }
  | {
      id: string;
      kind: 'maintenance';
      date: string;
      /** null = el usuario no sabía el km (ver RecordKm). */
      km: RecordKm;
      types: MaintenanceItemCode[];
      costCop?: number;
      note?: string;
    }
  | {
      id: string;
      kind: 'expense';
      date: string;
      category: ExpenseCategoryCode;
      amountCop: number;
      note?: string;
      /** Pago de un gasto que se repite (Mi carro → Gastos que se repiten). */
      recurringId?: string;
    }
  | DocumentRecord
  | EnergyRecord;

/**
 * Registros de energía / abastecimiento: uno por tipo, cada uno con SU unidad.
 * `quantity` está en la unidad del tipo (L o galón · m³ · kWh) tal como la registró
 * el usuario; nunca se mezclan. Costo y precio unitario son opcionales: si el
 * usuario no los sabe, no se inventan (features/energy).
 */
type EnergyRecordBase = {
  id: string;
  date: string;
  /** Kilometraje del tablero. null = desconocido ("No sé el kilometraje"). */
  km: RecordKm;
  /** Costo total pagado. Sin dato = desconocido (0 = fue gratis). */
  costCop?: number;
  /** Precio por unidad (por L o galón, por m³, por kWh). */
  unitPriceCop?: number;
  note?: string;
};

export type FuelUnit = 'L' | 'gal';

/** Tanqueo de combustible líquido (gasolina / diésel). */
export type FuelRecord = EnergyRecordBase & {
  kind: 'fuel';
  quantity: number;
  unit: FuelUnit;
  /** Clave para calcular consumo: solo entre tanques llenos. */
  fullTank: boolean;
  station?: string;
};

/** Carga de gas natural vehicular, en m³. */
export type CngRecord = EnergyRecordBase & {
  kind: 'cng';
  quantity: number;
  /** Carga completa: igual que "tanque lleno", permite comparar dos cargas. */
  fullFill: boolean;
  station?: string;
};

export type ChargeType = 'ac' | 'dc' | 'other';

/** Carga eléctrica desde la red, en kWh (lo que marca el cargador o su app). */
export type ChargeRecord = EnergyRecordBase & {
  kind: 'charge';
  quantity: number;
  /** % de batería al empezar y al terminar la carga (0–100), si el usuario los anota. */
  startPercent?: number;
  endPercent?: number;
  location?: string;
  chargeType?: ChargeType;
};

export type EnergyRecord = FuelRecord | CngRecord | ChargeRecord;
export type EnergyKind = EnergyRecord['kind'];

/**
 * Un documento registrado (o su renovación). Todas las fechas las escribe el
 * usuario; RODEXA no calcula vencimientos ni valores. El valor pagado ES el gasto:
 * no se crea otro registro de gasto (ver entryCost).
 */
export type DocumentRecord = {
  id: string;
  kind: 'document';
  /** Fecha en que se registró. */
  date: string;
  docType: DocumentType;
  /** Sin fecha cuando el usuario marcó "No aplica aún" o el documento no vence. */
  expiresAt?: string;
  notApplicable?: boolean;
  issuedAt?: string;
  /** Nombre si docType es "other". */
  name?: string;
  number?: string;
  issuer?: string;
  note?: string;
  /** Agrupa las renovaciones de un mismo "Otro" (hay varios a la vez). */
  seriesId?: string;
  /** Solo "Otro": ¿tiene fecha de vencimiento? */
  hasExpiry?: boolean;
  /** Valor pagado (cuenta como gasto del carro) y cuándo se pagó. */
  costCop?: number;
  paidAt?: string;
  /** Impuesto: año gravable, departamento, fecha límite de pago, referencia y exención. */
  taxYear?: number;
  department?: string;
  dueDate?: string;
  reference?: string;
  exempt?: boolean;
  /** Póliza: qué cubre (texto del usuario). */
  coverage?: string;
  /** Licencia de conducción: categoría en texto libre. */
  licenseCategory?: string;
};

export type HistoryKind = HistoryEntry['kind'];
