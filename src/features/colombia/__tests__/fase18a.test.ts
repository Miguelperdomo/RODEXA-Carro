/** Fase 18A: festivos y puentes (Ley Emiliani), lluvias (IDEAM), buscador y km corregido. */
import type { HistoryEntry } from '@/features/history/types';
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { editedKmWarning } from '@/features/odometer/editCheck';
import { searchDestinations } from '@/features/search/destinations';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

import { colombianHolidays, easterSunday, isHoliday, longWeekends, nextLongWeekend } from '../holidays';
import { currentRainSeason, RAIN_ADVICE, seasonsForDepartment } from '../rainSeasons';

const dates = (year: number) => colombianHolidays(year).map((h) => h.date);

describe('festivos de Colombia (calculados por la ley)', () => {
  it('Pascua (algoritmo de Gauss)', () => {
    expect(easterSunday(2026)).toEqual(new Date(2026, 3, 5));
    expect(easterSunday(2027)).toEqual(new Date(2027, 2, 28));
  });

  it('2027: fechas confirmadas por varias fuentes (Reyes 11 ene, San José 22 mar, Semana Santa 25 y 26 mar)', () => {
    expect(dates(2027)).toEqual(expect.arrayContaining(['2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-12-08', '2027-12-25']));
  });

  it('Virgen de Chiquinquirá (Ley 2578 de 2026): en 2026 el descanso fue el lunes 13 de julio', () => {
    expect(isHoliday('2026-07-13')).toBe(true);
    expect(colombianHolidays(2025).some((h) => h.name === 'Virgen de Chiquinquirá')).toBe(false);
  });

  it('Ley Emiliani: los que se corren caen siempre en lunes', () => {
    const moved = ['Reyes Magos', 'San José', 'San Pedro y San Pablo', 'Asunción de la Virgen', 'Día de la Raza', 'Todos los Santos', 'Independencia de Cartagena'];
    for (const year of [2026, 2027, 2028]) {
      for (const h of colombianHolidays(year).filter((x) => moved.includes(x.name))) {
        const [y, m, d] = h.date.split('-').map(Number);
        expect(new Date(y, m - 1, d).getDay()).toBe(1);
      }
    }
  });

  it('puentes: festivo en lunes (sáb–lun) y Semana Santa de jueves a domingo', () => {
    const w = longWeekends(2027);
    expect(w).toContainEqual({ start: '2027-01-09', end: '2027-01-11', name: 'Reyes Magos', days: 3 });
    expect(w).toContainEqual({ start: '2027-03-25', end: '2027-03-28', name: 'Semana Santa', days: 4 });
    // Navidad 2026 cae en viernes: puente de viernes a domingo.
    expect(nextLongWeekend(new Date(2026, 11, 20))).toEqual({ start: '2026-12-25', end: '2026-12-27', name: 'Navidad', days: 3 });
    expect(nextLongWeekend(new Date(2027, 0, 2))?.start).toBe('2027-01-09');
  });

  it('aviso 3 días antes del puente, que abre la revisión de viaje (se puede apagar)', () => {
    const data = buildAppDataFromOnboarding(
      { user: { name: 'Ana', city: '' }, profile: { id: 'c', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' }, km: 1000, maintenance: [], documents: {}, completedAt: '2026-12-01' },
      new Date(2026, 11, 20),
    );
    const plan = buildReminderPlan(data, DEFAULT_SETTINGS, new Date(2026, 11, 20)).filter((r) => r.category === 'longWeekend');
    expect(plan[0]).toMatchObject({ id: 'puente-2026-12-25', href: '/revision-viaje' });
    expect(plan[0].fireAt.getDate()).toBe(22);
    expect(buildReminderPlan(data, { ...DEFAULT_SETTINGS, longWeekendReminders: false }, new Date(2026, 11, 20)).some((r) => r.category === 'longWeekend')).toBe(false);
  });
});

describe('temporadas de lluvias (IDEAM, aproximadas)', () => {
  it('Andina y Caribe: dos temporadas; sin fechas confirmadas, no se avisa', () => {
    expect(currentRainSeason(new Date(2026, 9, 20), '73')?.label).toBe('segunda temporada de lluvias');
    expect(currentRainSeason(new Date(2026, 3, 20), undefined)?.label).toBe('primera temporada de lluvias');
    expect(currentRainSeason(new Date(2026, 7, 1), '73')).toBeUndefined();
    // Orinoquía, Amazonía, Chocó y San Andrés: no confirmamos sus fechas.
    expect(seasonsForDepartment('91')).toEqual([]);
    expect(seasonsForDepartment('27')).toEqual([]);
    expect(RAIN_ADVICE).not.toMatch(/cadena/);
  });
});

describe('buscador "¿Qué quieres hacer?"', () => {
  it('sin tildes, con relleno y con una letra mal escrita', () => {
    expect(searchDestinations('crédito')[0].key).toBe('credit');
    expect(searchDestinations('credto')[0].key).toBe('credit');
    expect(searchDestinations('me quedé varado')[0].key).toBe('stranded');
    expect(searchDestinations('pico y placa')[0].key).toBe('pyp');
    expect(searchDestinations('xyzxyz')).toEqual([]);
  });

  it('nada de moto: sin chaleco, casco ni cadena', () => {
    const all = JSON.stringify(searchDestinations('chaleco casco cadena'));
    expect(all).toBe('[]');
  });
});

describe('corregir un km', () => {
  const history: HistoryEntry[] = [
    { id: 'a', kind: 'odometer', date: '2026-10-01', km: 20000 },
    { id: 'b', kind: 'odometer', date: '2026-10-10', km: 20500 },
    { id: 'c', kind: 'odometer', date: '2026-10-20', km: 21000 },
  ];

  it('avisa si queda menor que una lectura anterior o mayor que una posterior', () => {
    expect(editedKmWarning(history, 'b', '2026-10-10', 19000)).toMatch(/menor que lo que anotaste/);
    expect(editedKmWarning(history, 'b', '2026-10-10', 25000)).toMatch(/mayor que lo que anotaste después/);
    expect(editedKmWarning(history, 'b', '2026-10-10', 20600)).toBeUndefined();
  });
});
