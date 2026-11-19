import { capabilitiesOf, type CapabilityInput } from '@/features/cars/capabilities';
import { componentsFor, coreComponentsFor } from '@/features/cars/catalog';
import type { EnergySource } from '@/features/cars/types';

import { applicableCategories, applicabilityOf, isItemVisible, type Applicability } from '../applicability';
import { findMaintenanceItem } from '../catalog';

/** Código → aplicabilidad para un vehículo ("not_applicable" si no aparece). */
function catalogFor(profile: CapabilityInput): Record<string, Applicability> {
  const map: Record<string, Applicability> = {};
  for (const category of applicableCategories(capabilitiesOf(profile))) {
    for (const { item, applicability } of category.items) map[item.code] = applicability;
  }
  return new Proxy(map, { get: (target, code: string) => target[code] ?? 'not_applicable' });
}
const energy = (energySource: EnergySource) => catalogFor({ energySource });

/** Exclusivos del motor de combustión: nunca deben verse en un eléctrico. */
const COMBUSTION_ONLY = [
  'oil',
  'oil_filter',
  'air_filter',
  'fuel_filter',
  'spark_plug',
  'glow_plugs',
  'timing_belt',
  'timing_chain',
  'accessory_belt',
  'valve_adjustment',
  'tune_up',
  'injector_cleaning',
  'throttle_body_cleaning',
  'exhaust',
  'engine_service',
  'alternator',
  'starter_motor',
  'transmission_oil',
  'clutch',
  'atf',
  'cvt_fluid',
  'dct_fluid',
];

describe('1. gasolina', () => {
  const c = energy('gasoline');
  it('muestra los mantenimientos del motor de chispa', () => {
    for (const code of ['oil', 'oil_filter', 'air_filter', 'fuel_filter', 'spark_plug', 'exhaust']) {
      expect(c[code]).toBe('applies');
    }
  });
  it('no muestra lo de diésel, GNC ni del sistema eléctrico', () => {
    for (const code of ['glow_plugs', 'adblue', 'cng_system', 'traction_battery', 'charge_port', 'charging_cable']) {
      expect(c[code]).toBe('not_applicable');
    }
  });
});

describe('2. diésel', () => {
  const c = energy('diesel');
  it('bujías de precalentamiento sí, bujías de chispa no', () => {
    expect(c.glow_plugs).toBe('applies');
    expect(c.spark_plug).toBe('not_applicable');
    expect(c.oil).toBe('applies');
  });
  it('AdBlue depende del modelo: se muestra pero no con certeza', () => {
    expect(c.adblue).toBe('maybe');
  });
});

describe('3. HEV gasolina', () => {
  const c = energy('hybrid_gasoline');
  it('combina motor de chispa + sistema híbrido, sin carga externa', () => {
    expect(c.oil).toBe('applies');
    expect(c.spark_plug).toBe('applies');
    expect(c.traction_battery).toBe('applies');
    expect(c.hybrid_system_check).toBe('applies');
    expect(c.charge_port).toBe('not_applicable');
    expect(c.charging_cable).toBe('not_applicable');
  });
});

describe('4. HEV diésel', () => {
  const c = energy('hybrid_diesel');
  it('combina motor diésel + sistema híbrido, sin carga externa', () => {
    expect(c.oil).toBe('applies');
    expect(c.glow_plugs).toBe('applies');
    expect(c.spark_plug).toBe('not_applicable');
    expect(c.traction_battery).toBe('applies');
    expect(c.charge_port).toBe('not_applicable');
  });
});

describe('5. PHEV gasolina', () => {
  const c = energy('phev_gasoline');
  it('motor de chispa + batería de tracción + carga desde la red', () => {
    expect(c.oil).toBe('applies');
    expect(c.spark_plug).toBe('applies');
    expect(c.traction_battery).toBe('applies');
    expect(c.charge_port).toBe('applies');
    expect(c.charging_cable).toBe('applies');
  });
});

describe('6. PHEV diésel', () => {
  const c = energy('phev_diesel');
  it('motor diésel + batería de tracción + carga desde la red', () => {
    expect(c.oil).toBe('applies');
    expect(c.glow_plugs).toBe('applies');
    expect(c.spark_plug).toBe('not_applicable');
    expect(c.charge_port).toBe('applies');
  });
});

describe('7. eléctrico', () => {
  const c = energy('electric');
  it('muestra lo que un eléctrico sí tiene', () => {
    for (const code of ['traction_battery', 'charge_port', 'charging_cable', 'brake_pads_front', 'wheel_alignment', 'cabin_filter', 'general']) {
      expect(c[code]).toBe('applies');
    }
  });
  it('batería de 12 V y refrigerante dependen del modelo (no se afirman)', () => {
    expect(c.battery).toBe('maybe');
    expect(c.coolant).toBe('maybe');
  });
});

describe('8. GNC', () => {
  const c = energy('cng');
  it('revisión del sistema de GNC y motor de chispa; sin carga eléctrica', () => {
    expect(c.cng_system).toBe('applies');
    expect(c.spark_plug).toBe('applies');
    expect(c.oil).toBe('applies');
    expect(c.charge_port).toBe('not_applicable');
  });
  it('filtro de combustible líquido depende (suele ser conversión dual)', () => {
    expect(c.fuel_filter).toBe('maybe');
  });
});

describe('8b. GNC + gasolina (dual)', () => {
  const c = energy('cng_gasoline');
  it('revisión de GNC y filtro de combustible líquido aplican con certeza', () => {
    expect(c.cng_system).toBe('applies');
    expect(c.fuel_filter).toBe('applies');
    expect(c.spark_plug).toBe('applies');
    expect(c.charge_port).toBe('not_applicable');
  });
});

describe('9. capacidades desconocidas', () => {
  const c = catalogFor({ energySource: 'unknown' });
  it('lo que depende de la energía se muestra como "maybe", nunca como que aplica con certeza', () => {
    for (const code of ['oil', 'spark_plug', 'glow_plugs', 'traction_battery', 'charge_port', 'cng_system']) {
      expect(c[code]).toBe('maybe');
    }
  });
  it('lo que no depende del vehículo sí aplica (frenos, alineación)', () => {
    expect(c.brake_pads_front).toBe('applies');
    expect(c.wheel_alignment).toBe('applies');
  });
  it('sin transmisión confirmada, ATF / CVT / caja manual quedan "maybe"', () => {
    const t = catalogFor({ energySource: 'gasoline' });
    expect(t.atf).toBe('maybe');
    expect(t.cvt_fluid).toBe('maybe');
    expect(t.transmission_oil).toBe('maybe');
  });
  it('un aceite de motor sin energía confirmada no es fila fija ni obligatoria', () => {
    expect(coreComponentsFor(capabilitiesOf({ energySource: 'unknown' }))).toEqual(['alignment']);
    const oil = componentsFor(capabilitiesOf({ energySource: 'unknown' })).find((m) => m.code === 'oil');
    expect(oil?.applicability).toBe('maybe');
  });
});

describe('10. un eléctrico no muestra mantenimientos exclusivos de combustión', () => {
  it('ninguno aparece en el catálogo', () => {
    const c = energy('electric');
    for (const code of COMBUSTION_ONLY) expect(c[code]).toBe('not_applicable');
  });
  it('tampoco como componente controlado ni fila fija', () => {
    const caps = capabilitiesOf({ energySource: 'electric' });
    expect(componentsFor(caps).map((m) => m.code)).not.toContain('oil');
    expect(coreComponentsFor(caps)).not.toContain('oil');
  });
  it('isItemVisible respeta la misma regla', () => {
    expect(isItemVisible('oil', capabilitiesOf({ energySource: 'electric' }))).toBe(false);
    expect(isItemVisible('other', capabilitiesOf({ energySource: 'electric' }))).toBe(true);
  });
});

describe('11. un híbrido muestra lo de ambos sistemas', () => {
  it('HEV y PHEV: aceite + batería de tracción como componentes', () => {
    for (const energySource of ['hybrid_gasoline', 'phev_gasoline'] as const) {
      const codes = componentsFor(capabilitiesOf({ energySource })).map((m) => m.code);
      expect(codes).toEqual(expect.arrayContaining(['oil', 'battery', 'hybrid_system']));
    }
  });
  it('gasolina no tiene componente de sistema híbrido', () => {
    const codes = componentsFor(capabilitiesOf({ energySource: 'gasoline' })).map((m) => m.code);
    expect(codes).not.toContain('hybrid_system');
  });
});

describe('transmisión, distribución y dependencias del modelo', () => {
  it('manual: embrague y aceite de caja; no ATF ni CVT', () => {
    const c = catalogFor({ energySource: 'gasoline', transmission: 'manual' });
    expect(c.clutch).toBe('applies');
    expect(c.transmission_oil).toBe('applies');
    expect(c.atf).toBe('not_applicable');
    expect(c.cvt_fluid).toBe('not_applicable');
  });
  it('automática: ATF; CVT: fluido CVT', () => {
    expect(catalogFor({ energySource: 'gasoline', transmission: 'automatic' }).atf).toBe('applies');
    const cvt = catalogFor({ energySource: 'gasoline', transmission: 'cvt' });
    expect(cvt.cvt_fluid).toBe('applies');
    expect(cvt.clutch).toBe('not_applicable');
  });
  it('correa o cadena según lo indicado', () => {
    const belt = catalogFor({ energySource: 'gasoline', timingSystem: 'belt' });
    expect(belt.timing_belt).toBe('applies');
    expect(belt.timing_chain).toBe('not_applicable');
  });
  it('lo que depende del modelo nunca "aplica con certeza" (tambores, diferencial, 4x4)', () => {
    const c = catalogFor({ energySource: 'gasoline', drivetrain: '4x4' });
    expect(c.brake_shoes).toBe('maybe');
    expect(c.differential_oil).toBe('maybe');
    expect(c.transfer_case_oil).toBe('maybe');
    expect(catalogFor({ energySource: 'gasoline', drivetrain: '4x2' }).transfer_case_oil).toBe('not_applicable');
  });
  it('al corregir un registro viejo se conserva un ítem que hoy no aplica', () => {
    const categories = applicableCategories(capabilitiesOf({ energySource: 'electric' }), ['oil']);
    const codes = categories.flatMap((c) => c.items.map((i) => i.item.code));
    expect(codes).toContain('oil');
  });
  it('applicabilityOf sin requisitos = aplica', () => {
    expect(applicabilityOf(findMaintenanceItem('brake_fluid')!, capabilitiesOf({}))).toBe('applies');
  });
});
