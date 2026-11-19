import type { Href } from 'expo-router';

import type { OdometerSummary } from '@/features/cars/types';
import type { StatusLevel } from '@/shared/theme';
import type { IconName } from '@/shared/ui';

/**
 * Datos que necesita el dashboard, ya calculados.
 * Hoy vienen de `src/mocks`; en la Fase 5 los producirán las reglas del
 * "Estado de mi carro" (docs/diseno-funcional.md §8) a partir de SQLite.
 */
export type DashboardData = {
  car: {
    name: string;
    subtitle: string;
  };
  odometer: OdometerSummary;
  /** Tarjeta "¿Cuánto marca tu carro hoy?" (≥ 7 días sin lectura). */
  weeklyCheckDue: boolean;
  statusItems: StatusItem[];
  recommendations: Recommendation[];
  month: MonthSummary;
};

export type StatusItem = {
  id: string;
  kind: 'maintenance' | 'document';
  title: string;
  icon: IconName;
  status: StatusLevel;
  detail: string;
  /** Pantalla que se abre al tocar la fila. */
  href: Href;
};

export type Recommendation = {
  id: string;
  /** Tipo, para respetar las preferencias (p. ej. ocultar las de documentos). */
  kind: 'maintenance' | 'document' | 'odometer' | 'setup';
  /** Importancia: vencido, próximo o dato importante que falta. */
  level: 'due' | 'soon' | 'nodata';
  text: string;
  /** Acción opcional; en el futuro puede incluir "Ver opciones" (Repuestos). */
  action?: { label: string; href: Href };
};

export type MonthSummary = {
  monthLabel: string;
  totalCop: number;
  /** Solo presente si hay ≥ 100 km registrados en el mes. */
  kmTraveled?: number;
  costPerKmCop?: number;
  previousMonth?: { label: string; totalCop: number };
};
