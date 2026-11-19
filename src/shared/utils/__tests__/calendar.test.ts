/** Calendario: saltar por año y por mes respetando los límites de cada campo. */
import { documentDetailRows } from '@/features/documents/presentation';
import { validateDocument } from '@/features/documents/validation';
import type { DocumentRecord } from '@/features/history/types';

import {
  CALENDAR_MIN_YEAR,
  isMonthSelectable,
  isYearInRange,
  MONTH_SHORT,
  pageHasYears,
  yearPage,
  yearPageStart,
  yearRange,
} from '../calendar';

const NOW = new Date(2026, 9, 7);

describe('página de años (12 por página)', () => {
  it('2033 → 2028–2039', () => {
    expect(yearPageStart(2033)).toBe(2028);
    expect(yearPage(2033)).toEqual([2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039]);
  });

  it('los límites de página caen en el mismo grupo', () => {
    expect(yearPageStart(2028)).toBe(2028);
    expect(yearPageStart(2039)).toBe(2028);
    expect(yearPageStart(2040)).toBe(2040);
    expect(yearPageStart(2026)).toBe(2016);
  });
});

describe('rango de años según min/max', () => {
  it('sin máximo (vencimientos): hasta el año actual + 30; sin mínimo: desde 1950', () => {
    expect(yearRange(undefined, undefined, NOW)).toEqual({ from: CALENDAR_MIN_YEAR, to: 2056 });
  });

  it('con límites: los años del campo', () => {
    expect(yearRange(new Date(2020, 5, 1), new Date(2026, 9, 7), NOW)).toEqual({ from: 2020, to: 2026 });
  });

  it('años fuera del rango no se pueden elegir; las flechas se apagan si la página no tiene ninguno', () => {
    const range = yearRange(undefined, NOW, NOW); // por defecto: hasta hoy
    expect(isYearInRange(2026, range)).toBe(true);
    expect(isYearInRange(2027, range)).toBe(false);
    expect(pageHasYears(2028, range)).toBe(false);
    expect(pageHasYears(2016, range)).toBe(true);
    expect(pageHasYears(1932, range)).toBe(false); // 1932–1943, antes de 1950
    expect(pageHasYears(1944, range)).toBe(true); // 1944–1955 incluye 1950
  });
});

describe('¿el mes es elegible?', () => {
  it('un mes es elegible si al menos uno de sus días lo es', () => {
    const min = new Date(2026, 3, 30); // 30 de abril
    const max = new Date(2026, 9, 1); // 1 de octubre
    expect(isMonthSelectable(2026, 2, min, max)).toBe(false); // marzo: todo antes del mínimo
    expect(isMonthSelectable(2026, 3, min, max)).toBe(true); // abril: el 30 sirve
    expect(isMonthSelectable(2026, 9, min, max)).toBe(true); // octubre: el 1 sirve
    expect(isMonthSelectable(2026, 10, min, max)).toBe(false); // noviembre: después del máximo
  });

  it('sin límites, todos los meses', () => {
    expect(MONTH_SHORT.every((_, m) => isMonthSelectable(2033, m))).toBe(true);
    expect(MONTH_SHORT).toHaveLength(12);
  });
});

describe('documentos sin fecha de expedición', () => {
  const input = {
    type: 'soat' as const,
    otherName: '',
    notApplicable: false,
    hasExpiry: true,
    expiresAt: new Date(2027, 9, 1),
    taxYear: null,
    taxState: 'pending' as const,
    costCop: null,
    paidAt: null,
    currentYear: 2026,
  };

  it('el vencimiento ya no se compara con la expedición', () => {
    expect(validateDocument(input)).toEqual({});
    expect(validateDocument({ ...input, expiresAt: null }).expiresAt).toBe('Elige la fecha de vencimiento.');
  });

  it('si un documento ya tenía expedición, se sigue mostrando; si no, la fila no aparece', () => {
    const base: DocumentRecord = { id: 'd1', kind: 'document', date: '2026-10-01', docType: 'soat', expiresAt: '2027-10-01' };
    const visible = (r: DocumentRecord) => documentDetailRows(r).filter((row) => row.value !== undefined).map((row) => row.label);
    expect(visible({ ...base, issuedAt: '2026-10-01' })).toContain('Expedición');
    expect(visible(base)).not.toContain('Expedición');
  });
});
