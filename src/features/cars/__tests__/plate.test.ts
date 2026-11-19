/** Placa colombiana de carro en Inicio: color por servicio y ciudad de matrícula debajo. */
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import { EMPTY_FORM, toOnboardingData } from '@/features/onboarding/form';
import { cleanProfile } from '@/storage/sanitizeEdits';

import { formatPlate, plateCityLabel, plateColors } from '../plate';

describe('color de la placa (Resolución 1690 de 2015)', () => {
  it('particular: amarilla con letras negras; servicio público: blanca con letras negras', () => {
    expect(plateColors(undefined)).toMatchObject({ background: '#F5C518', text: '#111111' });
    expect(plateColors('private').background).toBe('#F5C518');
    expect(plateColors('public')).toMatchObject({ background: '#FFFFFF', text: '#111111' });
  });

  it('formato "ABC - 123"', () => {
    expect(formatPlate('ABC123')).toBe('ABC - 123');
    expect(formatPlate('QQO54G')).toBe('QQO54G');
  });
});

describe('ciudad debajo de la placa (en vez de "COLOMBIA")', () => {
  it('la ciudad de matrícula de la placa, en mayúsculas', () => {
    expect(plateCityLabel('73001', { cityId: '05001', city: 'Medellín' })).toBe('IBAGUÉ');
    expect(plateCityLabel('11001', {})).toBe('BOGOTÁ D.C.');
  });

  it('sin ciudad de la placa, la del perfil (también ids del catálogo anterior)', () => {
    expect(plateCityLabel(undefined, { cityId: '05001', city: 'Medellín' })).toBe('MEDELLÍN');
    expect(plateCityLabel(undefined, { cityId: 'medellin', city: 'Medellín' })).toBe('MEDELLÍN');
  });

  it('sin ninguna ciudad no se inventa nada (ni "Otro municipio")', () => {
    expect(plateCityLabel(undefined, {})).toBeUndefined();
    expect(plateCityLabel(undefined, { cityId: 'other', city: 'Otro municipio' })).toBeUndefined();
  });
});

describe('se guarda sin migraciones', () => {
  it('el primer ingreso guarda la ciudad de la placa solo si hay placa', () => {
    const base = { ...EMPTY_FORM, name: 'Ana', km: 1000 };
    const withPlate = toOnboardingData({ ...base, plate: 'ABC123', plateCityId: '73001' }, new Date(2026, 10, 6));
    expect(withPlate.profile.plateCityId).toBe('73001');
    const noPlate = toOnboardingData({ ...base, plate: '', plateCityId: '73001' }, new Date(2026, 10, 6));
    expect(noPlate.profile.plateCityId).toBeUndefined();
    expect(buildAppDataFromOnboarding(withPlate, new Date(2026, 10, 6)).profile.plateCityId).toBe('73001');
  });

  it('la lectura tolerante acepta los datos nuevos y descarta lo inválido', () => {
    expect(cleanProfile({ plateCityId: '73001', serviceType: 'public' }).value).toEqual({ plateCityId: '73001', serviceType: 'public' });
    expect(cleanProfile({ serviceType: 'taxi' }).dropped).toBe(1);
  });
});
