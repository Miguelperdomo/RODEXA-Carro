/** Pico y placa configurado por el usuario. Fechas de PRUEBA. */
import { buildReminderPlan } from '@/features/notifications/local/plan';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import { userDataActions } from '@/features/session/userDataActions';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { EMPTY_STORED_USER_DATA, sanitizeUserData } from '@/storage/userDataStore';

import {
  appliesOn,
  formatTime,
  formatWindows,
  from12h,
  officialSearchUrl,
  picoYPlacaReminders,
  sanitizePicoYPlaca,
  statusOn,
  statusText,
  to12h,
  toMinutes,
  upcomingDays,
  validateConfig,
  WEEKDAY_LABELS,
  type PicoYPlacaConfig,
} from '../rules';

// 1/10/2026 es jueves.
const THU = new Date(2026, 9, 1, 10, 0);

const config = (c: Partial<PicoYPlacaConfig> = {}): PicoYPlacaConfig => ({
  enabled: true,
  mode: 'weekdays',
  weekdays: [4], // jueves
  windows: [{ start: 360, end: 1260 }], // 6:00 a 21:00
  remindNightBefore: true,
  updatedAt: '2026-10-01',
  ...c,
});

describe('qué días aplica', () => {
  it('días de la semana', () => {
    expect(appliesOn(config(), THU)).toBe(true);
    expect(appliesOn(config(), new Date(2026, 9, 2))).toBe(false);
  });

  it('días pares o impares del mes, solo en los días de la semana elegidos', () => {
    const even = config({ mode: 'even_dates', weekdays: [1, 2, 3, 4, 5] });
    expect(appliesOn(even, new Date(2026, 9, 2))).toBe(true); // viernes 2
    expect(appliesOn(even, THU)).toBe(false); // jueves 1 (impar)
    expect(appliesOn(even, new Date(2026, 9, 4))).toBe(false); // domingo 4
    expect(appliesOn(config({ mode: 'odd_dates', weekdays: [1, 2, 3, 4, 5] }), THU)).toBe(true);
  });

  it('desactivado o sin configurar: nunca aplica', () => {
    expect(appliesOn(undefined, THU)).toBe(false);
    expect(appliesOn(config({ enabled: false }), THU)).toBe(false);
  });

  it('próximos días', () => {
    expect(upcomingDays(config(), THU, 3).map((d) => d.getDate())).toEqual([1, 8, 15]);
  });
});

describe('horario y textos', () => {
  it('formato de 12 horas como en Colombia', () => {
    expect(formatTime(360)).toBe('6:00 a. m.');
    expect(formatTime(1260)).toBe('9:00 p. m.');
    expect(formatTime(720)).toBe('12:00 m.');
    expect(formatTime(0)).toBe('12:00 a. m.');
    expect(formatWindows([{ start: 390, end: 510 }, { start: 900, end: 1170 }])).toBe('6:30 a. m. a 8:30 a. m. y 3:00 p. m. a 7:30 p. m.');
  });

  it('valida horas, minutos, días y que el fin sea después del inicio', () => {
    expect(toMinutes(6, 30)).toBe(390);
    expect(toMinutes(24, 0)).toBeUndefined();
    expect(toMinutes(6, 60)).toBeUndefined();
    expect(toMinutes(null, 0)).toBeUndefined();
    expect(validateConfig({ weekdays: [], windows: [{ start: 360, end: 1260 }] }, false).weekdays).toBeDefined();
    expect(validateConfig({ weekdays: [1], windows: [{ start: 600, end: 500 }] }, false).windows).toMatch(/mayor/);
    expect(validateConfig({ weekdays: [1], windows: [] }, true).windows).toMatch(/Revisa/);
    expect(validateConfig({ weekdays: [1], windows: [{ start: 360, end: 1260 }] }, false)).toEqual({});
  });

  it('estado: nunca dice que se puede circular', () => {
    expect(statusText(statusOn(undefined, THU))).toMatch(/Configura/);
    expect(statusText(statusOn(config(), THU))).toBe('Hoy tienes pico y placa · 6:00 a. m. a 9:00 p. m. · según lo que configuraste');
    expect(statusText(statusOn(config({ weekdays: [5] }), THU))).toBe('Hoy no tienes pico y placa · próximo: mañana · según lo que configuraste');
    expect(statusText(statusOn(config({ weekdays: [1] }), THU))).toBe('Hoy no tienes pico y placa · próximo: lunes 5 de octubre · según lo que configuraste');
    for (const s of [statusOn(config(), THU), statusOn(config({ weekdays: [5] }), THU)]) {
      expect(statusText(s)).not.toMatch(/puedes circular|puede circular/i);
    }
  });

  it('enlace de consulta: búsqueda con la ciudad del usuario', () => {
    expect(officialSearchUrl('Ibagué')).toBe(`https://www.google.com/search?q=${encodeURIComponent('pico y placa Ibagué Secretaría de Movilidad')}`);
    expect(officialSearchUrl(undefined)).toContain(encodeURIComponent('pico y placa Secretaría de Movilidad'));
  });
});

describe('recordatorios', () => {
  it('la noche anterior a las 8:00 p. m., para los días con pico y placa de los próximos 14 días', () => {
    const list = picoYPlacaReminders(config({ weekdays: [1, 2, 3, 4, 5] }), THU);
    // Del viernes 2 al jueves 15: 2, 5–9 y 12–15.
    expect(list.map((r) => r.id.slice(-2))).toEqual(['02', '05', '06', '07', '08', '09', '12', '13', '14', '15']);
    // Semanal (solo jueves): 8 y 15, no 7 semanas.
    expect(picoYPlacaReminders(config(), THU).map((r) => r.id)).toEqual(['pyp-2026-10-08', 'pyp-2026-10-15']);
    expect(list[0]).toMatchObject({ id: 'pyp-2026-10-02', category: 'picoYPlaca', href: '/mi-carro/pico-y-placa' });
    expect(list[0].fireAt).toEqual(new Date(2026, 9, 1, 20, 0, 0, 0));
    expect(list[0].body).toMatch(/según lo que configuraste/);
  });

  it('después de las 8:00 p. m. no programa el de mañana (nunca en el pasado)', () => {
    const late = new Date(2026, 9, 1, 21, 0);
    expect(picoYPlacaReminders(config({ weekdays: [5] }), late)).toHaveLength(1); // el viernes 2 ya pasó: solo el 9
    expect(picoYPlacaReminders(config({ weekdays: [5] }), late)[0].id).toBe('pyp-2026-10-09');
  });

  it('sin recordatorio, desactivado o sin configurar: nada', () => {
    expect(picoYPlacaReminders(config({ remindNightBefore: false }), THU)).toEqual([]);
    expect(picoYPlacaReminders(config({ enabled: false }), THU)).toEqual([]);
    expect(picoYPlacaReminders(undefined, THU)).toEqual([]);
  });

  it('se suman al plan sin quitarle el día a los demás avisos', () => {
    const data = buildAppDataFromOnboarding(
      {
        user: { name: 'Ana', city: '' },
        profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
        km: 10000,
        maintenance: [],
        documents: { soatExpiresAt: '2026-10-09' },
        completedAt: '2026-09-30',
      },
      THU,
    );
    const without = buildReminderPlan(data, DEFAULT_SETTINGS, THU);
    const withPyp = buildReminderPlan(data, DEFAULT_SETTINGS, THU, config({ weekdays: [5] }));
    expect(withPyp.filter((r) => r.category !== 'picoYPlaca')).toEqual(without);
    expect(withPyp.filter((r) => r.category === 'picoYPlaca').length).toBeGreaterThan(0);
  });
});

describe('guardado', () => {
  it('se guarda, se lee y se quita sin tocar lo demás', () => {
    const saved = userDataActions.setPicoYPlaca(EMPTY_STORED_USER_DATA, config());
    expect(sanitizeUserData(JSON.parse(JSON.stringify(saved))).data.picoYPlaca).toEqual(config());
    const removed = userDataActions.setPicoYPlaca(saved, null);
    expect('picoYPlaca' in removed).toBe(false);
    expect(removed).toEqual(EMPTY_STORED_USER_DATA);
  });

  it('datos anteriores sin pico y placa siguen funcionando', () => {
    const { data, problems } = sanitizeUserData({ ...EMPTY_STORED_USER_DATA });
    expect(data.picoYPlaca).toBeUndefined();
    expect(problems).toEqual([]);
  });

  it('una configuración dañada se ignora sin borrar nada más', () => {
    expect(sanitizePicoYPlaca({ enabled: true, mode: 'raro' })).toBeUndefined();
    expect(sanitizePicoYPlaca({ ...config(), weekdays: [9] })).toBeUndefined();
    expect(sanitizePicoYPlaca({ ...config(), windows: [{ start: 2000, end: 10 }] })).toBeUndefined();
    const { data, problems } = sanitizeUserData({ ...EMPTY_STORED_USER_DATA, picoYPlaca: { roto: true } });
    expect(data.picoYPlaca).toBeUndefined();
    expect(problems).toContain('pico y placa inválido');
  });
});

describe('horario de 12 horas y días con nombre completo', () => {
  it('los días se muestran con su nombre completo', () => {
    expect(WEEKDAY_LABELS).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
  });

  it('a. m. / p. m. se convierten bien, incluidas las 12 del mediodía y la medianoche', () => {
    expect(from12h(6, 0, 'am')).toBe(360);
    expect(from12h(2, 0, 'pm')).toBe(840);
    expect(from12h(9, 30, 'pm')).toBe(1290);
    expect(from12h(12, 0, 'pm')).toBe(720);
    expect(from12h(12, 0, 'am')).toBe(0);
    expect(from12h(0, 0, 'am')).toBeUndefined();
    expect(from12h(13, 0, 'pm')).toBeUndefined();
    expect(from12h(6, 60, 'am')).toBeUndefined();
  });

  it('lo guardado se vuelve a mostrar igual (ida y vuelta)', () => {
    for (const minutes of [0, 360, 719, 720, 840, 1260, 1439]) {
      const t = to12h(minutes);
      expect(from12h(t.hour, t.minute, t.period)).toBe(minutes);
    }
    expect(to12h(840)).toEqual({ hour: 2, minute: 0, period: 'pm' });
  });

  it('el error explica el formato de 12 horas', () => {
    expect(validateConfig({ weekdays: [1], windows: [] }, true).windows).toMatch(/de 1 a 12/);
  });
});
