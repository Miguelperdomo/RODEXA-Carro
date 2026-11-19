import { BRAND } from '@/config/brand';
import { findCity } from '@/features/catalogs/repository';

import type { EmailDraft } from './email';

/**
 * "¿Ofreces un servicio para carros?": inscripción de un TALLER FÍSICO o de un SERVICIO A
 * DOMICILIO (mecánico que va hasta el carro, electricista automotriz…). RODEXA solo PREPARA
 * el correo con lo que la persona escribió y abre su app de correo: ella lo revisa y lo
 * envía. No hay servidor ni envío automático, y nada se guarda en el teléfono.
 */
export type BusinessKind = 'workshop' | 'mobile' | 'cda';

export const BUSINESS_KINDS: { value: BusinessKind; label: string; description: string }[] = [
  { value: 'workshop', label: 'Taller físico', description: 'Un local donde los clientes llevan su carro' },
  { value: 'mobile', label: 'Servicio a domicilio', description: 'Vas hasta donde está el carro' },
  { value: 'cda', label: 'CDA', description: 'Centro de diagnóstico automotor (revisión técnico-mecánica)' },
];

/** Servicios de un CDA. */
export const CDA_SERVICES = ['Revisión técnico-mecánica y de emisiones', 'Revisión preventiva', 'Otro'] as const;

/** Medios de pago que puede indicar el negocio. */
export const PAYMENT_OPTIONS = ['Efectivo', 'Nequi', 'Daviplata', 'Tarjeta', 'Transferencia'] as const;

/** Autorización que va al final del correo (el negocio la envía al mandarlo). */
export const BUSINESS_AUTHORIZATION =
  'Autorizo a Providentia Tech a publicar en RODEXA los datos de mi negocio aquí indicados (nombre, ciudad, dirección o zonas que cubre, teléfono, servicios, medios de pago y horario), y a retirarlos cuando lo solicite.';

/** Servicios de un taller físico. */
export const WORKSHOP_SERVICES = [
  'Mecánica general',
  'Eléctrica automotriz',
  'Frenos',
  'Suspensión',
  'Llantas y montallantas',
  'Alineación y balanceo',
  'Latonería y pintura',
  'Aire acondicionado',
  'Diagnóstico con escáner',
  'Cambio de aceite',
  'Lavado y detallado',
  'Otro',
] as const;

/** Servicios que van hasta el carro. */
export const MOBILE_SERVICES = [
  'Mecánico a domicilio',
  'Electricista automotriz',
  'Diagnóstico con escáner',
  'Batería a domicilio',
  'Montallantas a domicilio',
  'Cerrajería automotriz',
  'Grúa',
  'Lavado a domicilio',
  'Cambio de aceite a domicilio',
  'Otro',
] as const;

/** Tipos de carro que atiende. */
export const VEHICLE_TYPES = ['Gasolina', 'Diésel', 'GNC', 'Eléctricos', 'Híbridos'] as const;

export const servicesFor = (kind: BusinessKind): readonly string[] =>
  kind === 'workshop' ? WORKSHOP_SERVICES : kind === 'cda' ? CDA_SERVICES : MOBILE_SERVICES;

/** Taller y CDA tienen local (dirección); el servicio a domicilio, zonas. */
export const hasAddress = (kind: BusinessKind) => kind !== 'mobile';

export type BusinessInput = {
  kind: BusinessKind;
  name: string;
  /** Código DANE del municipio (obligatorio). */
  cityId: string | null;
  phone: string;
  /** Taller físico: dirección del local. */
  address: string;
  /** Servicio a domicilio: barrios, zonas o municipios que cubre. */
  coverage: string;
  services: string[];
  vehicles: string[];
  payments: string[];
  contactPerson: string;
  email: string;
  schedule: string;
  social: string;
  comments: string;
};

export const EMPTY_BUSINESS: BusinessInput = {
  kind: 'workshop',
  name: '',
  cityId: null,
  phone: '',
  address: '',
  coverage: '',
  services: [],
  vehicles: [],
  payments: [],
  contactPerson: '',
  email: '',
  schedule: '',
  social: '',
  comments: '',
};

export type BusinessErrors = Partial<Record<'name' | 'city' | 'phone' | 'address' | 'coverage' | 'services', string>>;

/** Teléfono con al menos 7 dígitos (fijo o celular). */
const validPhone = (v: string) => v.replace(/\D/g, '').length >= 7;

export function validateBusiness(input: BusinessInput): BusinessErrors {
  const errors: BusinessErrors = {};
  if (!input.name.trim()) {
    errors.name =
      input.kind === 'workshop' ? 'Escribe el nombre del taller.' : input.kind === 'cda' ? 'Escribe el nombre del CDA.' : 'Escribe tu nombre o el de tu servicio.';
  }
  if (!findCity(input.cityId)) errors.city = 'Elige la ciudad o el municipio.';
  if (!validPhone(input.phone)) errors.phone = 'Escribe un teléfono o WhatsApp de contacto.';
  if (hasAddress(input.kind) && !input.address.trim()) errors.address = input.kind === 'cda' ? 'Escribe la dirección del CDA.' : 'Escribe la dirección del taller.';
  if (input.kind === 'mobile' && !input.coverage.trim()) errors.coverage = 'Escribe qué zonas cubres.';
  // Solo cuentan los servicios de este tipo (si cambió de tipo, los otros no se envían).
  if (!input.services.some((s) => servicesFor(input.kind).includes(s))) errors.services = 'Elige al menos un servicio.';
  return errors;
}

/** El correo listo para revisar: solo lo que la persona escribió (lo vacío dice "No indicado"). */
export function businessDraft(input: BusinessInput): EmailDraft {
  const city = findCity(input.cityId);
  const cityText = city ? `${city.name} (${city.department})` : 'No indicada';
  const text = (v: string) => v.trim() || 'No indicado';
  const services = input.services.filter((s) => servicesFor(input.kind).includes(s));
  const kindLabel = BUSINESS_KINDS.find((k) => k.value === input.kind)?.label ?? 'Taller físico';
  const what = input.kind === 'workshop' ? 'taller' : input.kind === 'cda' ? 'CDA' : 'servicio a domicilio';
  const payments = input.payments.filter((p) => (PAYMENT_OPTIONS as readonly string[]).includes(p));

  const lines = [
    `Quiero inscribir mi ${what} en ${BRAND.masterBrand}`,
    '',
    `Tipo: ${kindLabel}`,
    `${input.kind === 'mobile' ? 'Nombre o servicio' : `Nombre del ${what}`}: ${input.name.trim()}`,
    `Ciudad: ${cityText}`,
    hasAddress(input.kind) ? `Dirección: ${text(input.address)}` : `Zonas que cubre: ${text(input.coverage)}`,
    `Teléfono / WhatsApp: ${input.phone.trim()}`,
    `Correo: ${text(input.email)}`,
    `Persona de contacto: ${text(input.contactPerson)}`,
    `Servicios: ${services.join(', ')}`,
    `Tipos de carro que atiende: ${input.vehicles.length ? input.vehicles.join(', ') : 'No indicado'}`,
    `Medios de pago: ${payments.length ? payments.join(', ') : 'No indicado'}`,
    `Horario: ${text(input.schedule)}`,
    `Página web o redes sociales: ${text(input.social)}`,
    `Comentarios: ${text(input.comments)}`,
    '',
    BUSINESS_AUTHORIZATION,
    '',
    '---',
    '',
    `Enviado desde ${BRAND.productName}`,
    BRAND.madeBy,
  ];
  const subject = `[RODEXA] Inscripción de ${what} · ${city?.name ?? 'Sin ciudad'}`;
  return { subject, body: lines.join('\n') };
}
