import type { DashboardData } from '@/features/dashboard/types';

import { carProfileMock, odometerMock } from './car';

/**
 * Datos ficticios para visualizar el dashboard. Son coherentes con las reglas
 * de docs/diseno-funcional.md, como si ya se hubieran calculado:
 * - Km registrado hace 8 días → aparece la confirmación semanal.
 * - Aceite: último cambio 50.500 km + intervalo 3.000 = 53.500; faltan 260 km
 *   (margen de aviso 15 % = 450 km) → Próximo. El estimado (~53.750) ya lo
 *   superaría, pero NO cambia el color: solo genera una recomendación suave.
 * - Tecnomecánica vence en 14 días → Por vencer.
 */
export const dashboardMock: DashboardData = {
  car: {
    name: `${carProfileMock.brandName} ${carProfileMock.model}`,
    subtitle: `Mi carro · ${carProfileMock.year}`,
  },
  odometer: odometerMock,
  weeklyCheckDue: true,
  statusItems: [
    {
      id: 'oil',
      kind: 'maintenance',
      title: 'Aceite',
      icon: 'oil',
      status: 'soon',
      detail: 'Faltan 260 km · cambio a los 53.500 km',
      href: { pathname: '/mi-carro/componente/[code]', params: { code: 'oil' } },
    },
    {
      id: 'rtm',
      kind: 'document',
      title: 'Tecnomecánica',
      icon: 'document',
      status: 'soon',
      detail: 'Vence en 14 días · 12/10/2026',
      href: { pathname: '/registrar/documento', params: { tipo: 'rtm' } },
    },
    {
      id: 'alignment',
      kind: 'maintenance',
      title: 'Alineación y balanceo',
      icon: 'alignment',
      status: 'nodata',
      detail: 'Registra tu último cambio para activar el aviso',
      href: { pathname: '/mi-carro/componente/[code]', params: { code: 'alignment' } },
    },
    {
      id: 'soat',
      kind: 'document',
      title: 'SOAT',
      icon: 'document',
      status: 'ok',
      detail: 'Vigente hasta 14/05/2027',
      href: { pathname: '/registrar/documento', params: { tipo: 'soat' } },
    },
  ],
  recommendations: [
    {
      id: 'rtm-soon',
      kind: 'document',
      level: 'soon',
      text: 'Tu tecnomecánica vence en 14 días (12/10/2026).',
      action: {
        label: 'Actualizar documento',
        href: { pathname: '/registrar/documento', params: { tipo: 'rtm' } },
      },
    },
    {
      id: 'oil-soon',
      kind: 'maintenance',
      level: 'soon',
      text: 'Según tu último registro, revisa el aceite aproximadamente en 260 km.',
      action: {
        label: 'Registrar cambio',
        href: { pathname: '/registrar/mantenimiento', params: { tipo: 'oil' } },
      },
    },
    {
      id: 'oil-estimate',
      kind: 'odometer',
      level: 'soon',
      text: 'Según tu ritmo (~65 km/día), podrías haber llegado ya al cambio de aceite. Actualiza tu kilometraje para confirmarlo.',
      action: { label: 'Actualizar km', href: '/registrar/kilometraje' },
    },
  ],
  month: {
    monthLabel: 'Septiembre',
    totalCop: 384500,
    kmTraveled: 1250,
    costPerKmCop: 308,
    previousMonth: { label: 'agosto', totalCop: 412000 },
  },
};
