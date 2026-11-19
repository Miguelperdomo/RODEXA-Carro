import type {
  ComponentSummary,
  DocumentSummary,
  CarProfile,
  OdometerSummary,
} from '@/features/cars/types';

/**
 * Carro ficticio SOLO PARA DESARROLLO, compartido por todas las pantallas
 * (dashboard, Mi carro, historial, estadísticas) para que los números cuadren.
 * No son datos técnicos del modelo real. Fecha de referencia: 28/09/2026.
 */
export const carProfileMock: CarProfile = {
  id: 'car-1',
  brandCode: 'chevrolet',
  brandName: 'Chevrolet',
  modelId: 'chevrolet-onix',
  model: 'Onix',
  year: 2023,
  energySource: 'gasoline',
  displacementCc: 1000,
  // Transmisión, tracción, distribución y placa sin registrar a propósito:
  // deben verse "Sin registrar".
};

/** Lecturas de septiembre: 51.990 (31/08) → 53.240 (20/09) = 1.250 km, ~65 km/día. */
export const odometerMock: OdometerSummary = {
  registeredKm: 53240,
  lastReadingDate: '2026-09-20',
  daysSinceReading: 8,
  estimate: { kind: 'available', km: 53750, kmPerDay: 65 },
};

export const componentsMock: ComponentSummary[] = [
  {
    code: 'oil',
    title: 'Aceite',
    icon: 'oil',
    enabled: true,
    applicability: 'applies',
    status: 'soon',
    detail: 'Faltan 260 km · cambio a los 53.500 km',
    lastService: { km: 50500, date: '2026-08-10' },
    interval: { km: 3000, origin: 'user' },
    nextDueKm: 53500,
    warnMarginKm: 450,
  },
  {
    code: 'alignment',
    title: 'Alineación y balanceo',
    icon: 'alignment',
    enabled: true,
    applicability: 'applies',
    status: 'nodata',
    detail: 'Registra tu último cambio para activar el aviso',
  },
  {
    code: 'brake_check',
    title: 'Frenos',
    icon: 'brakes',
    enabled: true,
    applicability: 'applies',
    status: 'ok',
    detail: 'Próxima revisión en ~1.960 km',
    lastService: { km: 50200, date: '2026-07-18' },
    interval: { km: 5000, origin: 'user' },
    nextDueKm: 55200,
    warnMarginKm: 750,
  },
  {
    // Hay un cambio registrado, pero sin intervalo: no se inventa una vida útil.
    code: 'tires',
    title: 'Llantas',
    icon: 'tire',
    enabled: true,
    applicability: 'applies',
    status: 'nodata',
    detail: 'Llanta trasera cambiada el 01/07/2026 · sin intervalo',
    lastService: { km: 49800, date: '2026-07-01' },
  },
  {
    // Controlada por tiempo (meses), no por km.
    code: 'battery',
    title: 'Batería',
    icon: 'battery',
    enabled: true,
    applicability: 'applies',
    status: 'ok',
    detail: 'Próximo cambio en ~5 meses · 10/03/2027',
    lastService: { date: '2025-03-10' },
    interval: { months: 24, origin: 'user' },
  },
  {
    code: 'general',
    title: 'Mantenimiento general',
    icon: 'generalService',
    enabled: true,
    applicability: 'applies',
    status: 'ok',
    detail: 'Próximo en ~3.060 km',
    lastService: { km: 52300, date: '2026-09-05' },
    interval: { km: 4000, origin: 'user' },
    nextDueKm: 56300,
    warnMarginKm: 600,
  },
];

export const documentsMock: DocumentSummary[] = [
  {
    key: 'soat',
    records: 1,
    type: 'soat',
    title: 'SOAT',
    status: 'ok',
    detail: 'Vigente hasta 14/05/2027',
    expiresAt: '2027-05-14',
  },
  {
    key: 'rtm',
    records: 1,
    type: 'rtm',
    title: 'Tecnomecánica',
    status: 'soon',
    detail: 'Vence en 14 días · 12/10/2026',
    expiresAt: '2026-10-12',
  },
];
