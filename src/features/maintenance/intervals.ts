import type { CarProfile, EnergySource } from '@/features/cars/types';
import { isVerifiableSource, type InfoSource } from '@/shared/types/source';

import type { ComponentCode } from './catalog';
import { MANUFACTURER_INTERVALS } from './data/manufacturerIntervals';

/**
 * Intervalos de mantenimiento. RODEXA Carro NO tiene intervalos propios: un
 * intervalo solo existe si
 *  1. lo configuró el usuario ("user"), o
 *  2. viene del fabricante / manual con fuente verificable ("manufacturer").
 * Si no hay ninguno, no se inventa: la pantalla pide consultar el manual.
 */
export type ManufacturerInterval = {
  modelId: string;
  years?: { from?: number; to?: number };
  /** Si el intervalo solo vale para ciertas fuentes de energía (p. ej. solo la versión diésel). */
  energySources?: EnergySource[];
  component: ComponentCode;
  km?: number;
  months?: number;
  /** Condición de uso según la fuente ("Uso normal", "Uso severo"…). */
  condition?: string;
  source: InfoSource;
};

export type IntervalOrigin = 'user' | 'manufacturer';

/** Intervalo ya resuelto para un componente. */
export type ComponentInterval = {
  km?: number;
  months?: number;
  origin: IntervalOrigin;
  /** Solo si origin = "manufacturer". */
  source?: InfoSource;
  condition?: string;
};

/** Mensaje cuando no hay intervalo: nunca se completa con una cifra genérica. */
export const NO_INTERVAL_MESSAGE = 'Consulta el manual de tu carro para configurar este intervalo.';

const hasValue = (i: { km?: number; months?: number }) =>
  (i.km !== undefined && i.km > 0) || (i.months !== undefined && i.months > 0);

function matches(entry: ManufacturerInterval, profile: CarProfile, component: ComponentCode): boolean {
  if (entry.component !== component || entry.modelId !== profile.modelId) return false;
  if (entry.energySources && (!profile.energySource || !entry.energySources.includes(profile.energySource))) {
    return false;
  }
  if (entry.years) {
    // Si el intervalo depende del año y no sabemos el año, no se aplica.
    if (profile.year === undefined) return false;
    if (entry.years.from !== undefined && profile.year < entry.years.from) return false;
    if (entry.years.to !== undefined && profile.year > entry.years.to) return false;
  }
  return true;
}

/** Intervalo del fabricante para este carro, solo si tiene fuente verificable. */
export function findManufacturerInterval(
  profile: CarProfile,
  component: ComponentCode,
  table: readonly ManufacturerInterval[] = MANUFACTURER_INTERVALS,
): ManufacturerInterval | undefined {
  return table.find((e) => matches(e, profile, component) && isVerifiableSource(e.source) && hasValue(e));
}

/**
 * Intervalo que se usa para calcular el estado. Lo que configuró el usuario manda
 * (es su carro y su decisión); si no configuró nada, el del fabricante con fuente.
 */
export function resolveInterval(
  profile: CarProfile,
  component: ComponentCode,
  userInterval: { km?: number; months?: number } | undefined,
  table?: readonly ManufacturerInterval[],
): ComponentInterval | undefined {
  if (userInterval && hasValue(userInterval)) return { ...userInterval, origin: 'user' };
  const manufacturer = findManufacturerInterval(profile, component, table);
  if (!manufacturer) return undefined;
  return {
    km: manufacturer.km,
    months: manufacturer.months,
    origin: 'manufacturer',
    source: manufacturer.source,
    condition: manufacturer.condition,
  };
}

/** "Configurado por ti" / "Según fabricante/manual: Manual X · Pág. 12 · verificado 2026-05-01". */
export function intervalOriginText(interval: ComponentInterval): string {
  if (interval.origin === 'user') return 'Configurado por ti';
  const s = interval.source;
  const parts = [s?.name, s?.reference, s?.verifiedAt ? `verificado ${s.verifiedAt}` : undefined].filter(Boolean);
  return `Según fabricante/manual${parts.length ? `: ${parts.join(' · ')}` : ''}`;
}
