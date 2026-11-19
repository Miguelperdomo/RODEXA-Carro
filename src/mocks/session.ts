import type { AppData } from '@/features/session/types';

import { dashboardMock } from './dashboard';
import { historyMock } from './history';
import { componentsMock, documentsMock, carProfileMock, odometerMock } from './car';

/**
 * Datos de DEMOSTRACIÓN (Chevrolet Onix ficticio). SOLO desarrollo: se usan únicamente
 * si `DEMO_DATA_ENABLED` está activo (ver src/config/dev.ts). En producción nunca.
 */
export const mockAppData: AppData = {
  // Sin nombre ni ciudad inventados: se muestran como "Sin registrar".
  user: {},
  profile: carProfileMock,
  odometer: odometerMock,
  components: componentsMock,
  documents: documentsMock,
  history: historyMock,
  dashboard: dashboardMock,
};
