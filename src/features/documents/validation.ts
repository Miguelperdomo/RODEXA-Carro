import type { DocumentType } from '@/features/cars/types';

import { DOCUMENT_DEFINITIONS, documentExpenseCategory } from './catalog';

export type TaxState = 'pending' | 'paid' | 'exempt';

export type DocumentInput = {
  type: DocumentType;
  otherName: string;
  notApplicable: boolean;
  hasExpiry: boolean;
  expiresAt: Date | null;
  taxYear: number | null;
  taxState: TaxState;
  costCop: number | null;
  paidAt: Date | null;
  /** Año actual (para validar el año gravable sin inventar un rango legal). */
  currentYear: number;
};

export type DocumentErrors = Partial<Record<'otherName' | 'expiresAt' | 'taxYear' | 'costCop' | 'paidAt', string>>;

/** ¿Este formulario pide fecha de vencimiento? (según catálogo y lo que marcó el usuario). */
export function needsExpiryDate(input: Pick<DocumentInput, 'type' | 'notApplicable' | 'hasExpiry'>): boolean {
  const definition = DOCUMENT_DEFINITIONS[input.type];
  if (definition.expiry === 'expires') return !(definition.allowNotApplicable && input.notApplicable);
  return definition.expiry === 'optional' && input.hasExpiry;
}

/** ¿Se puede registrar valor pagado? (solo documentos del carro, y un impuesto exento no se paga). */
export function acceptsPayment(input: Pick<DocumentInput, 'type' | 'taxState'>): boolean {
  if (documentExpenseCategory(input.type) === undefined) return false;
  return !DOCUMENT_DEFINITIONS[input.type].hasTaxFields || input.taxState === 'paid';
}

export function validateDocument(input: DocumentInput): DocumentErrors {
  const errors: DocumentErrors = {};
  const definition = DOCUMENT_DEFINITIONS[input.type];

  if (definition.multiple && input.otherName.trim() === '') errors.otherName = 'Escribe qué documento es.';

  if (needsExpiryDate(input)) {
    // Lo que importa es el vencimiento (la fecha de expedición ya no se pide).
    if (input.expiresAt === null) errors.expiresAt = 'Elige la fecha de vencimiento.';
  }

  // Año gravable: solo que sea un año con sentido (no se inventan plazos ni reglas tributarias).
  if (definition.hasTaxFields && input.taxYear !== null && (input.taxYear < 1950 || input.taxYear > input.currentYear + 1)) {
    errors.taxYear = 'Revisa el año.';
  }

  if (acceptsPayment(input)) {
    if (input.costCop !== null && input.costCop < 0) errors.costCop = 'El valor no puede ser negativo.';
    if (input.costCop !== null && input.paidAt === null) errors.paidAt = 'Elige la fecha de pago.';
    if (definition.hasTaxFields && input.paidAt === null) errors.paidAt = 'Elige la fecha de pago.';
  }
  return errors;
}
