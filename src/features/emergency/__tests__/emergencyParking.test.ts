/** Emergencia, consultas oficiales (SIMIT y RUNT) y "¿Dónde lo parqueé?". */
import { hasPlace, levelLabel, parkingLabel, sanitizeParking, sinceLabel } from '@/features/parking/parking';
import { APP_ROUTES } from '@/features/session/appRoutes';

import { ACCIDENT_STEPS, accidentDataText, cleanPlate, EMERGENCY_NUMBER, OFFICIAL_SITES } from '../officialLinks';

describe('consultas oficiales', () => {
  it('SIMIT y RUNT en sus dominios oficiales (solo se abren)', () => {
    expect(new URL(OFFICIAL_SITES.simit.url).hostname).toBe('fcm.org.co');
    expect(new URL(OFFICIAL_SITES.runt.url).hostname).toMatch(/\.runt\.gov\.co$/);
    expect(Object.values(OFFICIAL_SITES).every((s) => s.url.startsWith('https://'))).toBe(true);
  });

  it('la placa se copia limpia para pegarla', () => {
    expect(cleanPlate('abc-123')).toBe('ABC123');
    expect(cleanPlate(' qqo 54g ')).toBe('QQO54G');
  });
});

describe('Tuve un accidente', () => {
  it('el 123 y pasos generales, sin afirmaciones legales', () => {
    expect(EMERGENCY_NUMBER).toBe('123');
    expect(ACCIDENT_STEPS.join(' ')).toMatch(/llama al 123/);
    expect(ACCIDENT_STEPS.join(' ')).not.toMatch(/multa|ley|artículo|obligatori/i);
  });

  it('"Copiar mis datos" usa solo lo registrado', () => {
    const text = accidentDataText(
      'Ana',
      { brandName: 'Kia', model: 'Picanto', plate: 'abc123' },
      { issuer: 'Seguros X', number: '987', expiresAt: '2027-03-01' },
    );
    expect(text).toBe('Conductor: Ana\nCarro: Kia Picanto\nPlaca: ABC123\nSOAT: Seguros X\nPóliza SOAT: 987\nSOAT vigente hasta: 01/03/2027');
    // Sin datos del SOAT: no se inventa nada.
    expect(accidentDataText(undefined, { brandName: 'Kia', model: 'Picanto' }, undefined)).toBe('Carro: Kia Picanto');
  });

  it('las pantallas están protegidas (solo después del primer ingreso)', () => {
    expect(APP_ROUTES).toContain('emergencia');
    expect(APP_ROUTES).toContain('parqueadero');
  });
});

describe('¿Dónde lo parqueé?', () => {
  it('etiquetas', () => {
    expect(levelLabel('3')).toBe('Piso 3');
    expect(levelLabel('Sótano 2')).toBe('Sótano 2');
    expect(parkingLabel({ level: '3', zone: 'B', spot: '45', note: 'Unicentro' })).toBe('Piso 3 · Zona B · Puesto 45 · Unicentro');
  });

  it('hace cuánto', () => {
    const now = new Date('2026-11-06T12:00:00Z');
    expect(sinceLabel('2026-11-06T11:59:40Z', now)).toBe('hace un momento');
    expect(sinceLabel('2026-11-06T11:55:00Z', now)).toBe('hace 5 minutos');
    expect(sinceLabel('2026-11-06T10:00:00Z', now)).toBe('hace 2 horas');
    expect(sinceLabel('2026-11-05T12:00:00Z', now)).toBe('ayer');
  });

  it('sin lugar no se guarda; lo dañado se descarta', () => {
    expect(hasPlace({})).toBe(false);
    expect(hasPlace({ spot: '45' })).toBe(true);
    expect(sanitizeParking({ at: '2026-11-06T10:00:00Z', level: '3' })).toMatchObject({ level: '3' });
    expect(sanitizeParking({ at: 'no-fecha', level: '3' })).toBeNull();
    expect(sanitizeParking({ at: '2026-11-06T10:00:00Z' })).toBeNull();
    expect(sanitizeParking('basura')).toBeNull();
  });
});
