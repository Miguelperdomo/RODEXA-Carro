import type { Href } from 'expo-router';

import type { CapabilityId } from '@/features/cars/capabilities';
import type { InfoSource } from '@/shared/types/source';
import type { StatusLevel } from '@/shared/theme';
import type { IconName } from '@/shared/ui';

/**
 * Estado de un punto de la revisión, a partir de lo que RODEXA tiene REGISTRADO.
 * - ok: al día según tus registros.
 * - attention: próximo, pendiente o vencido.
 * - nodata: falta información (nunca se presenta como "OK").
 * - na: no aplica a tu carro (o el usuario marcó "aún no aplica").
 */
export type TripStatus = 'ok' | 'attention' | 'nodata' | 'na';

export type TripArea = 'documents' | 'maintenance' | 'tires' | 'brakes' | 'odometer' | 'energy';

/** Un punto que RODEXA puede evaluar con los registros (documentos, mantenimiento, km…). */
export type TripCheck = {
  id: string;
  area: TripArea;
  title: string;
  icon: IconName;
  status: TripStatus;
  /** Texto corto del estado: "Vigente", "Vencido", "Sin intervalo configurado"… */
  label: string;
  detail: string;
  /** Color: "due" (vencido/pendiente) o "soon" (próximo) para los de atención. */
  level: StatusLevel;
  /** Pantalla para revisarlo o corregirlo. */
  href?: Href;
};

/** Información útil que NO es un veredicto (p. ej. energía: RODEXA no sabe cuánto hay en el tanque). */
export type TripInfo = {
  id: string;
  title: string;
  icon: IconName;
  detail: string;
  href?: Href;
};

/** Punto que el usuario revisa y marca. Marcarlo NO significa que RODEXA lo comprobó. */
export type ChecklistItem = {
  id: string;
  label: string;
  /** Línea corta debajo. */
  hint?: string;
  /** Solo se muestra si el carro puede tenerlo (regla de capacidades de A/B). */
  requires?: readonly CapabilityId[];
  /**
   * "Requisito legal" SOLO con una fuente oficial verificable. Sin fuente, el punto es
   * una recomendación preventiva (hoy todos lo son).
   */
  legalSource?: InfoSource;
};

export type ChecklistSection = {
  id: string;
  title: string;
  icon: IconName;
  items: ChecklistItem[];
  /** Cómo se recuerda un punto sin marcar en el resumen (por defecto "Revisa"). */
  reminder?: string;
};

/** Respuesta a "¿Mi carro está listo para salir?" según los registros. */
export type TripVerdict = 'attention' | 'incomplete' | 'ready';

export type TripReview = {
  verdict: TripVerdict;
  checks: TripCheck[];
  info: TripInfo[];
  sections: ChecklistSection[];
};

/** Estado de una revisión: qué puntos marcó el usuario. */
export type TravelChecklistState = Record<string, boolean>;

export type TripSummary = {
  attention: number;
  ok: number;
  noData: number;
  notApplicable: number;
  manualTotal: number;
  manualChecked: number;
  recommendations: { level: StatusLevel; text: string }[];
};
