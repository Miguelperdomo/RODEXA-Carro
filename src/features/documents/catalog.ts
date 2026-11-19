import type { DocumentType } from '@/features/cars/types';
import type { ExpenseCategoryCode } from '@/features/expenses/catalog';
import type { Settings } from '@/features/settings/types';
import type { IconName } from '@/shared/ui';

/**
 * Catálogo de documentos: la ÚNICA regla de cómo se comporta cada uno. Las pantallas,
 * los estados, los recordatorios y los gastos lo consultan (sin `if` por documento).
 *
 * Los documentos son una herramienta de organización dentro de RODEXA. Todas las
 * fechas las registra el usuario; aquí no hay plazos, periodicidades ni requisitos
 * legales. Los 30/7/1 días de aviso son decisiones de diseño de RODEXA.
 */
export type ExpiryKind =
  /** Tiene fecha de vencimiento (la escribe el usuario). */
  | 'expires'
  /** El usuario decide si tiene vencimiento ("Otro"). */
  | 'optional'
  /** No vence (licencia de tránsito). */
  | 'none'
  /** No vence: tiene una fecha límite de pago por año (impuesto). */
  | 'due_date';

export type DocumentDefinition = {
  type: DocumentType;
  title: string;
  icon: IconName;
  /** "car" = costo y documento del carro; "driver" = del conductor (no cuenta como gasto del carro). */
  belongsTo: 'car' | 'driver';
  expiry: ExpiryKind;
  /** Preferencia que activa sus recordatorios (sin preferencia = sin recordatorios). */
  reminderSetting?: keyof Pick<
    Settings,
    'remindSoat' | 'remindRtm' | 'remindLicense' | 'remindPolicy' | 'remindTax' | 'remindOther'
  >;
  /** Si tiene valor pagado, en qué categoría de gasto cuenta. Sin categoría = no se pide valor. */
  expenseCategory?: ExpenseCategoryCode;
  /** "Aún no aplica" (RTM de un carro que todavía no la requiere, según el usuario). */
  allowNotApplicable?: boolean;
  /** "Exento / no aplica" (impuesto). */
  allowExempt?: boolean;
  /** Puede haber varios a la vez (cada "Otro" es uno distinto). */
  multiple?: boolean;
  /** Se muestra en la lista aunque no esté registrado ("Sin registrar"). */
  listedWhenMissing: boolean;
  numberLabel: string;
  issuerLabel?: string;
  issuerPlaceholder?: string;
  /** Campos propios. */
  hasCoverage?: boolean;
  hasLicenseCategory?: boolean;
  hasTaxFields?: boolean;
};

export const DOCUMENT_DEFINITIONS: Record<DocumentType, DocumentDefinition> = {
  soat: {
    type: 'soat',
    title: 'SOAT',
    icon: 'insurance',
    belongsTo: 'car',
    expiry: 'expires',
    reminderSetting: 'remindSoat',
    expenseCategory: 'soat',
    listedWhenMissing: true,
    numberLabel: 'Número de póliza',
    issuerLabel: 'Aseguradora',
    issuerPlaceholder: 'Aseguradora',
  },
  rtm: {
    type: 'rtm',
    title: 'Tecnomecánica',
    icon: 'inspection',
    belongsTo: 'car',
    expiry: 'expires',
    reminderSetting: 'remindRtm',
    expenseCategory: 'rtm',
    allowNotApplicable: true,
    listedWhenMissing: true,
    numberLabel: 'Número de certificado',
    issuerLabel: 'CDA',
    issuerPlaceholder: 'Centro de diagnóstico automotor',
  },
  policy: {
    type: 'policy',
    title: 'Póliza de seguro',
    icon: 'insurance',
    belongsTo: 'car',
    expiry: 'expires',
    reminderSetting: 'remindPolicy',
    expenseCategory: 'insurance',
    listedWhenMissing: false,
    numberLabel: 'Número de póliza',
    issuerLabel: 'Aseguradora',
    issuerPlaceholder: 'Aseguradora',
    hasCoverage: true,
  },
  tax: {
    type: 'tax',
    title: 'Impuesto vehicular',
    icon: 'tax',
    belongsTo: 'car',
    expiry: 'due_date',
    reminderSetting: 'remindTax',
    expenseCategory: 'tax',
    allowExempt: true,
    listedWhenMissing: true,
    numberLabel: 'Referencia o número de liquidación',
    hasTaxFields: true,
  },
  transit_license: {
    type: 'transit_license',
    title: 'Licencia de tránsito',
    icon: 'document',
    belongsTo: 'car',
    expiry: 'none',
    listedWhenMissing: true,
    numberLabel: 'Número de la licencia',
    issuerLabel: 'Organismo de tránsito',
    issuerPlaceholder: 'Secretaría u organismo de tránsito',
  },
  license: {
    type: 'license',
    title: 'Licencia de conducción',
    icon: 'document',
    // Es del conductor: su valor no cuenta como gasto del carro (no se pide).
    belongsTo: 'driver',
    expiry: 'expires',
    reminderSetting: 'remindLicense',
    listedWhenMissing: false,
    numberLabel: 'Número de la licencia',
    hasLicenseCategory: true,
  },
  other: {
    type: 'other',
    title: 'Otro documento',
    icon: 'document',
    belongsTo: 'car',
    expiry: 'optional',
    reminderSetting: 'remindOther',
    expenseCategory: 'other',
    multiple: true,
    listedWhenMissing: false,
    numberLabel: 'Número',
    issuerLabel: 'Entidad',
    issuerPlaceholder: 'Entidad',
  },
};

/** Orden en listas y en el formulario. */
export const DOCUMENT_ORDER: DocumentType[] = ['soat', 'rtm', 'policy', 'tax', 'transit_license', 'license', 'other'];

export function documentDefinition(type: DocumentType): DocumentDefinition {
  return DOCUMENT_DEFINITIONS[type];
}

/** ¿El valor pagado de este tipo cuenta como gasto del carro? */
export function documentExpenseCategory(type: DocumentType): ExpenseCategoryCode | undefined {
  const definition = DOCUMENT_DEFINITIONS[type];
  return definition.belongsTo === 'car' ? definition.expenseCategory : undefined;
}
