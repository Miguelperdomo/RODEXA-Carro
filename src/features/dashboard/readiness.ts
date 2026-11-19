import type { ComponentSummary, DocumentSummary, DocumentType } from '@/features/cars/types';
import { customStatus, type CustomReminder } from '@/features/customReminders/rules';
import type { AppData } from '@/features/session/types';

/**
 * ¿Cómo está mi carro? Una sola regla para Inicio, la revisión de viaje y (más adelante) el
 * asistente. Dos cosas muy distintas:
 * - DOCUMENTOS OBLIGATORIOS (SOAT, tecnomecánica, licencia de conducción): la fecha es un
 *   hecho. Si alguno venció, se avisa con claridad.
 * - MANTENIMIENTOS y recordatorios: RODEXA no ve el carro, solo sabe que se cumplió el plazo
 *   (km o fecha) que configuró la persona. Nunca se dice que el carro "está malo".
 *
 * "Al día" solo cuando no hay nada vencido Y se conocen los documentos obligatorios.
 */
export const REQUIRED_DOCUMENTS: readonly DocumentType[] = ['soat', 'rtm', 'license'];

export type ReadinessLevel =
  /** Un documento obligatorio venció. */
  | 'blocked'
  /** Algo vencido o por vencer (plazos, otros documentos). */
  | 'review'
  /** Sin alertas, pero falta la fecha de un documento obligatorio. */
  | 'missing'
  | 'ok';

export type Readiness = {
  level: ReadinessLevel;
  /** Obligatorios vencidos. */
  blockers: DocumentSummary[];
  /** Obligatorios registrados o pedidos sin fecha: no se sabe si están vigentes. */
  unknownRequired: DocumentSummary[];
  /** Otros documentos vencidos (póliza, impuesto, otros). */
  otherExpired: DocumentSummary[];
  /** Documentos por vencer. */
  docsSoon: DocumentSummary[];
  /** Se cumplió el plazo que configuró la persona (no se sabe el estado real). */
  maintDue: ComponentSummary[];
  maintSoon: ComponentSummary[];
  /** Recordatorios propios cuya fecha o km ya llegó. */
  remindersDue: { title: string; detail: string }[];
};

export function readinessOf(
  data: Pick<AppData, 'documents' | 'components' | 'odometer'>,
  today: Date,
  customReminders: CustomReminder[] = [],
): Readiness {
  const required = (d: DocumentSummary) => REQUIRED_DOCUMENTS.includes(d.type);
  // "No aplica" (p. ej. la tecnomecánica de un carro nuevo) no está vencido ni falta.
  const applies = (d: DocumentSummary) => !d.notApplicable && d.status !== 'na';
  const blockers = data.documents.filter((d) => required(d) && applies(d) && d.status === 'due');
  const unknownRequired = data.documents.filter(
    (d) => required(d) && applies(d) && (d.records === 0 || d.status === 'nodata'),
  );
  const otherExpired = data.documents.filter((d) => !required(d) && d.status === 'due');
  const docsSoon = data.documents.filter((d) => d.status === 'soon');
  const maintDue = data.components.filter((c) => c.enabled && c.status === 'due');
  const maintSoon = data.components.filter((c) => c.enabled && c.status === 'soon');
  const remindersDue = customReminders
    .filter((r) => !r.doneAt)
    .map((r) => ({ title: r.title, status: customStatus(r, data.odometer.registeredKm, today) }))
    .filter((r) => r.status.level === 'due')
    .map((r) => ({ title: r.title, detail: r.status.detail }));

  const pending = otherExpired.length + docsSoon.length + maintDue.length + maintSoon.length + remindersDue.length;
  const level: ReadinessLevel =
    blockers.length > 0 ? 'blocked' : pending > 0 ? 'review' : unknownRequired.length > 0 ? 'missing' : 'ok';

  return { level, blockers, unknownRequired, otherExpired, docsSoon, maintDue, maintSoon, remindersDue };
}

const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;

const docName = (d: DocumentSummary) => (d.type === 'soat' ? 'SOAT' : d.title.toLowerCase());

/** "Tu tecnomecánica está vencida" / "Tu SOAT y tu tecnomecánica están vencidos". */
export function blockersSentence(r: Readiness): string {
  const names = r.blockers.map((d) => `tu ${docName(d)}`);
  // SOAT es masculino; tecnomecánica y licencia, femeninos (en plural manda el masculino).
  const masculine = r.blockers.some((d) => d.type === 'soat');
  const verb =
    r.blockers.length === 1 ? `está vencid${masculine ? 'o' : 'a'}` : `están vencid${masculine ? 'os' : 'as'}`;
  const text = `${list(names)} ${verb}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Renuévalo" / "Renuévala" / "Renuévalos" / "Renuévalas", según los documentos vencidos. */
export function renewWord(r: Readiness): string {
  const masculine = r.blockers.some((d) => d.type === 'soat');
  if (r.blockers.length > 1) return masculine ? 'Renuévalos' : 'Renuévalas';
  return masculine ? 'Renuévalo' : 'Renuévala';
}

/** Fuente verificada: Ley 769 de 2002 (Código Nacional de Tránsito), art. 131, mod. por el art. 21 de la Ley 1383 de 2010. */
export const TRANSIT_LAW = 'Código Nacional de Tránsito, Ley 769 de 2002, artículo 131';

/**
 * Por qué importa (sin cifras de multas). SOAT y tecnomecánica: el art. 131 (D.2 y C.35)
 * prevé multa e inmovilización. Licencia VENCIDA: no se afirma una sanción (la norma D.1
 * habla de no haberla obtenido), solo se pide renovarla.
 */
export function blockedWhy(r: Readiness): string {
  const parts: string[] = [];
  if (r.blockers.some((d) => d.type === 'soat' || d.type === 'rtm')) {
    parts.push(
      `Circular con el SOAT o la tecnomecánica vencidos puede generar multa e inmovilización del vehículo (${TRANSIT_LAW}).`,
    );
  }
  if (r.blockers.some((d) => d.type === 'license')) parts.push('Renueva tu licencia de conducción lo antes posible.');
  return parts.join(' ');
}

/** El plazo se cumplió, pero RODEXA no ve el carro. */
export function maintDueSentence(r: Readiness): string {
  const names = [...r.maintDue.map((c) => c.title.toLowerCase()), ...r.remindersDue.map((x) => x.title.toLowerCase())];
  if (names.length === 0) return '';
  return `Se cumplió el plazo que pusiste para ${list(names)}: revísalo. RODEXA no ve tu carro; si ya lo hiciste, actualízalo en la app.`;
}

export function unknownSentence(r: Readiness): string {
  if (r.unknownRequired.length === 0) return '';
  const names = list(r.unknownRequired.map((d) => d.title));
  return `Falta la fecha de ${names}: sin ella no se puede saber si está vigente. Regístrala en Documentos.`;
}

/** Texto corto (Inicio, resumen). */
export function readinessHeadline(r: Readiness): string {
  switch (r.level) {
    case 'blocked':
      return 'Tienes documentos vencidos';
    case 'review': {
      const n = r.otherExpired.length + r.docsSoon.length + r.maintDue.length + r.maintSoon.length + r.remindersDue.length;
      return `Tienes ${n} ${n === 1 ? 'punto' : 'puntos'} por revisar`;
    }
    case 'missing':
      return `Sin alertas, pero falta la fecha de ${list(r.unknownRequired.map((d) => d.title))}`;
    case 'ok':
      return 'Según tus registros, todo está al día';
  }
}

export type TripHeadline = { title: string; detail: string; level: 'due' | 'nodata' | 'ok' | 'soon' };

/**
 * Veredicto de la revisión de viaje con la misma regla: un obligatorio vencido manda (con la
 * norma citada) y, sin la fecha de un obligatorio, nunca se dice "todo está al día".
 */
export function tripHeadline(base: TripHeadline, r: Readiness): TripHeadline {
  if (r.level === 'blocked') {
    return { title: blockersSentence(r), detail: `${blockedWhy(r)} ${renewWord(r)} antes de viajar.`, level: 'due' };
  }
  if (base.level === 'ok' && r.unknownRequired.length > 0) {
    return { title: 'Sin alertas, pero faltan datos', detail: unknownSentence(r), level: 'nodata' };
  }
  return base;
}
