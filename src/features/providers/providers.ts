import type { ContactKind } from '@/features/contacts/rules';
import type { IconName } from '@/shared/ui';

import { PROVIDERS } from './data';
import type { OpeningHours, PaymentMethod, Provider, ProviderKind } from './types';

/**
 * Directorio "Talleres y servicios": filtros, "Abierto ahora" y enlaces (llamar, WhatsApp,
 * Google Maps). Funciones puras. Sin GPS: se filtra por la ciudad del perfil.
 */
export function getProviders(): Provider[] {
  return PROVIDERS;
}

/** Sin tildes ni mayúsculas, para buscar ("mecanico" encuentra "Mecánico"). */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export type ProviderFilter = 'all' | ProviderKind;

export const KIND_LABEL: Record<ProviderKind, { icon: IconName; label: string; plural: string }> = {
  workshop: { icon: 'workshop', label: 'Taller', plural: 'Talleres' },
  mobile: { icon: 'location', label: 'Servicio a domicilio', plural: 'A domicilio' },
  cda: { icon: 'inspection', label: 'CDA · Tecnomecánica', plural: 'CDA' },
};

/** Medios de pago, en el orden en que se muestran. */
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export const paymentsText = (payments: PaymentMethod[] | undefined) =>
  (Object.keys(PAYMENT_LABEL) as PaymentMethod[]).filter((m) => payments?.includes(m)).map((m) => PAYMENT_LABEL[m]);

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** "12:30" → "12:30 p. m."; "18:00" → "6:00 p. m.". */
export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export type OpenState = { open: boolean; text: string };

/** "Abierto · cierra 6:00 p. m." / "Cerrado · abre 8:00 a. m." (sin horario: undefined). */
export function openState(hours: OpeningHours | undefined, now: Date): OpenState | undefined {
  if (!hours) return undefined;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = hours.days.includes(now.getDay());
  if (today && nowMin >= minutes(hours.open) && nowMin < minutes(hours.close)) {
    return { open: true, text: `Abierto · cierra ${formatHour(hours.close)}` };
  }
  return { open: false, text: `Cerrado · abre ${formatHour(hours.open)}` };
}

/**
 * Por tipo, ciudad (código DANE), "Abierto ahora" y búsqueda en nombre, servicios, zonas y
 * dirección. Orden: lo patrocinado arriba (siempre marcado) y luego por nombre.
 */
export function filterProviders(
  list: Provider[],
  opts: { kind: ProviderFilter; cityId?: string; query?: string; openNow?: Date },
): Provider[] {
  const words = normalize(opts.query ?? '').split(/\s+/).filter(Boolean);
  return list
    .filter((p) => opts.kind === 'all' || p.kind === opts.kind)
    .filter((p) => !opts.cityId || p.cityId === opts.cityId)
    .filter((p) => !opts.openNow || openState(p.hours, opts.openNow)?.open === true)
    .filter((p) => {
      if (words.length === 0) return true;
      const haystack = normalize([p.name, ...p.services, p.zones ?? '', p.address ?? '', ...p.vehicles].join(' '));
      return words.every((w) => haystack.includes(w));
    })
    .sort((a, b) => Number(!!b.sponsored) - Number(!!a.sponsored) || a.name.localeCompare(b.name, 'es'));
}

/** WhatsApp con el mensaje listo. Celulares colombianos de 10 cifras: se agrega el 57. */
export function whatsappUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, '');
  const full = digits.length === 10 && digits.startsWith('3') ? `57${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

/** "Cómo llegar": Google Maps con la dirección que dio el negocio (RODEXA no pide ubicación). */
export function mapsUrl(p: Provider, cityName: string): string | undefined {
  if (!p.address) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.address, cityName].filter(Boolean).join(', '))}`;
}

/** El primer mensaje por WhatsApp, con el carro de la persona. */
export function whatsappMessage(p: Provider, car: string): string {
  const mine = car ? `mi ${car}` : 'mi carro';
  if (p.kind === 'cda') return `Hola, te encontré en RODEXA. Quisiera saber el horario y el valor de la revisión técnico-mecánica para ${mine}.`;
  if (p.kind === 'workshop') return `Hola, te encontré en RODEXA. Tengo ${mine} y quisiera saber si me pueden atender.`;
  return `Hola, te encontré en RODEXA. Necesito ${p.services[0]?.toLowerCase() ?? 'tu servicio'} para ${mine}. ¿Estás disponible?`;
}

/** Al guardarlo en "Contactos del carro": grúa, mecánico u otro (CDA). */
export function contactKindFor(p: Provider): ContactKind {
  if (p.kind === 'cda') return 'other';
  return p.services.some((s) => normalize(s).includes('grua')) ? 'tow' : 'mechanic';
}
