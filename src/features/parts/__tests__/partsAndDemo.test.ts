/** Fase F: sin datos demo en producción y repuestos por capacidades (Pro: features/pro/__tests__). */
import { DEMO_DATA_ENABLED, isDemoEnabled } from '@/config/dev';
import type { EnergySource } from '@/features/cars/types';
import { buildSessionData } from '@/features/session/SessionProvider';
import { EMPTY_STORED_USER_DATA } from '@/storage/userDataStore';

import {
  carRefFromProfile,
  getCompatibleProducts,
  getPartCategories,
  HAS_PRODUCTS,
  NO_VERIFIED_PRODUCTS_MESSAGE,
} from '../repository';

const TODAY = new Date(2026, 8, 30);

describe('datos demo solo en desarrollo', () => {
  it('en producción siempre apagados; en desarrollo solo si se activan a propósito', () => {
    expect(isDemoEnabled(false, true)).toBe(false);
    expect(isDemoEnabled(false, false)).toBe(false);
    expect(isDemoEnabled(true, false)).toBe(false);
    expect(isDemoEnabled(true, true)).toBe(true);
    // Como viene configurado, ni siquiera en desarrollo (Expo Go) se ven.
    expect(DEMO_DATA_ENABLED).toBe(false);
  });

  it('sin primer ingreso NO aparece el carro ficticio ni su historial', () => {
    const data = buildSessionData(EMPTY_STORED_USER_DATA, TODAY);
    expect(data.profile.brandName).toBe('');
    expect(data.profile.model).toBe('');
    expect(data.history).toEqual([]);
    expect(data.components).toEqual([]);
    expect(data.documents).toEqual([]);
    expect(data.dashboard.month.totalCop).toBe(0);
    expect(JSON.stringify(data)).not.toMatch(/Onix|Chevrolet/);
  });

  it('solo con el modo demo activado se usa el carro ficticio (desarrollo)', () => {
    expect(buildSessionData(EMPTY_STORED_USER_DATA, TODAY, true).profile.model).toBe('Onix');
  });
});

describe('repuestos', () => {
  const profile = (energySource: EnergySource) => ({
    id: 'car-1',
    brandCode: 'chevrolet',
    brandName: 'Chevrolet',
    modelId: 'chevrolet-onix',
    model: 'Onix',
    year: 2023,
    energySource,
  });
  const codes = (energySource: EnergySource) =>
    getPartCategories(carRefFromProfile(profile(energySource)), profile(energySource)).flatMap((c) => c.parts.map((p) => p.code));

  it('sin productos DEMO: no hay productos ni compatibilidades inventadas', () => {
    expect(HAS_PRODUCTS).toBe(false);
    const car = carRefFromProfile(profile('gasoline'));
    expect(getCompatibleProducts(car, 'oil')).toEqual([]);
    expect(getCompatibleProducts(car, 'timing_belt')).toEqual([]);
    expect(NO_VERIFIED_PRODUCTS_MESSAGE).toMatch(/No tenemos productos verificados para este carro todavía/);
  });

  it('eléctrico: no ve bujías, aceite, filtros de aceite/aire/combustible, embrague ni correas', () => {
    const ev = codes('electric');
    for (const code of ['spark_plug', 'oil', 'oil_filter', 'air_filter', 'fuel_filter', 'clutch', 'timing_belt', 'accessory_belt']) {
      expect(ev).not.toContain(code);
    }
    expect(ev).toEqual(expect.arrayContaining(['brake_pads_front', 'tire_front', 'cabin_filter']));
  });

  it('gasolina: sí ve bujías, aceite y filtros', () => {
    expect(codes('gasoline')).toEqual(expect.arrayContaining(['spark_plug', 'oil', 'oil_filter', 'air_filter', 'fuel_filter']));
  });

  it('diésel: aceite sí, bujías de chispa no', () => {
    const d = codes('diesel');
    expect(d).toContain('oil');
    expect(d).not.toContain('spark_plug');
  });

  it('energía desconocida: se muestran (desconocido ≠ no aplica)', () => {
    expect(codes('unknown')).toEqual(expect.arrayContaining(['oil', 'spark_plug']));
  });
});
