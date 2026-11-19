import type { EnergySource } from '@/features/cars/types';

import { describeEntry, entryCost } from './presentation';
import type { HistoryEntry } from './types';

/** "Tanqueo" → "tanqueo"; "Diésel" → "diesel" (para buscar sin tildes ni mayúsculas). */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Texto de búsqueda ya preparado, por registro (se calcula una vez, no en cada tecla). */
const textCache = new WeakMap<HistoryEntry, { source?: EnergySource; text: string }>();

/** Todo el texto de un registro en el que se puede buscar (lo que se ve + estación, lugar, notas…). */
function searchableText(entry: HistoryEntry, energySource?: EnergySource): string {
  const cached = textCache.get(entry);
  if (cached && cached.source === energySource) return cached.text;
  const text = buildSearchableText(entry, energySource);
  textCache.set(entry, { source: energySource, text });
  return text;
}

/**
 * Palabras de antes (o habladas) que deben seguir encontrando lo mismo: el historial se
 * busca también por "tanqueo", "tanqueada", "despinchada"… aunque la app ya no las use.
 */
const SYNONYMS: { matches: (entry: HistoryEntry) => boolean; words: string }[] = [
  { matches: (e) => e.kind === 'fuel', words: 'tanqueo tanqueos tanqueada tanqueadas tanquear carga de combustible' },
  { matches: (e) => e.kind === 'expense' && e.category === 'flat_tire', words: 'despinchada despinche despinchar pinchazo' },
];

function buildSearchableText(entry: HistoryEntry, energySource?: EnergySource): string {
  const view = describeEntry(entry, energySource);
  const extra: (string | undefined)[] = SYNONYMS.filter((s) => s.matches(entry)).map((s) => s.words);
  if (entry.kind === 'fuel' || entry.kind === 'cng') extra.push(entry.station);
  if (entry.kind === 'charge') extra.push(entry.location);
  if (entry.kind === 'document') extra.push(entry.issuer, entry.number, entry.name, entry.reference);
  extra.push('note' in entry ? entry.note : undefined);
  return normalize([view.title, view.subtitle, view.note, view.trailing, ...extra].filter(Boolean).join(' '));
}

/** ¿El registro contiene todas las palabras buscadas? Búsqueda vacía → todos. */
export function matchesQuery(entry: HistoryEntry, query: string, energySource?: EnergySource): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = searchableText(entry, energySource);
  return words.every((w) => text.includes(w));
}

export type HistoryTotals = {
  count: number;
  /** Suma de lo que cuenta como gasto (los registros sin costo no suman). */
  totalCop: number;
  withCost: number;
};

export function historyTotals(entries: HistoryEntry[]): HistoryTotals {
  const costs = entries.map(entryCost);
  return {
    count: entries.length,
    totalCop: costs.reduce((sum, c) => sum + c, 0),
    withCost: costs.filter((c) => c > 0).length,
  };
}
