import { capabilitiesOf, isApplicable, type CapabilityInput } from '@/features/cars/capabilities';
import { isVerifiableSource } from '@/shared/types/source';

import type { ChecklistItem, ChecklistSection } from './types';

/**
 * Revisión que hace el USUARIO antes de salir (él marca cada punto). Todo es una
 * recomendación preventiva: ningún punto se presenta como requisito legal porque no
 * hay una fuente oficial verificada (ver `legalSource`). Cada punto declara qué
 * capacidades necesita, así un eléctrico no ve "nivel de aceite" ni "combustible".
 */
export const MANUAL_SECTIONS: ChecklistSection[] = [
  {
    id: 'fluids',
    title: 'Motor y líquidos',
    icon: 'oil',
    items: [
      { id: 'engine.oil', label: 'Nivel de aceite del motor', requires: ['engine-oil'] },
      { id: 'cooling.level', label: 'Nivel de refrigerante', requires: ['engine-coolant'] },
      { id: 'brakes.fluid', label: 'Nivel de líquido de frenos' },
      { id: 'engine.washer', label: 'Líquido limpiaparabrisas' },
      { id: 'engine.leaks', label: 'Sin fugas visibles debajo del carro' },
      { id: 'engine.belts', label: 'Correas sin grietas ni ruidos', requires: ['combustion-engine'] },
    ],
  },
  {
    id: 'tires',
    title: 'Llantas',
    icon: 'tire',
    items: [
      { id: 'tires.pressure', label: 'Presión de las llantas', hint: 'La recomendada está en el manual o en la puerta del conductor.' },
      { id: 'tires.wear', label: 'Desgaste y estado de las llantas' },
      { id: 'tires.rims', label: 'Rines sin golpes' },
      { id: 'tires.spare', label: 'Llanta de repuesto o kit de reparación, según tu carro' },
    ],
  },
  {
    id: 'brakes',
    title: 'Frenos',
    icon: 'brakes',
    items: [
      { id: 'brakes.pedal', label: 'Pedal de freno firme' },
      { id: 'brakes.parking', label: 'Freno de mano o de parqueo' },
    ],
  },
  {
    id: 'visibility',
    title: 'Luces y visibilidad',
    icon: 'electric',
    items: [
      { id: 'electrical.headlight', label: 'Luces delanteras (altas y bajas)' },
      { id: 'electrical.taillight', label: 'Luces traseras y de freno' },
      { id: 'electrical.signals', label: 'Direccionales y luces de parqueo' },
      { id: 'visibility.windshield', label: 'Parabrisas sin golpes que tapen la vista' },
      { id: 'controls.wipers', label: 'Plumillas limpiaparabrisas' },
      { id: 'controls.mirrors', label: 'Espejos bien ajustados' },
    ],
  },
  {
    id: 'safety',
    title: 'Seguridad en la cabina',
    icon: 'insurance',
    items: [
      { id: 'controls.seatbelts', label: 'Cinturones de seguridad' },
      { id: 'electrical.horn', label: 'Pito' },
      { id: 'electrical.dashboard', label: 'Sin testigos de alerta encendidos en el tablero' },
    ],
  },
  {
    id: 'energy',
    title: 'Energía para el trayecto',
    icon: 'fuel',
    items: [
      { id: 'road.fuel', label: 'Combustible suficiente para el trayecto', requires: ['liquid-fuel'] },
      { id: 'road.cng', label: 'Carga de GNC para el trayecto', requires: ['cng'] },
      { id: 'road.charge', label: 'Carga de la batería para el trayecto', requires: ['external-charging'] },
      { id: 'road.cable', label: 'Cable o cargador, si lo vas a necesitar', requires: ['external-charging'] },
      { id: 'battery.general', label: 'Batería de 12 V sin fallas al arrancar', requires: ['battery-12v'] },
    ],
  },
  {
    id: 'gear',
    title: 'Equipo de carretera',
    icon: 'maintenance',
    reminder: 'Lleva',
    items: [
      { id: 'gear.jack', label: 'Gato y llave de pernos' },
      { id: 'gear.triangles', label: 'Señales de carretera (triángulos)' },
      { id: 'gear.extinguisher', label: 'Extintor' },
      { id: 'gear.firstaid', label: 'Botiquín' },
      { id: 'gear.chocks', label: 'Tacos para bloquear las llantas' },
      { id: 'gear.vest', label: 'Chaleco reflectivo' },
      { id: 'gear.flashlight', label: 'Linterna' },
      { id: 'road.tools', label: 'Herramienta básica' },
      { id: 'road.cables', label: 'Cables para pasar corriente', requires: ['battery-12v'] },
    ],
  },
  {
    id: 'road',
    title: 'Para el camino',
    icon: 'usageTravel',
    reminder: 'Ten listo',
    items: [
      { id: 'road.phone', label: 'Celular cargado' },
      { id: 'road.water', label: 'Agua' },
    ],
  },
];

/** Secciones para este vehículo: sin los puntos que no le aplican (se oculta solo lo confirmado). */
export function manualSectionsFor(profile: CapabilityInput): ChecklistSection[] {
  const caps = capabilitiesOf(profile);
  return MANUAL_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isApplicable(caps, item.requires ?? [])),
  })).filter((section) => section.items.length > 0);
}

/** "Requisito legal" solo con fuente verificable; si no, "Recomendado". */
export function itemKind(item: ChecklistItem): 'legal' | 'recommended' {
  return isVerifiableSource(item.legalSource) ? 'legal' : 'recommended';
}
