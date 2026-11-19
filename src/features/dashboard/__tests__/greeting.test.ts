/** Saludo de Inicio: según la hora y sin género. */
import { validateEnergyRecord } from '@/features/energy/validation';
import { validateOdometerReading } from '@/features/odometer/validation';
import { formatWeekdayDate } from '@/shared/utils/date';

import { greeting, greetingSubtitle } from '../greeting';

const at = (hour: number, minute = 0) => new Date(2026, 9, 6, hour, minute);

describe('saludo según la hora', () => {
  it.each([
    [4, 59, 'Buenas noches'],
    [5, 0, 'Buenos días'],
    [11, 59, 'Buenos días'],
    [12, 0, 'Buenas tardes'],
    [18, 59, 'Buenas tardes'],
    [19, 0, 'Buenas noches'],
    [0, 0, 'Buenas noches'],
  ])('%i:%i → %s', (hour, minute, expected) => {
    expect(greeting(at(hour, minute), 'Susana')).toBe(`${expected}, Susana`);
  });
});

describe('nombre', () => {
  it('solo el primer nombre', () => {
    expect(greeting(at(15), 'Susana María Pérez')).toBe('Buenas tardes, Susana');
    expect(greeting(at(15), '  Susana   María ')).toBe('Buenas tardes, Susana');
  });

  it('sin nombre: solo el saludo, sin coma ni espacio vacío', () => {
    expect(greeting(at(15))).toBe('Buenas tardes');
    expect(greeting(at(15), '')).toBe('Buenas tardes');
    expect(greeting(at(15), '   ')).toBe('Buenas tardes');
  });
});

it('nunca dice "Bienvenido" ni "Bienvenida"', () => {
  for (let hour = 0; hour < 24; hour++) {
    for (const name of [undefined, '', 'Susana', 'Carlos Andrés']) {
      expect(greeting(at(hour, 30), name)).not.toMatch(/bienvenid/i);
    }
  }
});

describe('línea bajo el saludo', () => {
  it('con el apodo del carro', () => {
    expect(greetingSubtitle('La Negra')).toBe('Así va La Negra hoy.');
    expect(greetingSubtitle('  La Negra ')).toBe('Así va La Negra hoy.');
  });

  it('sin apodo: igual que antes', () => {
    expect(greetingSubtitle()).toBe('Así va tu carro hoy.');
    expect(greetingSubtitle('   ')).toBe('Así va tu carro hoy.');
  });
});

describe('fecha de "Hoy" en palabras', () => {
  it('"Martes 6 de octubre"', () => {
    expect(formatWeekdayDate(new Date(2026, 9, 6))).toBe('Martes 6 de octubre');
    expect(formatWeekdayDate(new Date(2026, 9, 4))).toBe('Domingo 4 de octubre');
    expect(formatWeekdayDate(new Date(2026, 8, 30))).toBe('Miércoles 30 de septiembre');
  });
});

describe('avisos de km sin género', () => {
  it('"¿El km está bien?" en vez de "¿Seguro que es correcto?"', () => {
    const odometer = validateOdometerReading({ newKm: 52_000, lastKm: 50_000, daysSinceLast: 1 }).warning;
    expect(odometer).toBe('Son 2.000 km más que tu último registro. ¿El km está bien?');
    const energy = validateEnergyRecord(
      { kind: 'fuel', date: new Date(2026, 9, 6), km: 52_000, quantity: 10, unit: 'gal', unitPriceCop: 16_000, costCop: 160_000 },
      { lastKm: 50_000, daysSinceLast: 1 },
    ).warnings.km;
    expect(energy).toBe('Son 2.000 km más que tu último registro. ¿El km está bien?');
    expect(`${odometer} ${energy}`).not.toMatch(/seguro|segura/i);
  });
});
