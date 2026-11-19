import type { CapabilityId } from '@/features/cars/capabilities';
import type { IconName } from '@/shared/ui';

/**
 * Componentes que RODEXA Carro controla en "Estado de mi carro"
 * (tabla `service_types` / `service_plans`, docs/diseno-funcional.md §7).
 */
export type ComponentCode =
  | 'oil'
  | 'alignment'
  | 'brake_check'
  | 'tires'
  | 'battery'
  | 'general'
  | 'hybrid_system';

export type MaintenanceCategoryCode =
  | 'engine'
  | 'transmission'
  | 'brakes'
  | 'suspension'
  | 'tires'
  | 'electrical'
  | 'ev'
  | 'climate'
  | 'cooling'
  | 'general';

/**
 * Aplicabilidad como DATOS (ver applicability.ts):
 * - `requires`: capacidades que debe tener el vehículo. Si alguna es "no", el ítem
 *   no aparece; si alguna es "unknown", aparece como "Depende de tu carro".
 * - `dependsOnModel`: aunque se cumplan las capacidades, no todos los carros lo
 *   tienen (p. ej. frenos de tambor, diferencial con aceite propio). Nunca se
 *   presenta como que aplica con certeza.
 */
export type CatalogItem = {
  code: string;
  label: string;
  /** Componente controlado que este mantenimiento pone "Al día". */
  tracks?: ComponentCode;
  requires?: readonly CapabilityId[];
  dependsOnModel?: boolean;
  /**
   * Explicación MUY corta, en palabras sencillas, de QUÉ es (no cada cuánto ni cuánto
   * cuesta). Solo para nombres técnicos; se ve al tocar el ⓘ de su categoría.
   */
  hint?: string;
};

type CatalogCategory = {
  code: MaintenanceCategoryCode;
  label: string;
  icon: IconName;
  /** El usuario puede marcar que su carro no tiene este sistema. */
  canBeNotApplicable?: boolean;
  items: readonly CatalogItem[];
};

/**
 * Catálogo de mantenimientos (`maintenance_items.item_code`), agrupado por categoría.
 * Los códigos ya guardados en registros se conservan (solo pueden cambiar sus textos).
 * Aquí NO hay intervalos: los pone el usuario o una fuente verificable (intervals.ts).
 */
export const MAINTENANCE_CATEGORIES = [
  {
    code: 'engine',
    label: 'Motor',
    icon: 'generalService',
    items: [
      { code: 'oil', label: 'Aceite de motor', tracks: 'oil', requires: ['engine-oil'] },
      { code: 'oil_filter', label: 'Filtro de aceite', requires: ['engine-oil'], hint: 'Retiene la suciedad del aceite del motor.' },
      { code: 'air_filter', label: 'Filtro de aire del motor', requires: ['combustion-engine'], hint: 'Retiene el polvo del aire que entra al motor.' },
      { code: 'fuel_filter', label: 'Filtro de combustible', requires: ['liquid-fuel'], hint: 'Retiene la suciedad del combustible antes de que llegue al motor.' },
      { code: 'spark_plug', label: 'Bujías', requires: ['spark-plugs'], hint: 'Producen la chispa que enciende el combustible dentro del motor.' },
      { code: 'glow_plugs', label: 'Bujías de precalentamiento', requires: ['compression-ignition-engine'], hint: 'Calientan el interior del motor diésel para ayudarlo a encender en frío.' },
      { code: 'timing_belt', label: 'Correa de distribución', requires: ['timing-belt'], hint: 'Correa interna que coordina el movimiento de las piezas del motor. También le dicen correa de repartición o de tiempo.' },
      { code: 'timing_chain', label: 'Cadena de distribución', requires: ['timing-chain'], hint: 'Cumple la misma función que la correa de distribución, pero es una cadena de metal.' },
      { code: 'accessory_belt', label: 'Correa de accesorios', requires: ['combustion-engine'], hint: 'Correa externa que mueve piezas como el alternador o el compresor del aire acondicionado.' },
      { code: 'valve_adjustment', label: 'Ajuste de válvulas', requires: ['combustion-engine'], hint: 'Calibrar las válvulas que dejan entrar el aire y salir los gases del motor.' },
      { code: 'tune_up', label: 'Sincronización', requires: ['combustion-engine'], hint: 'Así se le dice en Colombia a la puesta a punto del motor; lo que incluye depende del taller.' },
      { code: 'throttle_body_cleaning', label: 'Limpieza de cuerpo de aceleración', requires: ['combustion-engine'], hint: 'Limpiar la pieza que regula cuánto aire entra al motor.' },
      { code: 'injector_cleaning', label: 'Limpieza de inyectores', requires: ['combustion-engine'], hint: 'Limpiar las piezas que rocían el combustible dentro del motor.' },
      { code: 'adblue', label: 'AdBlue / DEF', requires: ['adblue'], hint: 'Líquido que usan algunos motores diésel para reducir las emisiones.' },
      { code: 'cng_system', label: 'Revisión del sistema de GNC', requires: ['cng'] },
      { code: 'exhaust', label: 'Sistema de escape', requires: ['exhaust-system'], hint: 'Los tubos y el silenciador por donde salen los gases del motor.' },
      { code: 'engine_service', label: 'Mantenimiento de motor', requires: ['combustion-engine'] },
    ],
  },
  {
    code: 'transmission',
    label: 'Transmisión',
    icon: 'transmission',
    items: [
      { code: 'transmission_oil', label: 'Aceite de caja manual', requires: ['manual-transmission'] },
      { code: 'clutch', label: 'Embrague', requires: ['manual-transmission'], hint: 'Conecta y desconecta el motor de la caja cuando pisas el pedal de la izquierda.' },
      { code: 'atf', label: 'Fluido de transmisión automática (ATF)', requires: ['automatic-transmission'], hint: 'Líquido que lubrica y hace funcionar la caja automática.' },
      { code: 'cvt_fluid', label: 'Fluido de transmisión CVT', requires: ['cvt'], hint: 'Líquido especial para las cajas automáticas tipo CVT.' },
      { code: 'dct_fluid', label: 'Fluido de transmisión de doble embrague', requires: ['dct'], hint: 'Líquido especial para las cajas automáticas de doble embrague.' },
      { code: 'transmission_filter', label: 'Filtro de transmisión', requires: ['transmission-fluid'], dependsOnModel: true, hint: 'Retiene la suciedad del líquido de la caja automática.' },
      { code: 'differential_oil', label: 'Aceite de diferencial', dependsOnModel: true, hint: 'Lubrica el diferencial, la pieza que deja girar las ruedas a distinta velocidad en las curvas.' },
      { code: 'transfer_case_oil', label: 'Aceite de caja de transferencia', requires: ['four-wheel-drive'], dependsOnModel: true, hint: 'Lubrica la pieza que reparte la fuerza entre los ejes en los carros 4x4.' },
      { code: 'transmission', label: 'Revisión de caja o transmisión' },
    ],
  },
  {
    code: 'brakes',
    label: 'Frenos',
    icon: 'brakes',
    items: [
      { code: 'brake_pads_front', label: 'Pastillas delanteras', tracks: 'brake_check', hint: 'Piezas que aprietan el disco para frenar.' },
      { code: 'brake_pads_rear', label: 'Pastillas traseras', tracks: 'brake_check', dependsOnModel: true, hint: 'Piezas que aprietan el disco para frenar.' },
      { code: 'brake_shoes', label: 'Bandas / tambores', tracks: 'brake_check', dependsOnModel: true, hint: 'Freno de tambor: las bandas aprietan el tambor por dentro para frenar.' },
      { code: 'brake_disc_front', label: 'Discos delanteros', tracks: 'brake_check', hint: 'Disco de metal que gira con la rueda; las pastillas lo aprietan para frenar.' },
      { code: 'brake_disc_rear', label: 'Discos traseros', tracks: 'brake_check', dependsOnModel: true, hint: 'Disco de metal que gira con la rueda; las pastillas lo aprietan para frenar.' },
      { code: 'brake_fluid', label: 'Líquido de frenos', tracks: 'brake_check', hint: 'Líquido que lleva la fuerza del pedal a los frenos.' },
      { code: 'brake_bleed', label: 'Purga de frenos', tracks: 'brake_check', hint: 'Sacar el aire que haya quedado dentro del sistema de frenos.' },
      { code: 'abs_check', label: 'Revisión del sistema ABS', tracks: 'brake_check', dependsOnModel: true, hint: 'El ABS evita que las ruedas se bloqueen en un frenazo.' },
      { code: 'brake_check', label: 'Mantenimiento del sistema de frenos', tracks: 'brake_check' },
    ],
  },
  {
    code: 'suspension',
    label: 'Suspensión y dirección',
    icon: 'suspension',
    items: [
      { code: 'wheel_alignment', label: 'Alineación', tracks: 'alignment', hint: 'Ajustar el ángulo de las ruedas para que el carro vaya derecho.' },
      { code: 'wheel_balancing', label: 'Balanceo', tracks: 'alignment', hint: 'Equilibrar cada rueda con pequeños contrapesos para que no vibre al girar.' },
      { code: 'front_suspension', label: 'Amortiguadores delanteros', hint: 'Absorben los golpes del camino para que el carro no rebote.' },
      { code: 'rear_shock', label: 'Amortiguadores traseros', hint: 'Absorben los golpes del camino para que el carro no rebote.' },
      { code: 'springs', label: 'Resortes' },
      { code: 'bushings', label: 'Bujes', hint: 'Piezas de caucho que unen partes de la suspensión y reducen golpes y ruidos.' },
      { code: 'ball_joints', label: 'Rótulas', hint: 'Uniones que dejan mover la rueda hacia arriba, hacia abajo y al girar.' },
      { code: 'tie_rod_ends', label: 'Terminales de dirección', hint: 'Extremos de la dirección que conectan el timón con las ruedas.' },
      { code: 'steering', label: 'Revisión de la dirección' },
      { code: 'power_steering_fluid', label: 'Aceite de dirección hidráulica', dependsOnModel: true, hint: 'Líquido que ayuda a mover el timón con poca fuerza.' },
      { code: 'wheel_bearings', label: 'Rodamientos de rueda', hint: 'Piezas que dejan girar la rueda suavemente sobre su eje.' },
    ],
  },
  {
    code: 'tires',
    label: 'Llantas',
    icon: 'tire',
    items: [
      { code: 'tire_front', label: 'Llantas delanteras', tracks: 'tires' },
      { code: 'tire_rear', label: 'Llantas traseras', tracks: 'tires' },
      { code: 'tire_rotation', label: 'Rotación de llantas', hint: 'Cambiar las llantas de posición para que se gasten parejo.' },
      { code: 'tire_inspection', label: 'Revisión de presión y desgaste' },
      { code: 'puncture_repair', label: 'Reparación de pinchazo' },
      { code: 'spare_tire', label: 'Llanta de repuesto', dependsOnModel: true },
    ],
  },
  {
    code: 'electrical',
    label: 'Sistema eléctrico',
    icon: 'electric',
    items: [
      { code: 'battery', label: 'Batería de 12 V', tracks: 'battery', requires: ['battery-12v'] },
      { code: 'charging_system', label: 'Sistema de carga de 12 V', requires: ['battery-12v'], hint: 'El alternador, la batería y sus conexiones, que mantienen cargada la batería.' },
      { code: 'alternator', label: 'Alternador', requires: ['combustion-engine'], hint: 'Genera electricidad con el motor encendido y recarga la batería.' },
      { code: 'starter_motor', label: 'Motor de arranque', requires: ['combustion-engine'], hint: 'Hace girar el motor para encenderlo.' },
      { code: 'headlight_bulb', label: 'Luces (farolas y bombillos)' },
      { code: 'turn_signals', label: 'Direccionales' },
      { code: 'horn', label: 'Pito / claxon' },
      { code: 'fuses', label: 'Fusibles', hint: 'Protegen los circuitos eléctricos: se queman para evitar daños mayores.' },
      { code: 'wiring', label: 'Cableado / conexiones' },
    ],
  },
  {
    code: 'ev',
    label: 'Sistema híbrido o eléctrico',
    icon: 'evSystem',
    items: [
      { code: 'traction_battery', label: 'Revisión de la batería de tracción', tracks: 'hybrid_system', requires: ['traction-battery'], hint: 'La batería grande que mueve el carro eléctrico o híbrido (no es la de 12 V).' },
      { code: 'hybrid_system_check', label: 'Revisión del sistema híbrido / eléctrico', tracks: 'hybrid_system', requires: ['electric-drive'] },
      { code: 'battery_cooling', label: 'Refrigeración de la batería', requires: ['traction-battery'], dependsOnModel: true, hint: 'Mantiene la batería de tracción a buena temperatura.' },
      { code: 'charge_port', label: 'Puerto de carga', requires: ['external-charging'] },
      { code: 'charging_cable', label: 'Cable o cargador portátil', requires: ['external-charging'] },
    ],
  },
  {
    code: 'climate',
    label: 'Aire acondicionado y limpiaparabrisas',
    icon: 'climate',
    items: [
      { code: 'air_conditioning', label: 'Sistema de aire acondicionado' },
      { code: 'cabin_filter', label: 'Filtro de habitáculo (cabina)', hint: 'Filtra el aire que entra a la cabina por las rejillas.' },
      { code: 'wipers', label: 'Plumillas limpiaparabrisas' },
      { code: 'washer_fluid', label: 'Líquido limpiaparabrisas' },
    ],
  },
  {
    code: 'cooling',
    label: 'Refrigeración del motor',
    icon: 'cooling',
    canBeNotApplicable: true,
    items: [
      { code: 'coolant', label: 'Nivel de refrigerante', requires: ['engine-coolant'], hint: 'Líquido que evita que el motor se recaliente.' },
      { code: 'coolant_change', label: 'Cambio de refrigerante', requires: ['engine-coolant'], hint: 'Cambiar el líquido que evita que el motor se recaliente.' },
      { code: 'radiator', label: 'Radiador', requires: ['engine-coolant'], hint: 'Enfría el refrigerante con el aire que pasa por él.' },
      { code: 'cooling_service', label: 'Mantenimiento del sistema de refrigeración', requires: ['engine-coolant'] },
    ],
  },
  {
    // "General" no depende del tipo de vehículo: sirve a todos (incluye eléctricos).
    code: 'general',
    label: 'General',
    icon: 'maintenance',
    items: [{ code: 'general', label: 'Revisión general periódica', tracks: 'general' }],
  },
] as const satisfies readonly CatalogCategory[];

/** "Otro" siempre va aparte, al final, y exige describir qué se hizo. */
export const OTHER_MAINTENANCE = { code: 'other', label: 'Otro' } as const;

/**
 * Texto del ⓘ de una categoría: "Nombre: explicación", una por párrafo, solo de los ítems
 * que tienen explicación. Sin ninguna → undefined (no se muestra el ⓘ).
 */
export function maintenanceHintsText(items: readonly Pick<CatalogItem, 'label' | 'hint'>[]): string | undefined {
  const lines = items.flatMap((item) => (item.hint ? [`${item.label}: ${item.hint}`] : []));
  return lines.length > 0 ? lines.join('\n\n') : undefined;
}

export type MaintenanceItemCode =
  | (typeof MAINTENANCE_CATEGORIES)[number]['items'][number]['code']
  | typeof OTHER_MAINTENANCE.code;

export type MaintenanceItem = CatalogItem & {
  code: MaintenanceItemCode;
  category?: MaintenanceCategoryCode;
};

/** Lista plana de todos los mantenimientos (incluye "Otro" al final). */
export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  ...MAINTENANCE_CATEGORIES.flatMap((category) =>
    category.items.map((item): MaintenanceItem => ({ ...item, category: category.code })),
  ),
  OTHER_MAINTENANCE,
];

export function findMaintenanceItem(code: string): MaintenanceItem | undefined {
  return MAINTENANCE_ITEMS.find((item) => item.code === code);
}

export function maintenanceLabel(code: MaintenanceItemCode): string {
  return findMaintenanceItem(code)?.label ?? 'Mantenimiento';
}

/** Categoría que contiene los mantenimientos que ponen al día un componente. */
export function categoryForComponent(code: ComponentCode): MaintenanceCategoryCode | undefined {
  return MAINTENANCE_ITEMS.find((item) => item.tracks === code)?.category;
}
