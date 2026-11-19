/** Fase 17: directorio de talleres, servicios y CDA; inscripción con CDA; repuestos de mi carro. */
import {
  BUSINESS_AUTHORIZATION,
  businessDraft,
  EMPTY_BUSINESS,
  validateBusiness,
  type BusinessInput,
} from '@/features/help/business';
import { partSearchUrl, partWhatsappText, sanitizeParts, sortParts, validatePart, type MyPart } from '@/features/parts/myParts';
import { APP_ROUTES } from '@/features/session/appRoutes';

import { PROVIDERS } from '../data';
import { contactKindFor, filterProviders, formatHour, mapsUrl, openState, paymentsText, whatsappMessage, whatsappUrl } from '../providers';
import type { Provider } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(`src/${p}`, 'utf8');

// Datos SOLO para la prueba (la lista real de la app arranca vacía).
const fixture = (p: Partial<Provider>): Provider => ({
  id: p.id ?? 'x',
  kind: 'workshop',
  name: 'Taller',
  cityId: '73001',
  services: ['Frenos'],
  vehicles: ['Gasolina'],
  phone: '3001234567',
  ...p,
});

describe('directorio de talleres y servicios', () => {
  it('la lista arranca VACÍA: sin ejemplos ni datos inventados', () => {
    expect(PROVIDERS).toEqual([]);
  });

  it('filtra por tipo, ciudad del perfil, búsqueda sin tildes y "Abierto ahora"; lo patrocinado arriba', () => {
    const list = [
      fixture({ id: 'a', name: 'Zeta Frenos', services: ['Frenos', 'Suspensión'] }),
      fixture({ id: 'b', name: 'Alfa Eléctricos', services: ['Eléctrica automotriz'], hours: { days: [3], open: '08:00', close: '18:00' } }),
      fixture({ id: 'c', kind: 'cda', name: 'CDA Centro', services: ['Revisión técnico-mecánica y de emisiones'] }),
      fixture({ id: 'd', kind: 'mobile', name: 'Grúas Bogotá', cityId: '11001', services: ['Grúa'] }),
      fixture({ id: 'e', name: 'Beta Taller', sponsored: true }),
    ];
    expect(filterProviders(list, { kind: 'cda' }).map((p) => p.id)).toEqual(['c']);
    expect(filterProviders(list, { kind: 'all', cityId: '11001' }).map((p) => p.id)).toEqual(['d']);
    expect(filterProviders(list, { kind: 'all', query: 'electrica' }).map((p) => p.id)).toEqual(['b']);
    const wednesday10 = new Date(2026, 10, 11, 10, 0);
    expect(filterProviders(list, { kind: 'all', openNow: wednesday10 }).map((p) => p.id)).toEqual(['b']);
    expect(filterProviders(list, { kind: 'workshop', cityId: '73001' })[0].id).toBe('e');
  });

  it('"Abierto · cierra 6:00 p. m." / "Cerrado · abre 8:00 a. m."; sin horario no dice nada', () => {
    const hours = { days: [1, 2, 3, 4, 5], open: '08:00', close: '18:00' };
    expect(openState(hours, new Date(2026, 10, 11, 9))).toEqual({ open: true, text: 'Abierto · cierra 6:00 p. m.' });
    expect(openState(hours, new Date(2026, 10, 11, 19))).toEqual({ open: false, text: 'Cerrado · abre 8:00 a. m.' });
    expect(openState(undefined, new Date())).toBeUndefined();
    expect(formatHour('12:30')).toBe('12:30 p. m.');
  });

  it('WhatsApp con mensaje para carro, "Cómo llegar" con la dirección y medios de pago', () => {
    expect(whatsappUrl('300 123 4567', 'Hola')).toBe('https://wa.me/573001234567?text=Hola');
    expect(whatsappMessage(fixture({ kind: 'cda' }), 'Kia Picanto')).toMatch(/revisión técnico-mecánica para mi Kia Picanto/);
    expect(mapsUrl(fixture({ address: 'Calle 10 # 5-20' }), 'Ibagué')).toContain('Calle%2010%20%23%205-20%2C%20Ibagu');
    expect(mapsUrl(fixture({ kind: 'mobile' }), 'Ibagué')).toBeUndefined();
    expect(paymentsText(['transfer', 'cash', 'nequi'])).toEqual(['Efectivo', 'Nequi', 'Transferencia']);
    expect(contactKindFor(fixture({ services: ['Grúa'] }))).toBe('tow');
  });

  it('no nombra plataformas de transporte ni de domicilios', () => {
    const all = [read('app/talleres.tsx'), read('features/providers/providers.ts')].join(' ');
    expect(all).not.toMatch(/Uber|DiDi|inDrive|Cabify|Rappi|Picap/i);
  });

  it('entradas: Mi carro, "Buscar un taller" y "Ver CDA para hacer la tecnomecánica"', () => {
    expect(APP_ROUTES).toContain('talleres');
    expect(read('app/(tabs)/carro.tsx')).toContain("router.push('/talleres')");
    expect(read('features/parts/components/WorkshopsSection.tsx')).toContain("pathname: '/talleres'");
    const doc = read('app/documentos/[key].tsx');
    expect(doc).toContain("doc.type === 'rtm'");
    expect(doc).toContain('Ver CDA para hacer la tecnomecánica');
  });
});

describe('inscripción: taller, servicio a domicilio o CDA', () => {
  const cda: BusinessInput = {
    ...EMPTY_BUSINESS,
    kind: 'cda',
    name: 'CDA Centro',
    cityId: '73001',
    phone: '6082000000',
    address: 'Carrera 5 # 10-20',
    services: ['Revisión técnico-mecánica y de emisiones'],
    payments: ['Efectivo', 'Tarjeta'],
  };

  it('el CDA pide dirección; el correo lleva ciudad, pagos y la autorización', () => {
    expect(validateBusiness(cda)).toEqual({});
    expect(validateBusiness({ ...cda, address: '' }).address).toBe('Escribe la dirección del CDA.');
    const draft = businessDraft(cda);
    expect(draft.subject).toBe('[RODEXA] Inscripción de CDA · Ibagué');
    expect(draft.body).toContain('Medios de pago: Efectivo, Tarjeta');
    expect(draft.body).toContain(BUSINESS_AUTHORIZATION);
  });

  it('los Términos dicen que RODEXA no presta ni garantiza esos servicios (texto aprobado)', () => {
    const legal = read('features/legal/documents.ts');
    expect(legal).toContain('centros de diagnóstico automotor (CDA) que solicitaron aparecer en la aplicación');
    expect(legal).toContain('se identifican como «Patrocinado»');
  });
});

describe('repuestos de mi carro', () => {
  const part: MyPart = {
    id: 'p1',
    type: 'oil_filter',
    name: 'Bosch',
    reference: 'PH6607',
    createdAt: '2026-11-01',
    lastPurchase: { date: '2026-11-01', priceCop: 25000, store: 'Almacén del barrio' },
  };

  it('pedir por WhatsApp y buscar en Google con la referencia y el carro', () => {
    expect(partWhatsappText(part, 'Kia Picanto 2022')).toBe('Hola, necesito Filtro de aceite Bosch PH6607 para mi Kia Picanto 2022. ¿Lo tienes y a cuánto?');
    expect(partSearchUrl(part, 'Kia Picanto')).toBe(
      `https://www.google.com/search?q=${encodeURIComponent('Filtro de aceite Bosch PH6607 Kia Picanto')}`,
    );
  });

  it('validación, orden del catálogo y lectura tolerante', () => {
    expect(validatePart({ type: null, name: '', priceCop: -1 })).toEqual({
      type: 'Elige qué repuesto es.',
      name: 'Escribe la marca o la descripción.',
      price: 'Revisa el valor.',
    });
    const other: MyPart = { id: 'p2', type: 'other', name: 'Sensor', createdAt: '2026-11-01' };
    const oil: MyPart = { id: 'p3', type: 'oil', name: 'Mobil', createdAt: '2026-11-01' };
    expect(sortParts([other, part, oil]).map((p) => p.id)).toEqual(['p3', 'p1', 'p2']);
    expect(sanitizeParts([part, { id: 'x', type: 'cohete', name: 'X', createdAt: '2026-11-01' }])).toEqual([part]);
  });

  it('"¿Qué le pusiste?" después de registrar un mantenimiento', () => {
    const src = read('app/registrar/mantenimiento.tsx');
    expect(src).toContain('¿Qué le pusiste?');
    expect(src).toContain("pathname: '/mis-repuestos/editar'");
    expect(APP_ROUTES).toEqual(expect.arrayContaining(['mis-repuestos', 'mis-repuestos/editar']));
  });
});
