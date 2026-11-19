import {
  capabilitiesOf,
  isApplicable,
  needsEnergyConfirmation,
  requirementStatus,
  type CapabilityInput,
} from '../capabilities';

const caps = (profile: CapabilityInput) => capabilitiesOf(profile);

describe('capacidades por fuente de energía', () => {
  it('gasolina: motor de chispa, aceite, bujías, combustible líquido; sin tracción eléctrica ni carga', () => {
    const c = caps({ energySource: 'gasoline' });
    expect(c['combustion-engine']).toBe('yes');
    expect(c['spark-ignition-engine']).toBe('yes');
    expect(c['engine-oil']).toBe('yes');
    expect(c['spark-plugs']).toBe('yes');
    expect(c['liquid-fuel']).toBe('yes');
    expect(c['exhaust-system']).toBe('yes');
    expect(c['battery-12v']).toBe('yes');
    expect(c['electric-drive']).toBe('no');
    expect(c['external-charging']).toBe('no');
    expect(c.cng).toBe('no');
    expect(c.adblue).toBe('no');
  });

  it('diésel: sin bujías; AdBlue queda desconocido (depende del modelo)', () => {
    const c = caps({ energySource: 'diesel' });
    expect(c['compression-ignition-engine']).toBe('yes');
    expect(c['spark-plugs']).toBe('no');
    expect(c['engine-oil']).toBe('yes');
    expect(c.adblue).toBe('unknown');
  });

  it('eléctrico: sin aceite de motor, bujías, escape, combustible ni distribución', () => {
    const c = caps({ energySource: 'electric' });
    expect(c['combustion-engine']).toBe('no');
    expect(c['engine-oil']).toBe('no');
    expect(c['spark-plugs']).toBe('no');
    expect(c['exhaust-system']).toBe('no');
    expect(c['liquid-fuel']).toBe('no');
    expect(c['timing-belt']).toBe('no');
    expect(c['timing-chain']).toBe('no');
    expect(c['traction-battery']).toBe('yes');
    expect(c['external-charging']).toBe('yes');
    // Depende del modelo: no se afirma ni se niega.
    expect(c['battery-12v']).toBe('unknown');
    expect(c['engine-coolant']).toBe('unknown');
  });

  it('eléctrico sin transmisión indicada: no tiene caja manual/automática/CVT/DCT', () => {
    const c = caps({ energySource: 'electric' });
    expect(c['manual-transmission']).toBe('no');
    expect(c['automatic-transmission']).toBe('no');
    expect(c.cvt).toBe('no');
    expect(c.dct).toBe('no');
  });

  it('híbrido convencional: combustión + tracción eléctrica, pero NO se enchufa', () => {
    const c = caps({ energySource: 'hybrid_gasoline' });
    expect(c['combustion-engine']).toBe('yes');
    expect(c['engine-oil']).toBe('yes');
    expect(c['electric-drive']).toBe('yes');
    expect(c['traction-battery']).toBe('yes');
    expect(c['external-charging']).toBe('no');
    expect(c['liquid-fuel']).toBe('yes');
  });

  it('híbrido enchufable: combustión + tracción eléctrica + carga desde la red', () => {
    for (const energySource of ['phev_gasoline', 'phev_diesel'] as const) {
      const c = caps({ energySource });
      expect(c['combustion-engine']).toBe('yes');
      expect(c['liquid-fuel']).toBe('yes');
      expect(c['external-charging']).toBe('yes');
    }
  });

  it('GNC: motor de chispa que usa gas; el combustible líquido queda desconocido (suele ser dual)', () => {
    const c = caps({ energySource: 'cng' });
    expect(c.cng).toBe('yes');
    expect(c['spark-plugs']).toBe('yes');
    expect(c['liquid-fuel']).toBe('unknown');
    expect(c['external-charging']).toBe('no');
  });

  it('GNC + gasolina (dual): gas Y combustible líquido confirmados', () => {
    const c = caps({ energySource: 'cng_gasoline' });
    expect(c.cng).toBe('yes');
    expect(c['liquid-fuel']).toBe('yes');
    expect(c['spark-plugs']).toBe('yes');
    expect(c['external-charging']).toBe('no');
  });

  it('sin fuente de energía confirmada: todo lo que depende de ella queda desconocido', () => {
    for (const energySource of [undefined, 'unknown', 'other'] as const) {
      const c = caps({ energySource });
      expect(c['combustion-engine']).toBe('unknown');
      expect(c['engine-oil']).toBe('unknown');
      expect(c['liquid-fuel']).toBe('unknown');
      expect(c['external-charging']).toBe('unknown');
    }
  });
});

describe('capacidades por transmisión, tracción y distribución', () => {
  it('manual', () => {
    const c = caps({ energySource: 'gasoline', transmission: 'manual' });
    expect(c['manual-transmission']).toBe('yes');
    expect(c['automatic-transmission']).toBe('no');
    expect(c.cvt).toBe('no');
    expect(c['transmission-fluid']).toBe('yes');
  });

  it('automática', () => {
    const c = caps({ energySource: 'gasoline', transmission: 'automatic' });
    expect(c['automatic-transmission']).toBe('yes');
    expect(c['manual-transmission']).toBe('no');
  });

  it('CVT', () => {
    const c = caps({ energySource: 'gasoline', transmission: 'cvt' });
    expect(c.cvt).toBe('yes');
    expect(c['automatic-transmission']).toBe('no');
  });

  it('transmisión desconocida: no se asume ninguna', () => {
    const c = caps({ energySource: 'gasoline', transmission: 'unknown' });
    expect(c['manual-transmission']).toBe('unknown');
    expect(c['automatic-transmission']).toBe('unknown');
    expect(c.cvt).toBe('unknown');
  });

  it('4x2 no es tracción total; 4x4 y AWD sí', () => {
    expect(caps({ drivetrain: '4x2' })['four-wheel-drive']).toBe('no');
    expect(caps({ drivetrain: '4x4' })['four-wheel-drive']).toBe('yes');
    expect(caps({ drivetrain: 'awd' })['four-wheel-drive']).toBe('yes');
    expect(caps({})['four-wheel-drive']).toBe('unknown');
  });

  it('correa vs cadena de distribución', () => {
    const belt = caps({ energySource: 'gasoline', timingSystem: 'belt' });
    expect(belt['timing-belt']).toBe('yes');
    expect(belt['timing-chain']).toBe('no');
    const unknown = caps({ energySource: 'gasoline' });
    expect(unknown['timing-belt']).toBe('unknown');
    expect(unknown['timing-chain']).toBe('unknown');
  });

  it('respeta un "no tiene radiador" respondido antes por el usuario', () => {
    const c = caps({ energySource: 'gasoline', coolingApplies: false, coolingSource: 'user' });
    expect(c['engine-coolant']).toBe('no');
  });
});

describe('reglas de aplicabilidad', () => {
  it('requirementStatus: "no" si alguna falta, "yes" si todas, si no "unknown"', () => {
    const c = caps({ energySource: 'gasoline' });
    expect(requirementStatus(c, ['engine-oil', 'spark-plugs'])).toBe('yes');
    expect(requirementStatus(c, ['engine-oil', 'external-charging'])).toBe('no');
    expect(requirementStatus(c, ['engine-oil', 'timing-belt'])).toBe('unknown');
  });

  it('solo se oculta lo confirmado como no aplicable', () => {
    expect(isApplicable(caps({ energySource: 'electric' }), ['engine-oil'])).toBe(false);
    expect(isApplicable(caps({ energySource: 'gasoline' }), ['engine-oil'])).toBe(true);
    // Sin energía confirmada se muestra (desconocido ≠ no aplica).
    expect(isApplicable(caps({ energySource: 'unknown' }), ['engine-oil'])).toBe(true);
  });

  it('pide confirmar la energía solo si falta o es "No sé" ("Otro" es una respuesta)', () => {
    expect(needsEnergyConfirmation({})).toBe(true);
    expect(needsEnergyConfirmation({ energySource: 'unknown' })).toBe(true);
    expect(needsEnergyConfirmation({ energySource: 'other' })).toBe(false);
    expect(needsEnergyConfirmation({ energySource: 'diesel' })).toBe(false);
  });
});
