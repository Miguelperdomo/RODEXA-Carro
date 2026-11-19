import type { ComponentCode } from '@/features/maintenance/catalog';
import type { ComponentInterval } from '@/features/maintenance/intervals';
import type { StatusLevel } from '@/shared/theme';
import type { IconName } from '@/shared/ui';

/** Uso principal del carro (`usage_type`). Aún no cambia cálculos ni recomendaciones. */
export type UsageType = 'personal' | 'work' | 'delivery' | 'apps' | 'travel' | 'mixed';

/**
 * Propiedades del vehículo. "unknown" = el usuario eligió "No sé" (o el dato viene
 * de una versión anterior): nunca se reemplaza por un valor supuesto.
 *
 * Fuente de energía (no solo "combustible"): un eléctrico usa kWh, el GNC m³ y un
 * híbrido enchufable (phev_*) usa combustible Y electricidad de la red. Un híbrido
 * no enchufable (hybrid_*) solo carga combustible.
 */
export type EnergySource =
  | 'gasoline'
  | 'diesel'
  | 'cng'
  /** GNC + gasolina (dual): solo cuando el usuario lo confirma; un "GNC" no se asume dual. */
  | 'cng_gasoline'
  | 'electric'
  | 'hybrid_gasoline'
  | 'hybrid_diesel'
  | 'phev_gasoline'
  | 'phev_diesel'
  | 'other'
  | 'unknown';
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'dct' | 'other' | 'unknown';
export type DrivetrainType = '4x2' | '4x4' | 'awd' | 'other' | 'unknown';
export type TimingSystem = 'belt' | 'chain' | 'other' | 'unknown';
export type BodyType = 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'camioneta' | 'van' | 'other';

/**
 * Datos básicos del carro (tabla `cars`). Opcionales = pueden estar "Sin registrar";
 * sin dato se trata igual que "unknown" (ver capabilities.ts).
 */
export type CarProfile = {
  id: string;
  /** Id de la marca en el catálogo ("other" si no está). */
  brandCode: string;
  brandName: string;
  /** Id del modelo en el catálogo ("other" o vacío si no está). */
  modelId?: string;
  model: string;
  /** Versión o línea tal como la conoce el usuario ("LTZ", "1.6 AT"…). Texto libre. */
  variantName?: string;
  usageType?: UsageType;
  year?: number;
  bodyType?: BodyType;
  energySource?: EnergySource;
  /** Solo cuando el vehículo tiene motor de combustión. */
  displacementCc?: number;
  transmission?: TransmissionType;
  drivetrain?: DrivetrainType;
  timingSystem?: TimingSystem;
  /** Capacidad del tanque en litros, si el usuario la conoce (manual del vehículo). */
  tankCapacityLiters?: number;
  /** Capacidad de la batería de tracción en kWh (eléctricos y enchufables), si el usuario la conoce. */
  batteryCapacityKwh?: number;
  plate?: string;
  /** Ciudad donde está matriculada la placa (código DANE). Sin ella se usa la del perfil. */
  plateCityId?: string;
  /** Servicio del carro: define el color de la placa (sin dato = particular). */
  serviceType?: 'private' | 'public';
  /** Apodo que le pone el usuario ("La Negra"). Solo para mostrar. */
  nickname?: string;
  /**
   * @deprecated Heredado de la pregunta del radiador (ya no se hace). Se conserva
   * para no perder lo que el usuario respondió; capabilities.ts respeta un "no".
   */
  coolingApplies?: boolean;
  /** @deprecated Ver `coolingApplies`. */
  coolingSource?: 'catalog' | 'user';
};

export type OdometerSummary = {
  registeredKm: number;
  /** Fecha ISO (AAAA-MM-DD) de la última lectura. */
  lastReadingDate: string;
  daysSinceReading: number;
  /** El estimado nunca reemplaza al registrado ni cambia estados. */
  estimate: { kind: 'available'; km: number; kmPerDay: number } | { kind: 'insufficient' };
};

export type { ComponentCode };

/** Un componente controlado (tabla `service_plans` + último mantenimiento), ya calculado. */
export type ComponentSummary = {
  code: ComponentCode;
  title: string;
  icon: IconName;
  /** false = el usuario aún no lo activó (componentes opcionales). */
  enabled: boolean;
  status: StatusLevel;
  detail: string;
  /** `setAt`: cuándo lo indicó el usuario al configurar (si vino de la configuración). */
  lastService?: { km?: number; date?: string; setAt?: string };
  /** Del usuario o del fabricante con fuente. Sin intervalo = no se inventa ninguno. */
  interval?: ComponentInterval;
  /** "maybe" = depende del carro: se muestra, pero no como fijo ni obligatorio. */
  applicability: 'applies' | 'maybe';
  nextDueKm?: number;
  warnMarginKm?: number;
};

/** `license` = licencia de conducción (del conductor; la fecha la registra el usuario). */
/**
 * Documentos que RODEXA ayuda a organizar (ver features/documents/catalog.ts).
 * `transit_license` = licencia de tránsito / tarjeta de propiedad (no vence).
 * `license` = licencia de conducción (es del conductor, no del carro).
 */
export type DocumentType = 'soat' | 'rtm' | 'policy' | 'tax' | 'transit_license' | 'license' | 'other';

/** Estado actual de un documento, calculado a partir de lo que registró el usuario. */
export type DocumentSummary = {
  /** Identifica el documento: su tipo, o "other:<serie>" para cada "Otro". */
  key: string;
  type: DocumentType;
  title: string;
  status: StatusLevel;
  detail: string;
  /** Fecha que dispara los avisos: vencimiento, o fecha límite de pago (impuesto). */
  alertDate?: string;
  expiresAt?: string;
  issuer?: string;
  number?: string;
  notApplicable?: boolean;
  exempt?: boolean;
  /** Impuesto: año del registro vigente (para los textos). */
  taxYear?: number;
  /** Registro más reciente (el que manda) y cuántos hay en total (renovaciones). */
  latestRecordId?: string;
  records: number;
};
