import type { IconName } from '@/shared/ui/Icon';

/**
 * Estados de "Estado de mi carro" (ver docs/diseno-funcional.md §8.1).
 * Cada estado siempre se muestra con color + ícono + texto, nunca solo color.
 */
export type StatusLevel = 'ok' | 'soon' | 'due' | 'nodata' | 'na';

/** Ícono de cada estado (igual en ambos temas). Los colores viven en la paleta del tema. */
export const statusIcons: Record<StatusLevel, IconName> = {
  ok: 'statusOk',
  soon: 'statusSoon',
  due: 'statusDue',
  nodata: 'statusNoData',
  na: 'statusNotApplicable',
};

/** Etiquetas para componentes de mantenimiento (aceite, kit…). */
export const maintenanceStatusLabels: Record<StatusLevel, string> = {
  ok: 'Al día',
  soon: 'Próximo',
  due: 'Pendiente',
  nodata: 'Sin datos',
  na: 'No aplica',
};

/** Etiquetas para documentos (SOAT, tecnomecánica…). */
export const documentStatusLabels: Record<StatusLevel, string> = {
  ok: 'Vigente',
  soon: 'Por vencer',
  due: 'Vencido',
  nodata: 'Sin datos',
  na: 'No aplica',
};
