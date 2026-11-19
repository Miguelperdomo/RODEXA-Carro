import { maintenanceLabel, type MaintenanceItemCode } from '@/features/maintenance/catalog';

import { PARTS } from './catalog';

/**
 * Repuestos de MI carro. RODEXA no tiene (ni inventa) un catálogo de todos los carros: cada
 * persona anota lo que le sirve al suyo (lo sabe ella o su mecánico) y la app lo guarda
 * ordenado: marca, referencia y la última compra (cuánto pagó y dónde). Con eso se pide por
 * WhatsApp o se busca en Google con un toque. Todo queda en el celular.
 */
export type PartType = MaintenanceItemCode | 'other';

export type PartPurchase = {
  /** Fecha ISO (AAAA-MM-DD). */
  date: string;
  priceCop?: number;
  /** Almacén o taller donde lo compró. */
  store?: string;
};

export type MyPart = {
  id: string;
  type: PartType;
  /** Marca y descripción: "Mobil 5W-30, 4 litros". En "Otro", también el nombre del repuesto. */
  name: string;
  /** Referencia o código: "PH6607", "185/65 R15". */
  reference?: string;
  note?: string;
  /** La última compra (si la anotó). */
  lastPurchase?: PartPurchase;
  createdAt: string;
};

export const MAX_PARTS = 100;
export const MAX_PART_TEXT = 80;

/** Tipos que se pueden elegir: los del catálogo de repuestos + "Otro". */
export const PART_TYPES: PartType[] = [...PARTS.map((p) => p.code as MaintenanceItemCode), 'other'];

export const partTypeLabel = (type: PartType) => (type === 'other' ? 'Otro repuesto' : maintenanceLabel(type));

/** Título en la lista: el tipo ("Filtro de aceite"); en "Otro", lo que escribió. */
export const partTitle = (part: MyPart) => (part.type === 'other' ? part.name : partTypeLabel(part.type));

/** Orden: como el catálogo (aceite, filtros, bujías…), "Otro" al final. */
export function sortParts(parts: MyPart[]): MyPart[] {
  const order = (t: PartType) => (t === 'other' ? PART_TYPES.length : PART_TYPES.indexOf(t));
  return [...parts].sort((a, b) => order(a.type) - order(b.type) || a.name.localeCompare(b.name, 'es'));
}

/** Lo que se escribe para pedirlo o buscarlo: "Filtro de aceite Bosch PH6607". */
function partQuery(part: MyPart): string {
  const what = part.type === 'other' ? part.name : `${partTypeLabel(part.type)} ${part.name}`;
  return [what, part.reference].filter((x) => x && x.trim()).join(' ').replace(/\s+/g, ' ').trim();
}

/** Mensaje para el almacén o el mecánico. */
export function partWhatsappText(part: MyPart, car: string): string {
  return `Hola, necesito ${partQuery(part)}${car ? ` para mi ${car}` : ''}. ¿Lo tienes y a cuánto?`;
}

/** wa.me sin número: WhatsApp deja elegir a quién mandarlo. */
export const partWhatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Búsqueda en Google con la referencia, la marca y el carro (sin tiendas inventadas). */
export const partSearchUrl = (part: MyPart, car: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${partQuery(part)} ${car}`.trim())}`;

export type PartInput = { type: PartType | null; name: string; priceCop: number | null };
export type PartErrors = { type?: string; name?: string; price?: string };

export function validatePart(input: PartInput): PartErrors {
  const errors: PartErrors = {};
  if (!input.type) errors.type = 'Elige qué repuesto es.';
  if (!input.name.trim()) errors.name = input.type === 'other' ? 'Escribe qué repuesto es.' : 'Escribe la marca o la descripción.';
  if (input.priceCop !== null && (input.priceCop <= 0 || input.priceCop > 100_000_000)) errors.price = 'Revisa el valor.';
  return errors;
}

const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const text = (v: unknown, max = MAX_PART_TEXT) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

/** Lectura tolerante: lo que no tiene la forma esperada se descarta. */
export function sanitizeParts(raw: unknown): MyPart[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .flatMap((v): MyPart[] => {
      if (typeof v !== 'object' || v === null) return [];
      const r = v as Record<string, unknown>;
      const name = text(r.name);
      if (typeof r.id !== 'string' || !PART_TYPES.includes(r.type as PartType) || !name || !isIso(r.createdAt)) return [];
      const p = r.lastPurchase as Record<string, unknown> | undefined;
      const purchase =
        p && typeof p === 'object' && isIso(p.date)
          ? {
              date: p.date,
              ...(typeof p.priceCop === 'number' && p.priceCop > 0 ? { priceCop: p.priceCop } : {}),
              ...(text(p.store) ? { store: text(p.store) } : {}),
            }
          : undefined;
      return [
        {
          id: r.id,
          type: r.type as PartType,
          name,
          createdAt: r.createdAt,
          ...(text(r.reference, 40) ? { reference: text(r.reference, 40) } : {}),
          ...(text(r.note, 200) ? { note: text(r.note, 200) } : {}),
          ...(purchase ? { lastPurchase: purchase } : {}),
        },
      ];
    })
    .slice(0, MAX_PARTS);
}
