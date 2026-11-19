import type { CarSheet } from '@/features/session/types';

import { findPart, PARTS, type PartDefinition } from './catalog';

/**
 * "Lo que usa mi carro": el usuario anota los datos de cada repuesto (por ejemplo, el
 * aceite: tipo, viscosidad, norma, cantidad). Se guarda en la ficha del carro, en el
 * celular. Los ejemplos son solo guía de formato: RODEXA no dice qué usa cada carro.
 */

/** "Tipo de aceite" → "tipo_de_aceite". */
function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Clave en la ficha: `part:oil:viscosidad`. */
export function partSpecKey(code: string, field: string): `part:${string}` {
  return `part:${code}:${slug(field)}`;
}

/** Ejemplo de formato por campo (y por repuesto cuando el mismo campo cambia de sentido). */
const EXAMPLES: Record<string, string> = {
  'Tipo de aceite': 'Ej.: sintético',
  Viscosidad: 'Ej.: 5W-30',
  Norma: 'Ej.: API SP',
  Cantidad: 'Ej.: 4 litros',
  Referencia: 'Como aparece en la caja o en la pieza',
  'Grado térmico': 'Ej.: 6',
  Calibración: 'Ej.: 0,8 mm',
  'Número de dientes': 'Ej.: 104',
  Ancho: 'Ej.: 25 mm',
  'Incluye tensor': 'Sí / No',
  'Número de canales': 'Ej.: 6',
  Longitud: 'Ej.: 1.200 mm',
  'Referencia del kit': 'Como aparece en la caja',
  'Diámetro del disco': 'Ej.: 200 mm',
  Compuesto: 'Ej.: cerámico',
  Diámetro: 'Ej.: 256 mm',
  'Espesor mínimo': 'Ej.: 20 mm',
  'Índice de carga': 'Ej.: 88H',
  Voltaje: 'Ej.: 12 V',
  Capacidad: 'Ej.: 45 Ah',
  'Tipo de bombillo': 'Ej.: H4',
  Potencia: 'Ej.: 55 W',
  Amperaje: 'Ej.: 10 A',
  'Longitud conductor': 'Ej.: 24"',
  'Longitud pasajero': 'Ej.: 16"',
  'Tipo de anclaje': 'Ej.: gancho',
  Tipo: 'Como lo indique el manual o la pieza',
  Medida: 'Como aparece en la pieza',
};

const EXAMPLES_BY_PART: Record<string, Record<string, string>> = {
  tire_front: { Medida: 'Ej.: 185/65 R15', Tipo: 'Ej.: radial' },
  tire_rear: { Medida: 'Ej.: 185/65 R15', Tipo: 'Ej.: radial' },
  brake_shoes: { Medida: 'Ej.: 200 x 40 mm' },
  brake_fluid: { Tipo: 'Ej.: DOT 4' },
  coolant: { Tipo: 'Ej.: orgánico (OAT)' },
  battery: { Tipo: 'Ej.: sellada' },
  oil_filter: { Tipo: 'Ej.: de rosca' },
  air_filter: { Tipo: 'Ej.: panel' },
  cabin_filter: { Tipo: 'Ej.: con carbón activado' },
  front_suspension: { Tipo: 'Ej.: amortiguador a gas' },
  rear_shock: { Tipo: 'Ej.: amortiguador a gas' },
};

export function specExample(code: string, field: string): string {
  return EXAMPLES_BY_PART[code]?.[field] ?? EXAMPLES[field] ?? 'Como lo indique el manual o la pieza';
}

export type SpecValue = { field: string; key: `part:${string}`; value?: string; placeholder: string };

/** Los campos del repuesto con lo que anotó el usuario (vacío = sin anotar). */
export function partSpecs(code: string, sheet: CarSheet): SpecValue[] {
  const part = findPart(code);
  if (!part) return [];
  return part.specFields.map((field) => {
    const key = partSpecKey(code, field);
    const value = sheet[key]?.trim();
    return { field, key, value: value || undefined, placeholder: specExample(code, field) };
  });
}

/** "5W-30 · sintético" para la lista; undefined si no anotó nada. */
export function partSpecSummary(code: string, sheet: CarSheet): string | undefined {
  const values = partSpecs(code, sheet)
    .map((s) => s.value)
    .filter((v): v is string => !!v);
  return values.length > 0 ? values.join(' · ') : undefined;
}

/** Repuestos que ya tienen un dato equivalente en la ficha del carro (para mostrarlo también). */
export const FICHA_FIELD_FOR_PART: Partial<Record<string, { key: keyof CarSheet; label: string }>> = {
  oil: { key: 'oil', label: 'Aceite que usa' },
  spark_plug: { key: 'sparkPlug', label: 'Bujías' },
  battery: { key: 'battery', label: 'Batería de 12 V' },
  tire_front: { key: 'tireFront', label: 'Medida llantas delanteras' },
  tire_rear: { key: 'tireRear', label: 'Medida llantas traseras' },
};

/** Repuestos con algo anotado, en el orden del catálogo: [código, resumen]. */
export function notedParts(sheet: CarSheet): { code: PartDefinition['code']; summary: string }[] {
  return PARTS.flatMap((part) => {
    const summary = partSpecSummary(part.code, sheet);
    return summary ? [{ code: part.code, summary }] : [];
  });
}

/** Datos de la ficha del carro (sin contar lo anotado en Repuestos). */
export function sheetFieldCount(sheet: CarSheet): number {
  return Object.keys(sheet).filter((k) => !k.startsWith('part:') && sheet[k as keyof CarSheet]).length;
}
