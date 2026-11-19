import { needsEnergyConfirmation } from '@/features/cars/capabilities';
import { buildComponentDetail } from '@/features/cars/componentDetail';
import { ENERGY_UNITS, energyRecordKinds } from '@/features/cars/energy';
import type { ComponentSummary, DocumentSummary, DocumentType } from '@/features/cars/types';
import { DOCUMENT_DEFINITIONS } from '@/features/documents/catalog';
import { consumptionPairs, energyRecords, summarizeConsumption } from '@/features/energy/compute';
import { ENERGY_META, energyTitle } from '@/features/energy/meta';
import { formatRecordKm } from '@/features/odometer/recordKm';
import { odometerFreshness } from '@/features/odometer/freshness';
import type { AppData } from '@/features/session/types';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatConsumption, formatDaysAgo } from '@/shared/utils/format';

import { manualSectionsFor } from './checklist';
import type { TravelChecklistState, TripArea, TripCheck, TripInfo, TripReview, TripSummary } from './types';

/**
 * "Voy a viajar": revisión PREVENTIVA con lo que RODEXA tiene registrado. Reutiliza las
 * reglas centrales (documentos D, mantenimiento B, energía C). Nunca dice que algo está
 * bien si no hay información, ni afirma requisitos legales.
 */

/** Documentos que se revisan siempre (aunque no estén registrados); el resto, si existen. */
const TRIP_DOCUMENTS: DocumentType[] = ['soat', 'rtm', 'transit_license', 'license'];
/** El impuesto no se revisa para un viaje (es una fecha de pago, no algo que se lleva). */
const NOT_FOR_TRIPS: DocumentType[] = ['tax'];

const documentHref = (doc: Pick<DocumentSummary, 'key' | 'type' | 'records'>) =>
  doc.records > 0
    ? ({ pathname: '/documentos/[key]', params: { key: doc.key } } as const)
    : ({ pathname: '/registrar/documento', params: { tipo: doc.type } } as const);

/** Estado de un documento en la revisión, a partir de su estado central (Fase D). */
export function documentCheck(doc: DocumentSummary): TripCheck {
  const base = {
    id: `document.${doc.key}`,
    area: 'documents' as const,
    title: doc.title,
    icon: DOCUMENT_DEFINITIONS[doc.type].icon,
    detail: doc.detail,
    href: documentHref(doc),
  };
  const noExpiry = DOCUMENT_DEFINITIONS[doc.type].expiry === 'none';
  if (doc.records === 0) return { ...base, status: 'nodata', label: 'Sin registrar', detail: 'Sin registrar en RODEXA', level: 'nodata' };
  switch (doc.status) {
    case 'due':
      return { ...base, status: 'attention', label: 'Vencido', level: 'due' };
    case 'soon':
      return { ...base, status: 'attention', label: 'Próximo a vencer', level: 'soon' };
    case 'ok':
      return { ...base, status: 'ok', label: noExpiry || !doc.alertDate ? 'Registrado' : 'Vigente', level: 'ok' };
    case 'na':
      return { ...base, status: 'na', label: 'No aplica', level: 'na' };
    default:
      return { ...base, status: 'nodata', label: 'Sin fecha', level: 'nodata' };
  }
}

const AREA_OF: Partial<Record<ComponentSummary['code'], TripArea>> = { tires: 'tires', brake_check: 'brakes' };

/** Estado de un componente de mantenimiento (solo los que aplican: Fase B). */
export function maintenanceCheck(component: ComponentSummary, data: AppData, today: Date): TripCheck {
  const area = AREA_OF[component.code] ?? 'maintenance';
  const base = {
    id: `component.${component.code}`,
    area,
    title: component.title,
    icon: component.icon,
    href: { pathname: '/mi-carro/componente/[code]', params: { code: component.code } } as const,
  };
  const lastKind = area === 'maintenance' ? 'el último cambio' : 'la última revisión';
  if (!component.enabled) {
    return component.applicability === 'maybe'
      ? { ...base, status: 'nodata', label: 'Depende de tu carro', detail: 'No lo estás controlando. Actívalo solo si tu carro lo tiene.', level: 'nodata' }
      : { ...base, status: 'nodata', label: 'Sin datos', detail: `Sin datos sobre ${lastKind}`, level: 'nodata' };
  }
  if (component.status === 'due') return { ...base, status: 'attention', label: 'Pendiente', detail: component.detail, level: 'due' };
  if (component.status === 'soon') return { ...base, status: 'attention', label: 'Próximo', detail: component.detail, level: 'soon' };
  if (component.status === 'ok') return { ...base, status: 'ok', label: 'Al día', detail: component.detail, level: 'ok' };

  // Sin datos: decir exactamente qué falta (nunca "OK").
  const detail = buildComponentDetail(component, data.history, data.odometer.registeredKm, today);
  const hasLast = detail.lastService !== undefined;
  const hasInterval = detail.interval !== undefined;
  const text = !hasLast
    ? `Sin datos sobre ${lastKind}${hasInterval ? '' : ' ni intervalo configurado'}`
    : 'Sin intervalo configurado';
  return { ...base, status: 'nodata', label: hasLast ? 'Sin intervalo configurado' : 'Sin datos', detail: text, level: 'nodata' };
}

/** Energía: se informa lo registrado; RODEXA no sabe cuánto hay en el tanque o la batería. */
function energyInfo(data: AppData): { checks: TripCheck[]; info: TripInfo[] } {
  if (needsEnergyConfirmation(data.profile)) {
    return {
      checks: [
        {
          id: 'energy.confirm',
          area: 'energy',
          title: 'Combustible o energía',
          icon: 'fuel',
          status: 'nodata',
          label: 'Sin confirmar',
          detail: 'Confirma qué usa tu carro para revisar lo que le aplica.',
          level: 'nodata',
          href: '/mi-carro/editar',
        },
      ],
      info: [],
    };
  }
  const info = energyRecordKinds(data.profile).map((kind): TripInfo => {
    const records = energyRecords(data.history, kind);
    const last = records.at(-1);
    const consumption = summarizeConsumption(consumptionPairs(data.history, kind), kind);
    const parts = [
      last ? `Último registro: ${formatDate(parseISODate(last.date))} · ${formatRecordKm(last.km)}` : 'Sin registros todavía',
      consumption.status === 'calculated'
        ? `consumo según tus registros: ${formatConsumption(consumption.kmPerUnit, ENERGY_UNITS[kind].quantity)}`
        : undefined,
    ].filter(Boolean);
    return {
      id: `energy.${kind}`,
      title: energyTitle(kind, data.profile.energySource),
      icon: ENERGY_META[kind].icon,
      detail: `${parts.join(' · ')}. RODEXA no sabe cuánto tienes ahora: revísalo antes de salir.`,
      href: { pathname: '/registrar/energia', params: { tipo: kind } },
    };
  });
  return { checks: [], info };
}

function odometerCheck(data: AppData): TripCheck {
  const stale = odometerFreshness(data.odometer.daysSinceReading) === 'stale';
  const ago = formatDaysAgo(data.odometer.daysSinceReading);
  return {
    id: 'odometer',
    area: 'odometer',
    title: 'Kilometraje',
    icon: 'odometer',
    status: stale ? 'attention' : 'ok',
    label: stale ? 'Desactualizado' : 'Actualizado',
    detail: stale
      ? `Último registro ${ago}. Actualízalo para que los estados de mantenimiento sean correctos.`
      : `Último registro ${ago}.`,
    level: stale ? 'soon' : 'ok',
    href: '/registrar/kilometraje',
  };
}

/** Arma la revisión completa del carro para un viaje. Función pura. */
export function buildTripReview(data: AppData, today: Date): TripReview {
  const documents = [
    ...TRIP_DOCUMENTS.map(
      (type) =>
        data.documents.find((d) => d.type === type) ?? {
          key: type,
          type,
          title: DOCUMENT_DEFINITIONS[type].title,
          status: 'nodata' as const,
          detail: 'Sin registrar',
          records: 0,
        },
    ),
    ...data.documents.filter((d) => !TRIP_DOCUMENTS.includes(d.type) && !NOT_FOR_TRIPS.includes(d.type) && d.records > 0),
  ].map(documentCheck);

  const maintenance = data.components.map((c) => maintenanceCheck(c, data, today));
  const energy = energyInfo(data);
  const checks = [...documents, ...maintenance, odometerCheck(data), ...energy.checks];

  const verdict = checks.some((c) => c.status === 'attention')
    ? 'attention'
    : checks.some((c) => c.status === 'nodata')
      ? 'incomplete'
      : 'ready';

  return { verdict, checks, info: energy.info, sections: manualSectionsFor(data.profile) };
}

/** Resumen: cuenta estados y lo que el usuario marcó. Nunca afirma que el carro "está perfecto". */
export function summarizeTrip(review: TripReview, state: TravelChecklistState): TripSummary {
  const manual = review.sections.flatMap((s) => s.items);
  const manualChecked = manual.filter((i) => state[i.id]).length;
  const count = (status: TripCheck['status']) => review.checks.filter((c) => c.status === status).length;
  const unchecked = manual.length - manualChecked;
  const recommendations: TripSummary['recommendations'] = [
    ...review.checks
      .filter((c) => c.status === 'attention')
      .sort((a, b) => (a.level === 'due' ? 0 : 1) - (b.level === 'due' ? 0 : 1))
      .map((c) => ({ level: c.level, text: `${c.title}: ${c.label.toLowerCase()}` })),
    ...review.checks.filter((c) => c.status === 'nodata').map((c) => ({ level: c.level, text: `${c.title}: ${c.detail.toLowerCase()}` })),
    ...(unchecked > 0
      ? [{ level: 'soon' as const, text: `${unchecked} ${unchecked === 1 ? 'punto' : 'puntos'} de tu revisión sin marcar` }]
      : []),
  ];
  return {
    attention: count('attention'),
    ok: count('ok'),
    noData: count('nodata'),
    notApplicable: count('na'),
    manualTotal: manual.length,
    manualChecked,
    recommendations,
  };
}

/** Titular de la revisión según el veredicto (texto simple, sin conclusiones legales). */
export const VERDICT_TEXT: Record<TripReview['verdict'], { title: string; detail: string }> = {
  attention: {
    title: 'Revisa estos puntos antes de salir',
    detail: 'Según tus registros, hay puntos que requieren atención.',
  },
  incomplete: {
    title: 'Sin alertas, pero faltan datos',
    detail: 'No hay alertas en tus registros, pero RODEXA no tiene información de algunos puntos.',
  },
  ready: {
    title: 'Según tus registros, todo está al día',
    detail: 'RODEXA no revisa físicamente tu carro: completa también la revisión de abajo.',
  },
};

export type PreTripSuggestion = { code: string; level: 'due' | 'soon'; text: string };

/**
 * Antes de un viaje largo: mantenimientos que según tus registros están pendientes o
 * próximos, con una sugerencia clara (el aceite primero). No es un diagnóstico.
 */
export function preTripSuggestions(review: TripReview): PreTripSuggestion[] {
  return review.checks
    .filter((c) => c.id.startsWith('component.') && c.status === 'attention' && (c.level === 'due' || c.level === 'soon'))
    .map((c) => {
      const code = c.id.slice('component.'.length);
      const name = c.title.charAt(0).toLowerCase() + c.title.slice(1);
      return {
        code,
        level: c.level as 'due' | 'soon',
        text:
          c.level === 'due'
            ? `Tu ${name} está pendiente según tus registros: hazlo antes de salir a carretera.`
            : `Tu ${name} está próximo: te sugerimos hacerlo antes de un viaje largo.`,
      };
    })
    .sort((a, b) => (a.code === 'oil' ? -1 : b.code === 'oil' ? 1 : 0) || (a.level === 'due' ? -1 : 1) - (b.level === 'due' ? -1 : 1));
}
