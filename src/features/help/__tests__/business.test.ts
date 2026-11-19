/** "¿Ofreces un servicio para carros?": taller físico o servicio a domicilio, con su ciudad. */
import { APP_ROUTES } from '@/features/session/appRoutes';

import { businessDraft, EMPTY_BUSINESS, MOBILE_SERVICES, validateBusiness, WORKSHOP_SERVICES, type BusinessInput } from '../business';

const workshop: BusinessInput = {
  ...EMPTY_BUSINESS,
  kind: 'workshop',
  name: 'Taller de don Jorge',
  cityId: '73001',
  phone: '300 123 4567',
  address: 'Calle 10 # 5-20',
  services: ['Frenos', 'Mecánica general'],
  vehicles: ['Gasolina'],
};
const mobile: BusinessInput = {
  ...EMPTY_BUSINESS,
  kind: 'mobile',
  name: 'Jorge Pérez',
  cityId: '11001',
  phone: '3001234567',
  coverage: 'Toda la ciudad',
  services: ['Mecánico a domicilio', 'Electricista automotriz'],
};

describe('dos tipos de inscripción', () => {
  it('cada tipo tiene sus servicios (el domicilio incluye mecánico y electricista)', () => {
    expect(MOBILE_SERVICES).toContain('Mecánico a domicilio');
    expect(MOBILE_SERVICES).toContain('Electricista automotriz');
    expect(WORKSHOP_SERVICES).toContain('Alineación y balanceo');
  });

  it('completos: sin errores', () => {
    expect(validateBusiness(workshop)).toEqual({});
    expect(validateBusiness(mobile)).toEqual({});
  });

  it('la ciudad es obligatoria, y también el nombre, el teléfono y un servicio', () => {
    const errors = validateBusiness({ ...EMPTY_BUSINESS, phone: '12' });
    expect(Object.keys(errors).sort()).toEqual(['address', 'city', 'name', 'phone', 'services']);
  });

  it('taller pide dirección; domicilio pide zonas que cubre', () => {
    expect(validateBusiness({ ...workshop, address: '' }).address).toBeDefined();
    expect(validateBusiness({ ...mobile, coverage: ' ' }).coverage).toBeDefined();
    expect(validateBusiness({ ...mobile, address: '' }).address).toBeUndefined();
  });

  it('si cambia de tipo, los servicios del otro tipo no cuentan', () => {
    expect(validateBusiness({ ...mobile, services: ['Frenos'] }).services).toBeDefined();
  });
});

describe('el correo', () => {
  it('taller: asunto con la ciudad y los datos escritos', () => {
    const draft = businessDraft(workshop);
    expect(draft.subject).toBe('[RODEXA] Inscripción de taller · Ibagué');
    expect(draft.body).toContain('Tipo: Taller físico');
    expect(draft.body).toContain('Ciudad: Ibagué (Tolima)');
    expect(draft.body).toContain('Dirección: Calle 10 # 5-20');
    expect(draft.body).toContain('Servicios: Frenos, Mecánica general');
    // Lo que no escribió no se inventa.
    expect(draft.body).toContain('Horario: No indicado');
  });

  it('domicilio: zonas que cubre en vez de dirección', () => {
    const draft = businessDraft(mobile);
    expect(draft.subject).toBe('[RODEXA] Inscripción de servicio a domicilio · Bogotá D.C.');
    expect(draft.body).toContain('Tipo: Servicio a domicilio');
    expect(draft.body).toContain('Zonas que cubre: Toda la ciudad');
    expect(draft.body).not.toContain('Dirección:');
  });

  it('la pantalla está protegida (después del primer ingreso)', () => {
    expect(APP_ROUTES).toContain('inscribir');
  });
});
