/** "Me quedé varado": las guías aprobadas, sin pasos técnicos ni afirmaciones legales. */
import { APP_ROUTES } from '@/features/session/appRoutes';

import { findGuide, ROADSIDE_GUIDES } from '../guides';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };

describe('Me quedé varado', () => {
  it('las 5 guías aprobadas, en orden', () => {
    expect(ROADSIDE_GUIDES.map((g) => g.title)).toEqual([
      'Pinchazo',
      'El carro no prende (batería)',
      'Se recalentó',
      'Me quedé sin combustible',
      'Un ruido o una luz roja en el tablero',
    ]);
    expect(findGuide('overheat')?.steps).toContain('No abras la tapa del radiador con el motor caliente: puede quemarte.');
  });

  it('sin afirmaciones legales, multas ni plataformas', () => {
    const all = JSON.stringify(ROADSIDE_GUIDES);
    expect(all).not.toMatch(/ley|artículo|multa|obligatori|Uber|DiDi|Rappi/i);
  });

  it('se abre desde Mi carro y lleva al 123 y a los servicios de la ciudad', () => {
    expect(APP_ROUTES).toContain('varado');
    expect(readFileSync('src/app/(tabs)/carro.tsx', 'utf8')).toContain("router.push('/varado')");
    const screen = readFileSync('src/app/varado.tsx', 'utf8');
    expect(screen).toContain('callEmergency()');
    expect(screen).toContain("params: { tipo: 'mobile' }");
  });
});
