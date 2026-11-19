/** Más apps de RODEXA: la familia, sin mostrarse a sí misma, y "Avísame cuando salga". */
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

import { FAMILY_APPS, FAMILY_PROMISES, notifiedApps, toggleNotify } from '../familyApps';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync } = require('fs') as { existsSync: (path: string) => boolean };

describe('apps de la familia RODEXA', () => {
  it('en carro: Moto, Negocio, Hogar y Seguridad (no se muestra a sí misma)', () => {
    expect(FAMILY_APPS.map((a) => a.name)).toEqual(['RODEXA Moto', 'RODEXA Negocio', 'RODEXA Hogar', 'RODEXA Seguridad']);
    expect(FAMILY_APPS.some((a) => a.key === 'carro')).toBe(false);
  });

  it('claves únicas, todas con logo y en "Próximamente" sin enlace inventado', () => {
    const keys = FAMILY_APPS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const app of FAMILY_APPS) {
      expect(app.logo).toBeDefined();
      expect(app.status).toBe('soon');
      expect(app.url).toBeUndefined();
    }
    for (const file of ['rodexa-moto', 'rodexa-negocio', 'rodexa-hogar', 'rodexa-seguridad']) {
      expect(existsSync(`assets/images/apps/${file}.png`)).toBe(true);
    }
  });

  it('textos de carro y sin expresiones habladas', () => {
    const text = JSON.stringify([FAMILY_APPS, FAMILY_PROMISES]);
    expect(text).not.toMatch(/\bplata\b|te contamos|¡listo/i);
    expect(FAMILY_APPS[0].description).toMatch(/RODEXA Carro/);
  });

  it('las pantallas existen y están protegidas', () => {
    expect(existsSync('src/app/configuracion/apps.tsx')).toBe(true);
    expect(existsSync('src/app/configuracion/apps/[key].tsx')).toBe(true);
  });
});

describe('Avísame cuando salga', () => {
  it('prende y apaga el aviso de cada app', () => {
    const one = toggleNotify('', 'moto');
    expect(notifiedApps(one)).toEqual(['moto']);
    const two = toggleNotify(one, 'hogar');
    expect(notifiedApps(two)).toEqual(['moto', 'hogar']);
    expect(notifiedApps(toggleNotify(two, 'moto'))).toEqual(['hogar']);
    expect(notifiedApps('')).toEqual([]);
  });

  it('empieza sin avisos', () => {
    expect(DEFAULT_SETTINGS.familyAppsNotify).toBe('');
  });
});
