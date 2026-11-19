import { canRecord, ENERGY_UNITS, energyRecordKinds, liquidFuelLabel } from '../energy';

/** Matriz de la Fase C: qué registro permite cada tipo de energía. */
describe('qué registros de energía permite cada vehículo', () => {
  it('1–2. gasolina y diésel: fuel', () => {
    expect(energyRecordKinds({ energySource: 'gasoline' })).toEqual(['fuel']);
    expect(energyRecordKinds({ energySource: 'diesel' })).toEqual(['fuel']);
  });

  it('3–4. HEV gasolina y HEV diésel: fuel', () => {
    expect(energyRecordKinds({ energySource: 'hybrid_gasoline' })).toEqual(['fuel']);
    expect(energyRecordKinds({ energySource: 'hybrid_diesel' })).toEqual(['fuel']);
  });

  it('5 / 26. un HEV NO enchufable no registra carga externa', () => {
    expect(canRecord({ energySource: 'hybrid_gasoline' }, 'charge')).toBe(false);
    expect(canRecord({ energySource: 'hybrid_diesel' }, 'charge')).toBe(false);
  });

  it('6–7. PHEV gasolina y PHEV diésel: fuel + charge', () => {
    expect(energyRecordKinds({ energySource: 'phev_gasoline' })).toEqual(['fuel', 'charge']);
    expect(energyRecordKinds({ energySource: 'phev_diesel' })).toEqual(['fuel', 'charge']);
  });

  it('8. eléctrico: solo charge (no muestra tanqueo)', () => {
    expect(energyRecordKinds({ energySource: 'electric' })).toEqual(['charge']);
    expect(canRecord({ energySource: 'electric' }, 'fuel')).toBe(false);
  });

  it('9. GNC: cng (no se asume tanqueo de gasolina sin confirmarlo)', () => {
    expect(energyRecordKinds({ energySource: 'cng' })).toEqual(['cng']);
  });

  it('GNC + gasolina (dual), confirmado por el usuario: cng + fuel (sin carga eléctrica)', () => {
    expect(energyRecordKinds({ energySource: 'cng_gasoline' })).toEqual(['fuel', 'cng']);
    expect(canRecord({ energySource: 'cng_gasoline' }, 'charge')).toBe(false);
    // Un GNC a secas NO se asume dual.
    expect(canRecord({ energySource: 'cng' }, 'fuel')).toBe(false);
  });

  it('matriz definitiva completa', () => {
    const matrix = {
      gasoline: ['fuel'],
      diesel: ['fuel'],
      cng: ['cng'],
      cng_gasoline: ['fuel', 'cng'],
      electric: ['charge'],
      hybrid_gasoline: ['fuel'],
      hybrid_diesel: ['fuel'],
      phev_gasoline: ['fuel', 'charge'],
      phev_diesel: ['fuel', 'charge'],
      other: [],
      unknown: [],
    } as const;
    for (const [energySource, kinds] of Object.entries(matrix)) {
      expect(energyRecordKinds({ energySource: energySource as keyof typeof matrix })).toEqual(kinds);
    }
  });

  it('gasolina no muestra carga eléctrica ni GNC', () => {
    expect(canRecord({ energySource: 'gasoline' }, 'charge')).toBe(false);
    expect(canRecord({ energySource: 'gasoline' }, 'cng')).toBe(false);
  });

  it('"No sé" y "Otro" sin capacidades confirmadas: no se asume ningún registro', () => {
    expect(energyRecordKinds({ energySource: 'unknown' })).toEqual([]);
    expect(energyRecordKinds({})).toEqual([]);
    expect(energyRecordKinds({ energySource: 'other' })).toEqual([]);
  });

  it('cada registro tiene su propia unidad y nunca comparten unidad de consumo', () => {
    expect(ENERGY_UNITS.fuel.consumption).toBe('km/L');
    expect(ENERGY_UNITS.cng.consumption).toBe('km/m³');
    expect(ENERGY_UNITS.charge.consumption).toBe('km/kWh');
  });

  it('nombre del combustible líquido según la energía', () => {
    expect(liquidFuelLabel('phev_gasoline')).toBe('Gasolina');
    expect(liquidFuelLabel('hybrid_diesel')).toBe('Diésel');
    expect(liquidFuelLabel(undefined)).toBe('Combustible');
  });
});
