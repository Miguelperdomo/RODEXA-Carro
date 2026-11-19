import { applicabilityOf, type Applicability } from '@/features/maintenance/applicability';
import type { IconName } from '@/shared/ui';

import type { Capabilities, CapabilityId } from './capabilities';
import type { ComponentCode } from './types';

export type ComponentMeta = {
  code: ComponentCode;
  title: string;
  icon: IconName;
  requires?: readonly CapabilityId[];
  dependsOnModel?: boolean;
};

/** Los componentes que puede mostrar "Mi carro", en su orden. Cuáles aparecen depende del vehículo. */
export const COMPONENTS: ComponentMeta[] = [
  { code: 'oil', title: 'Aceite de motor', icon: 'oil', requires: ['engine-oil'] },
  { code: 'alignment', title: 'Alineación y balanceo', icon: 'alignment' },
  { code: 'brake_check', title: 'Frenos', icon: 'brakes' },
  { code: 'tires', title: 'Llantas', icon: 'tire' },
  { code: 'battery', title: 'Batería de 12 V', icon: 'battery', requires: ['battery-12v'] },
  { code: 'hybrid_system', title: 'Sistema híbrido o eléctrico', icon: 'evSystem', requires: ['electric-drive'] },
  { code: 'general', title: 'Mantenimiento general', icon: 'generalService' },
];

/**
 * Filas fijas del dashboard (no se pueden desactivar), SOLO si aplican con certeza
 * al vehículo: un eléctrico no tiene "Aceite de motor" fijo; con la energía sin
 * confirmar tampoco se presenta como obligatorio.
 */
const CORE_CANDIDATES: ComponentCode[] = ['oil', 'alignment'];

/** Componentes que se controlan por meses en vez de km. */
export const TIME_BASED_COMPONENTS: ComponentCode[] = ['battery'];

export type ComponentForVehicle = ComponentMeta & { applicability: Exclude<Applicability, 'not_applicable'> };

/** Componentes de este vehículo (sin los que no aplican). */
export function componentsFor(caps: Capabilities): ComponentForVehicle[] {
  return COMPONENTS.flatMap((meta) => {
    const applicability = applicabilityOf(meta, caps);
    return applicability === 'not_applicable' ? [] : [{ ...meta, applicability }];
  });
}

export function coreComponentsFor(caps: Capabilities): ComponentCode[] {
  return CORE_CANDIDATES.filter((code) => {
    const meta = COMPONENTS.find((c) => c.code === code);
    return meta !== undefined && applicabilityOf(meta, caps) === 'applies';
  });
}
