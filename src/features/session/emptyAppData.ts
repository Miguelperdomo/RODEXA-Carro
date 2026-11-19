import { formatMonthYear, toISODate } from '@/shared/utils/date';

import type { AppData } from './types';

/**
 * Datos de la app ANTES del primer ingreso: vacíos. Nunca se finge que el usuario ya
 * registró algo (en producción no hay carro ficticio, ni historial, ni estadísticas).
 */
export function emptyAppData(today: Date): AppData {
  const odometer = {
    registeredKm: 0,
    lastReadingDate: toISODate(today),
    daysSinceReading: 0,
    estimate: { kind: 'insufficient' as const },
  };
  const month = formatMonthYear(today).split(' ')[0];
  return {
    user: {},
    profile: { id: 'car-1', brandCode: '', brandName: '', model: '' },
    odometer,
    components: [],
    documents: [],
    history: [],
    dashboard: {
      car: { name: '', subtitle: 'Mi carro' },
      odometer,
      weeklyCheckDue: false,
      statusItems: [],
      recommendations: [],
      month: { monthLabel: month.charAt(0).toUpperCase() + month.slice(1), totalCop: 0 },
    },
  };
}
