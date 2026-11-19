import type { DocumentSummary, DocumentType } from '@/features/cars/types';
import type { DocumentRecord, HistoryEntry } from '@/features/history/types';
import { daysBetween, formatDate, parseISODate } from '@/shared/utils/date';

import { DOCUMENT_DEFINITIONS, DOCUMENT_ORDER } from './catalog';
import { DOCUMENT_WARNING_DAYS, documentStatus } from './status';
import { cmpText } from '@/shared/utils/compare';

/** Identificador del documento: su tipo, o "other:<serie>" para cada "Otro" (hay varios). */
export function documentKey(record: Pick<DocumentRecord, 'docType' | 'seriesId' | 'id'>): string {
  return DOCUMENT_DEFINITIONS[record.docType].multiple ? `other:${record.seriesId ?? record.id}` : record.docType;
}

export function isDocument(entry: HistoryEntry): entry is DocumentRecord {
  return entry.kind === 'document';
}

/** ¿El impuesto de este registro está pagado? (el usuario lo marcó con fecha de pago). */
export const isTaxPaid = (record: DocumentRecord) => record.paidAt !== undefined;

/**
 * El registro que manda: el impuesto del año más reciente; si los dos tienen
 * vencimiento, el que vence más tarde (registrar después un SOAT viejo no lo vuelve el
 * vigente); si no, el último registrado (a igual fecha, el que se agregó después).
 */
function latest(records: DocumentRecord[]): DocumentRecord {
  return records.reduce((best, record) => {
    if (record.docType === 'tax' && (record.taxYear ?? 0) !== (best.taxYear ?? 0)) {
      return (record.taxYear ?? 0) > (best.taxYear ?? 0) ? record : best;
    }
    if (record.expiresAt && best.expiresAt && record.expiresAt !== best.expiresAt) {
      return record.expiresAt > best.expiresAt ? record : best;
    }
    return record.date >= best.date ? record : best;
  });
}

type Status = Pick<DocumentSummary, 'status' | 'detail' | 'alertDate'>;

function taxStatus(record: DocumentRecord, today: Date): Status {
  const year = record.taxYear ? ` ${record.taxYear}` : '';
  if (record.exempt) return { status: 'na', detail: `Exento / no aplica${year}` };
  if (isTaxPaid(record)) return { status: 'ok', detail: `Pagado${year}` };
  if (!record.dueDate) return { status: 'nodata', detail: `Pendiente${year} · sin fecha límite registrada` };
  const due = parseISODate(record.dueDate);
  const days = daysBetween(today, due);
  if (days < 0) {
    return { status: 'due', detail: `La fecha límite${year} fue el ${formatDate(due)} y no hay pago registrado`, alertDate: record.dueDate };
  }
  if (days <= DOCUMENT_WARNING_DAYS) {
    return {
      status: 'soon',
      detail: days === 0 ? `Fecha límite${year}: hoy` : `Fecha límite${year} en ${days} días · ${formatDate(due)}`,
      alertDate: record.dueDate,
    };
  }
  return { status: 'ok', detail: `Pendiente${year} · fecha límite ${formatDate(due)}`, alertDate: record.dueDate };
}

/** Estado de un documento según su registro más reciente y su catálogo. */
function statusOf(record: DocumentRecord, today: Date): Status {
  const definition = DOCUMENT_DEFINITIONS[record.docType];
  switch (definition.expiry) {
    case 'due_date':
      return taxStatus(record, today);
    case 'none':
      return { status: 'ok', detail: 'Registrado' };
    case 'optional':
      if (!record.hasExpiry) return { status: 'ok', detail: 'Registrado · sin vencimiento' };
      break;
    case 'expires':
      if (definition.allowNotApplicable && record.notApplicable) return { status: 'na', detail: 'Aún no aplica' };
      break;
  }
  return { ...documentStatus(record.expiresAt, today), alertDate: record.expiresAt };
}

/**
 * Documentos del usuario con su estado actual, en el orden del catálogo. Los que
 * se listan aunque falten aparecen "Sin registrar"; cada "Otro" es un documento
 * propio con sus renovaciones. Nada se inventa: sin registro, sin fecha.
 */
export function buildDocumentSummaries(entries: HistoryEntry[], today: Date): DocumentSummary[] {
  const records = entries.filter(isDocument);
  const groups = new Map<string, DocumentRecord[]>();
  for (const record of records) {
    const key = documentKey(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const summaries: DocumentSummary[] = [];
  for (const type of DOCUMENT_ORDER) {
    const definition = DOCUMENT_DEFINITIONS[type];
    const keys = definition.multiple ? [...groups.keys()].filter((k) => k.startsWith(`${type}:`)) : [type];
    for (const key of keys) {
      const group = groups.get(key);
      if (!group) {
        if (definition.listedWhenMissing) {
          summaries.push({ key, type, title: definition.title, status: 'nodata', detail: 'Sin registrar', records: 0 });
        }
        continue;
      }
      const record = latest(group);
      summaries.push({
        key,
        type,
        title: definition.multiple ? (record.name ?? definition.title) : definition.title,
        ...statusOf(record, today),
        expiresAt: record.expiresAt,
        issuer: record.issuer,
        number: record.number,
        notApplicable: record.notApplicable,
        exempt: record.exempt,
        taxYear: record.taxYear,
        latestRecordId: record.id,
        records: group.length,
      });
    }
  }
  return summaries;
}

/** Registros de un documento (renovaciones), del más reciente al más antiguo. */
export function documentRecords(entries: HistoryEntry[], key: string): DocumentRecord[] {
  return entries
    .filter(isDocument)
    .filter((r) => documentKey(r) === key)
    .sort((a, b) => (b.taxYear ?? 0) - (a.taxYear ?? 0) || cmpText(b.date, a.date));
}

/** ¿Necesita atención? Solo próximos a vencer o vencidos (lo único que va a Inicio). */
export const needsAttention = (doc: DocumentSummary) => doc.status === 'soon' || doc.status === 'due';

export type { DocumentType };
