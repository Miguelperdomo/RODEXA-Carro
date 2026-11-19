import type { DocumentSummary } from '@/features/cars/types';
import type { DocumentRecord } from '@/features/history/types';
import { documentStatusLabels } from '@/shared/theme';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

import { DOCUMENT_DEFINITIONS, documentExpenseCategory } from './catalog';
import { isTaxPaid } from './summary';

const date = (iso?: string) => (iso ? formatDate(parseISODate(iso)) : undefined);

/**
 * Etiqueta del estado: "Vigente" / "Por vencer" / "Vencido" solo para lo que tiene una
 * fecha; un documento sin vencimiento (o un impuesto pagado) está "Al día".
 */
export function documentStatusText(doc: DocumentSummary): string {
  if (doc.records === 0) return 'Sin registrar';
  if (doc.status === 'ok' && !doc.alertDate) return 'Al día';
  if (doc.status === 'ok' && DOCUMENT_DEFINITIONS[doc.type].hasTaxFields) return 'Pendiente';
  return documentStatusLabels[doc.status];
}

/** "SOAT", "Impuesto vehicular 2027", o el nombre de un "Otro". */
export function documentRecordTitle(record: DocumentRecord): string {
  const definition = DOCUMENT_DEFINITIONS[record.docType];
  if (definition.multiple) return record.name ?? definition.title;
  if (definition.hasTaxFields && record.taxYear) return `${definition.title} ${record.taxYear}`;
  return definition.title;
}

/** Resumen corto para el historial: "vence 14/05/2027", "pagado", "sin vencimiento"… */
export function documentRecordSubtitle(record: DocumentRecord): string {
  const definition = DOCUMENT_DEFINITIONS[record.docType];
  if (definition.hasTaxFields) {
    if (record.exempt) return 'exento / no aplica';
    if (isTaxPaid(record)) return `pagado el ${date(record.paidAt)}`;
    return record.dueDate ? `pendiente · fecha límite ${date(record.dueDate)}` : 'pendiente';
  }
  if (definition.allowNotApplicable && record.notApplicable) return 'aún no aplica';
  if (definition.expiry === 'none' || (definition.expiry === 'optional' && !record.hasExpiry)) return 'sin vencimiento';
  return record.expiresAt ? `vence ${date(record.expiresAt)}` : 'sin fecha de vencimiento';
}

/** Filas del detalle de un registro (solo lo que existe; nada se inventa). */
export function documentDetailRows(record: DocumentRecord): { label: string; value?: string }[] {
  const definition = DOCUMENT_DEFINITIONS[record.docType];
  const counts = documentExpenseCategory(record.docType) !== undefined;
  return [
    { label: 'Documento', value: documentRecordTitle(record) },
    { label: 'Estado', value: documentRecordSubtitle(record) },
    ...(definition.hasTaxFields
      ? [
          { label: 'Departamento', value: record.department },
          { label: 'Fecha límite de pago', value: date(record.dueDate) },
        ]
      : [{ label: 'Vence', value: date(record.expiresAt) }]),
    { label: 'Expedición', value: date(record.issuedAt) },
    { label: definition.numberLabel, value: record.number ?? record.reference },
    { label: definition.issuerLabel ?? 'Entidad', value: record.issuer },
    { label: 'Categoría', value: record.licenseCategory },
    { label: 'Cobertura', value: record.coverage },
    ...(counts
      ? [
          { label: 'Valor pagado', value: record.costCop !== undefined ? formatCop(record.costCop) : undefined },
          { label: 'Fecha de pago', value: date(record.paidAt) },
        ]
      : []),
    { label: 'Registrado', value: date(record.date) },
    { label: 'Observaciones', value: record.note },
  ];
}
