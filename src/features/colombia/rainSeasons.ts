import { findCity } from '@/features/catalogs/repository';
import { formatDate, parseISODate, toISODate } from '@/shared/utils/date';

/**
 * Temporadas de lluvias (IDEAM). Fechas APROXIMADAS: cada año cambian un poco y el IDEAM puede
 * anunciarlas antes o después.
 * - Regiones Andina y Caribe (régimen bimodal): de mediados de marzo a junio y de mediados de
 *   septiembre a finales de noviembre (la segunda suele ser la más intensa).
 * - Orinoquía, Amazonía, Chocó y San Andrés: llueve de otra forma y no confirmamos sus fechas,
 *   así que NO se avisa (sin dato, no se inventa).
 * Sin ciudad registrada se usan las dos temporadas (las de la mayoría del país).
 */
export type RainSeason = { key: string; label: string; start: string; end: string };

const TWO_SEASONS: Omit<RainSeason, 'key'>[] = [
  { label: 'primera temporada de lluvias', start: '03-15', end: '06-15' },
  { label: 'segunda temporada de lluvias', start: '09-15', end: '11-30' },
];

/** Departamentos (código DANE) sin fechas confirmadas: Orinoquía, Amazonía, Chocó y San Andrés. */
const NO_DATES_DEPARTMENTS = ['81', '85', '50', '99', '95', '94', '97', '91', '18', '86', '27', '88'];

export function seasonsForDepartment(departmentCode: string | undefined): Omit<RainSeason, 'key'>[] {
  if (departmentCode && NO_DATES_DEPARTMENTS.includes(departmentCode)) return [];
  return TWO_SEASONS;
}

export const departmentOfCity = (cityId: string | undefined) => findCity(cityId)?.departmentCode;

function seasonsAround(year: number, departmentCode: string | undefined): RainSeason[] {
  return [year, year + 1].flatMap((y) =>
    seasonsForDepartment(departmentCode).map((s, i) => ({
      key: `${y}-${i + 1}`,
      label: s.label,
      start: `${y}-${s.start}`,
      end: `${y}-${s.end}`,
    })),
  );
}

/** La temporada en la que estamos (o undefined). */
export function currentRainSeason(today: Date, departmentCode: string | undefined): RainSeason | undefined {
  const iso = toISODate(today);
  return seasonsAround(today.getFullYear(), departmentCode).find((s) => iso >= s.start && iso <= s.end);
}

/** "hasta el 30/11/2026, más o menos". */
export const seasonEndText = (s: RainSeason) => `hasta el ${formatDate(parseISODate(s.end))}, más o menos`;

/** Qué revisar con las lluvias (consejos generales de seguridad). */
export const RAIN_ADVICE =
  'Revisa las llantas, los frenos, las plumillas y las luces. Con piso mojado, maneja más despacio y deja más distancia.';
