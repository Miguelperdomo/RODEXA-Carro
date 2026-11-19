import type { EnergyKind } from '@/features/history/types';

import type { ReminderCategory } from './types';

/**
 * Textos de los recordatorios que varían. Para agregar variedad basta con sumar
 * frases a la lista de su categoría; `pickVariant` las rota sin azar.
 */
export const VARIANTS = {
  mileage: [
    'Hace varios días que no actualizas el kilometraje de tu carro.',
    'No has registrado el kilometraje de tu carro en los últimos días.',
    '¿Cuántos kilómetros lleva tu carro? Actualiza el kilometraje para que RODEXA pueda ayudarte mejor.',
    'Actualiza el kilometraje para mantener al día el estado de tu carro.',
  ],
  maintenanceStale: [
    'Hace un tiempo que no registras un mantenimiento. ¿Todo bien con tu carro?',
    'Hace tiempo que no registras una revisión. Revisa el estado de tu carro.',
  ],
  fuel: [
    'Tu última carga de combustible registrada fue hace varios días. ¿Quieres registrar una?',
    '¿Hace cuánto no registras una carga de combustible?',
  ],
  inactivity: [
    'Hace varios días que no registras información de tu carro.',
    'Registra tus gastos y tu kilometraje para mantener al día el estado de tu carro.',
    '¿Todo bien con tu carro? Hace unos días que no lo registras.',
    'Revisa el estado de tu carro en RODEXA.',
    'Hace un tiempo que no abres RODEXA. Revisa cómo va tu carro.',
  ],
} as const;

export const FUEL_CONSUMPTION_TIP = 'Registra tus próximas cargas de combustible para conocer mejor el consumo de tu carro.';

/**
 * Recordatorios de abastecimiento por tipo de energía. Solo invitan a REGISTRAR, a
 * partir de la fecha del último registro del propio usuario: no hay intervalos,
 * consumos, precios ni recomendaciones del fabricante.
 */
export const ENERGY_REMINDERS: Record<EnergyKind, { title: string; variants: readonly string[]; tip: string }> = {
  fuel: {
    title: 'Combustible',
    variants: VARIANTS.fuel,
    tip: FUEL_CONSUMPTION_TIP,
  },
  cng: {
    title: 'GNC',
    variants: [
      'Tu última carga de GNC registrada fue hace varios días. ¿Quieres registrar una?',
      '¿Hace cuánto no registras una carga de GNC?',
    ],
    tip: 'Registra tus cargas completas de GNC con su kilometraje para conocer el consumo de tu carro en km/m³.',
  },
  charge: {
    title: 'Carga eléctrica',
    variants: [
      'Tu última carga eléctrica registrada fue hace varios días. ¿Quieres registrar una?',
      '¿Hace cuánto no registras una carga de tu carro?',
    ],
    tip: 'Anota el % de batería al terminar tus cargas: con dos cargas que terminen en el mismo %, RODEXA calcula el consumo en km/kWh.',
  },
};

/** Mensajes fijos de documentos: uno por aviso (30 días, 7 días, 1 día antes). */
export const DOCUMENT_MESSAGES: Record<'soat' | 'rtm' | 'license', Record<30 | 7 | 1, string>> = {
  soat: {
    30: 'Tu SOAT vence en 30 días.',
    7: 'Tu SOAT vence en 7 días.',
    1: 'Tu SOAT vence mañana. Renuévalo a tiempo.',
  },
  rtm: {
    30: 'Tu Tecnomecánica está próxima a vencer: vence en 30 días.',
    7: 'Falta poco para renovar tu Tecnomecánica: vence en 7 días.',
    1: 'Tu Tecnomecánica vence mañana. Renuévala a tiempo.',
  },
  license: {
    30: 'Tu licencia de conducción vence en 30 días.',
    7: 'Tu licencia de conducción vence en 7 días.',
    1: 'Tu licencia de conducción vence mañana. Renuévala a tiempo.',
  },
};

/** Cuándo se envía un aviso de documento: días antes, o el día siguiente al vencimiento. */
export type DocumentReminderWhen = 30 | 7 | 1 | 'after';

/**
 * Texto de un aviso de documento. SOAT, Tecnomecánica y licencia conservan sus textos;
 * los demás usan una plantilla neutral. Nunca se afirman consecuencias legales: todo
 * se basa en la fecha que registró el usuario.
 */
export function documentReminderBody(
  doc: { type: string; title: string; taxYear?: number },
  when: DocumentReminderWhen,
): string {
  if (doc.type === 'tax') {
    const year = doc.taxYear ? ` ${doc.taxYear}` : '';
    if (when === 'after') {
      return `La fecha límite de pago del impuesto${year} fue ayer según la fecha que registraste. Si ya lo pagaste, actualiza el registro.`;
    }
    return when === 1
      ? `La fecha límite de pago del impuesto${year} es mañana, según la fecha que registraste.`
      : `La fecha límite de pago del impuesto${year} es en ${when} días, según la fecha que registraste.`;
  }
  if (when === 'after') return 'Venció ayer según la fecha que registraste. Si ya lo renovaste, actualiza el documento.';
  if (doc.type === 'soat' || doc.type === 'rtm' || doc.type === 'license') return DOCUMENT_MESSAGES[doc.type][when];
  return when === 1
    ? `${doc.title}: vence mañana, según la fecha que registraste.`
    : `${doc.title}: vence en ${when} días, según la fecha que registraste.`;
}

export const CATEGORY_TITLES: Record<ReminderCategory, string> = {
  mileage: 'Kilometraje',
  maintenance: 'Mantenimiento',
  soat: 'SOAT',
  technicalReview: 'Tecnomecánica',
  license: 'Licencia de conducción',
  document: 'Documentos',
  fuel: 'Combustible',
  inactivity: 'RODEXA Carro',
  picoYPlaca: 'Pico y placa',
  weeklyCheck: 'Revisión semanal',
  custom: 'Recordatorio',
  credit: 'Cuota del carro',
  longWeekend: 'Puente festivo',
  fine: 'Descuento de tu comparendo',
};

/**
 * Elige una frase de forma determinista: el mismo dato da la misma frase (no hay
 * repeticiones al reprogramar) y los avisos seguidos de una serie usan frases distintas.
 */
export function pickVariant(list: readonly string[], seed: string, step: number): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return list[(hash + step) % list.length];
}
