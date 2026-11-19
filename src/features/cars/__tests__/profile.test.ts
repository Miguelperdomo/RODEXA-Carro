import { EMPTY_SELECTION, profileToSelection, selectionToProfile, type CarSelection } from '@/features/catalogs/selection';

import type { CarProfile } from '../types';
import { carPlateError, validateProfile, validateVehicleDetails } from '../validation';
import { engineCcRequired, profileFieldApplies, vehicleInfoRows } from '../vehicleOptions';

const base: CarSelection = {
  ...EMPTY_SELECTION,
  brandId: 'renault',
  modelId: 'renault-logan',
  year: 2022,
};

describe('validación del perfil', () => {
  it('pide elegir la fuente de energía (no asume gasolina)', () => {
    const errors = validateProfile({ ...base, energySource: null, engineCc: 1600 }, '');
    expect(errors.energySource).toBeDefined();
  });

  it('"No sé" es una respuesta válida y deja el cilindraje opcional', () => {
    const errors = validateProfile({ ...base, energySource: 'unknown', engineCc: null }, '');
    expect(errors.energySource).toBeUndefined();
    expect(errors.displacementCc).toBeUndefined();
  });

  it('gasolina exige cilindraje', () => {
    expect(validateProfile({ ...base, energySource: 'gasoline', engineCc: null }, '').displacementCc).toBeDefined();
    expect(validateProfile({ ...base, energySource: 'gasoline', engineCc: 1600 }, '').displacementCc).toBeUndefined();
  });

  it('eléctrico NO exige cilindraje', () => {
    const errors = validateProfile({ ...base, energySource: 'electric', engineCc: null }, '');
    expect(errors.displacementCc).toBeUndefined();
    expect(engineCcRequired({ energySource: 'electric' })).toBe(false);
  });

  it('capacidades opcionales: vacías o positivas; 0 no', () => {
    expect(validateVehicleDetails({ tankCapacityLiters: null, batteryCapacityKwh: null })).toEqual({});
    expect(validateVehicleDetails({ tankCapacityLiters: 45.5 })).toEqual({});
    expect(validateVehicleDetails({ batteryCapacityKwh: 0 }).batteryCapacityKwh).toBeDefined();
  });
});

describe('selección ↔ perfil', () => {
  it('un eléctrico no guarda cilindraje aunque se hubiera elegido antes', () => {
    const profile = selectionToProfile({ ...base, energySource: 'electric', engineCc: 1600 });
    expect(profile.energySource).toBe('electric');
    expect(profile.displacementCc).toBeUndefined();
  });

  it('sin respuesta se guarda "unknown", nunca gasolina', () => {
    expect(selectionToProfile({ ...base, energySource: null }).energySource).toBe('unknown');
  });

  it('un perfil de la versión anterior (sin energía) se edita como "No sé"', () => {
    const old: CarProfile = { id: 'car-1', brandCode: 'renault', brandName: 'Renault', model: 'Logan' };
    expect(profileToSelection(old).energySource).toBe('unknown');
  });
});

describe('preguntas y filas que dependen del vehículo', () => {
  it('cilindraje, transmisión y distribución no aplican a eléctricos; batería sí', () => {
    const ev = { energySource: 'electric' as const };
    expect(profileFieldApplies('displacementCc', ev)).toBe(false);
    expect(profileFieldApplies('transmission', ev)).toBe(false);
    expect(profileFieldApplies('timingSystem', ev)).toBe(false);
    expect(profileFieldApplies('tankCapacityLiters', ev)).toBe(false);
    expect(profileFieldApplies('batteryCapacityKwh', ev)).toBe(true);
  });

  it('un híbrido convencional no pide capacidad de batería; uno enchufable sí', () => {
    expect(profileFieldApplies('batteryCapacityKwh', { energySource: 'hybrid_gasoline' })).toBe(false);
    expect(profileFieldApplies('batteryCapacityKwh', { energySource: 'phev_gasoline' })).toBe(true);
    expect(profileFieldApplies('tankCapacityLiters', { energySource: 'phev_gasoline' })).toBe(true);
  });

  it('vehículo sin cilindraje: la fila no aparece si no aplica y aparece vacía si aplica', () => {
    const ev: CarProfile = { id: 'car-1', brandCode: 'byd', brandName: 'BYD', model: 'Dolphin', energySource: 'electric' };
    const evKeys = vehicleInfoRows(ev).map((r) => r.key);
    expect(evKeys).not.toContain('cc');
    expect(evKeys).toContain('battery');

    const gas: CarProfile = { ...ev, energySource: 'gasoline' };
    const cc = vehicleInfoRows(gas).find((r) => r.key === 'cc');
    expect(cc).toBeDefined();
    expect(cc?.value).toBeUndefined();
  });

  it('energía sin confirmar se muestra como "Sin confirmar"', () => {
    const profile: CarProfile = { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' };
    expect(vehicleInfoRows(profile).find((r) => r.key === 'energy')?.value).toBe('Sin confirmar');
  });
});

describe('placa de carro', () => {
  it('ABC123 es válida; vacía también (es opcional)', () => {
    expect(carPlateError('ABC123')).toBeUndefined();
    expect(carPlateError('')).toBeUndefined();
  });

  it('formato de moto (ABC12D) bloquea, con el mensaje que lo explica', () => {
    expect(carPlateError('QQO54G')).toMatch(/es de moto/);
  });

  it('otros formatos bloquean', () => {
    for (const plate of ['ABC12', 'AB1234', '123ABC', 'ABCD12', 'ABC1234']) {
      expect(carPlateError(plate)).toMatch(/3 letras y 3 números/);
    }
    expect(carPlateError('AB-123')).toMatch(/solo letras y números/);
  });

  it('el error llega al formulario (primer ingreso y editar)', () => {
    expect(validateProfile({ ...base, energySource: 'gasoline', engineCc: 1600 }, 'QQO54G').plate).toMatch(/es de moto/);
    expect(validateProfile({ ...base, energySource: 'gasoline', engineCc: 1600 }, 'QQO543').plate).toBeUndefined();
  });
});
