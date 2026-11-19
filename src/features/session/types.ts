import type { DashboardData } from '@/features/dashboard/types';
import type { HistoryEntry } from '@/features/history/types';
import type { MaintenanceItemCode } from '@/features/maintenance/catalog';
import type { BudgetConfig } from '@/features/budget/rules';
import type { CarContact } from '@/features/contacts/rules';
import type { CustomReminder } from '@/features/customReminders/rules';
import type { IncomeRecord } from '@/features/income/income';
import type { MyPart } from '@/features/parts/myParts';
import type { FineRecord } from '@/features/law/fines';
import type { RecurringExpense } from '@/features/recurring/rules';
import type { PicoYPlacaConfig } from '@/features/picoYPlaca/rules';
import type {
  ComponentSummary,
  DocumentSummary,
  CarProfile,
  OdometerSummary,
} from '@/features/cars/types';

/** Un mantenimiento reciente registrado en el primer ingreso. Fechas ISO. */
export type OnboardingMaintenance = {
  code: MaintenanceItemCode;
  date: string;
  km: number | null;
  costCop: number | null;
  /** Solo para "Otro". */
  description?: string;
  /**
   * Retirado (se editó o se borró). Se deja en su lugar para que las posiciones, y con
   * ellas los ids "onb-m-N" de los demás, nunca cambien.
   */
  removed?: true;
};

/** Todo lo que se pregunta en el primer ingreso. */
export type OnboardingData = {
  /** `cityId` del catálogo de ciudades; `city` es su nombre para mostrar. */
  user: { name: string; cityId?: string; city: string };
  profile: CarProfile;
  km: number;
  maintenance: OnboardingMaintenance[];
  documents: { soatExpiresAt?: string; rtmExpiresAt?: string };
  completedAt: string;
  /** "¿Tu carro está a crédito?" (opcional). Al terminar el registro se vuelve el crédito del carro. */
  credit?: OnboardingCredit;
};

export type OnboardingCredit = {
  amountCop: number;
  totalInstallments: number;
  paidBefore: number;
  dayOfMonth: number;
  /** Solo si el día de pago de este mes ya pasó: ¿ya la pagó? */
  paidThisMonth: boolean | null;
};

export type UserProfile = {
  name?: string;
  cityId?: string;
  city?: string;
};

/** Los datos que leen las pantallas: del primer ingreso o, si no hay, los mock. */
export type AppData = {
  /** Perfil del usuario (sin cuenta real todavía). Ciudad desde el catálogo. */
  user: UserProfile;
  profile: CarProfile;
  odometer: OdometerSummary;
  components: ComponentSummary[];
  documents: DocumentSummary[];
  history: HistoryEntry[];
  dashboard: DashboardData;
};

/**
 * Configuración de un componente hecha por el usuario ("Configurar aceite"…).
 * `lastService.setAt` = cuándo lo indicó, para compararlo con el historial.
 */
export type ComponentConfig = {
  enabled: boolean;
  interval?: { km?: number; months?: number };
  lastService?: { km?: number; date?: string; setAt: string };
};

/**
 * Ficha de mi carro: datos que el usuario anota con sus palabras (texto libre).
 * RODEXA no los valida ni los completa.
 */
export type CarSheet = {
  oil?: string;
  tireFront?: string;
  tireRear?: string;
  tirePressure?: string;
  battery?: string;
  sparkPlug?: string;
  chassisNumber?: string;
  engineNumber?: string;
  policy?: string;
  notes?: string;
  /**
   * "Lo que usa mi carro" en Repuestos: un dato por campo del repuesto, por ejemplo
   * `part:oil:viscosidad` = "5W-30". Texto libre del usuario (ver parts/userSpecs).
   */
  [partField: `part:${string}`]: string | undefined;
};

/**
 * Lo que el usuario registró. Es lo ÚNICO que se guarda en el teléfono: tablero,
 * estados, estadísticas y recomendaciones se recalculan desde aquí al abrir la app.
 */
export type UserData = {
  /** null = el primer ingreso no se ha completado. */
  onboarding: OnboardingData | null;
  /** Respuestas del primer ingreso en revisión (pantalla de resumen). */
  draft: OnboardingData | null;
  userEdits: UserProfile;
  profileEdits: Partial<CarProfile>;
  /** Registros hechos después del primer ingreso (km, mantenimientos, gastos, documentos, tanqueos). */
  records: HistoryEntry[];
  componentConfigs: Partial<Record<ComponentSummary['code'], ComponentConfig>>;
  carSheet: CarSheet;
  /** Pico y placa que configuró el usuario (opcional: los datos anteriores no lo tienen). */
  picoYPlaca?: PicoYPlacaConfig;
  /** Presupuesto mensual que eligió el usuario (opcional: los datos anteriores no lo tienen). */
  budget?: BudgetConfig;
  /** Gastos que se repiten cada mes. */
  recurringExpenses?: RecurringExpense[];
  /** Recordatorios creados por el usuario. */
  customReminders?: CustomReminder[];
  /** Contactos del carro (mecánico, aseguradora, grúa…). */
  contacts?: CarContact[];
  /** Ingresos que genera el carro (aparte de los gastos). */
  incomes?: IncomeRecord[];
  /** Repuestos de mi carro (marca, referencia y última compra). */
  myParts?: MyPart[];
  /** Comparendos que anotó (cuenta regresiva del descuento). */
  fines?: FineRecord[];
};

export const EMPTY_USER_DATA: UserData = {
  onboarding: null,
  draft: null,
  userEdits: {},
  profileEdits: {},
  records: [],
  componentConfigs: {},
  carSheet: {},
};
