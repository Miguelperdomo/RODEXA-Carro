import type { IconName } from '@/shared/ui';

/**
 * "Me quedé varado": consejos de seguridad generales y no técnicos (aprobados). Sin pasos
 * mecánicos ni afirmaciones legales. Cada guía sugiere los servicios de la ciudad (grúa,
 * mecánico a domicilio) y llamar al 123 si hay riesgo.
 */
export type RoadsideGuide = {
  key: 'flat' | 'battery' | 'overheat' | 'fuel' | 'warning';
  icon: IconName;
  title: string;
  steps: string[];
  /** Qué servicio buscar en el directorio. */
  search: string;
};

export const ROADSIDE_GUIDES: RoadsideGuide[] = [
  {
    key: 'flat',
    icon: 'tire',
    title: 'Pinchazo',
    steps: [
      'Enciende las luces de parqueo y orilla el carro en un lugar plano y seguro, fuera de la vía si puedes.',
      'Pon las señales de carretera detrás del carro.',
      'Si no sabes cambiar la llanta o el lugar es peligroso, no lo intentes: pide ayuda.',
    ],
    search: 'llantas',
  },
  {
    key: 'battery',
    icon: 'battery',
    title: 'El carro no prende (batería)',
    steps: [
      'Revisa que no hayas dejado luces encendidas.',
      'Si alguien te ayuda con cables, sigan el manual de tu carro.',
      'Si no estás seguro, llama a un servicio de batería a domicilio.',
    ],
    search: 'batería',
  },
  {
    key: 'overheat',
    icon: 'cooling',
    title: 'Se recalentó',
    steps: [
      'Detente en un lugar seguro y apaga el motor.',
      'No abras la tapa del radiador con el motor caliente: puede quemarte.',
      'Espera a que se enfríe y pide ayuda a un mecánico.',
    ],
    search: 'mecánico',
  },
  {
    key: 'fuel',
    icon: 'fuel',
    title: 'Me quedé sin combustible',
    steps: [
      'Orilla con luces de parqueo y señales.',
      'No dejes a nadie dentro del carro en una vía rápida.',
      'Pide ayuda o una grúa.',
    ],
    search: 'grúa',
  },
  {
    key: 'warning',
    icon: 'warning',
    title: 'Un ruido o una luz roja en el tablero',
    steps: [
      'Si se enciende una luz roja, detente cuando sea seguro y consulta el manual.',
      'No sigas manejando si el carro pierde frenos o dirección: llama a una grúa.',
    ],
    search: 'grúa',
  },
];

export const findGuide = (key: string | undefined) => ROADSIDE_GUIDES.find((g) => g.key === key);
