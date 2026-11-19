/** Identidad institucional: transparente, sin datos legales inventados ni datos personales. */
import { BRAND } from '@/config/brand';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

import { FOUNDER, PROVIDENTIA } from '../providentia';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync } = require('fs') as { existsSync: (path: string) => boolean };

const allText = JSON.stringify({ PROVIDENTIA, FOUNDER });

describe('Providentia Tech: transparencia', () => {
  it('dice claramente que es un proyecto en construcción, no una empresa registrada', () => {
    expect(PROVIDENTIA.status).toBe('Proyecto tecnológico en construcción');
    expect(PROVIDENTIA.transparency.join(' ')).toMatch(/no es una sociedad comercial registrada/i);
    expect(PROVIDENTIA.transparency.join(' ')).toMatch(/Cámara de Comercio/);
  });

  it('nunca afirma ser una empresa constituida ni inventa datos legales', () => {
    expect(allText).not.toMatch(/empresa (registrada|constituida)(?! ante)|sociedad comercial registrada(?!.*no)/i);
    expect(allText).not.toMatch(/\bNIT\b|razón social|matrícula mercantil|representante legal/i);
    // Los datos legales de la marca siguen vacíos (no se inventan).
    expect(Object.values(BRAND.legal).every((v) => v === undefined)).toBe(true);
  });

  it('no promete fechas, inversiones, empleados ni oficinas', () => {
    expect(allText).not.toMatch(/\b20\d\d\b|inversi|empleados|oficinas|clientes empresariales/i);
  });

  it('presenta los proyectos: RODEXA Moto, RODEXA Carro, No Toques el Rojo y futuros', () => {
    expect(PROVIDENTIA.projects.map((p) => p.title)).toEqual(['RODEXA Moto', 'RODEXA Carro', 'No Toques el Rojo', 'Futuros productos']);
  });
});

describe('Conoce al fundador: solo información profesional', () => {
  it('nombre, rol y formación', () => {
    expect(FOUNDER.name).toBe('Miguel Ángel Rodríguez Perdomo');
    expect(FOUNDER.role).toBe('Fundador y desarrollador de Providentia Tech');
    expect(FOUNDER.education).toBe('Ingeniero de Software en formación');
  });

  it('sin documento, dirección, teléfono, fecha de nacimiento ni foto inventada', () => {
    const founder = JSON.stringify(FOUNDER);
    expect(founder).not.toMatch(/c[ée]dula|documento|direcci[óo]n|tel[ée]fono|\+57|\b3\d{9}\b|naci[óo] el|\d{1,2}\/\d{1,2}\/\d{4}/i);
    expect(FOUNDER.photo).toBeUndefined();
  });
});

describe('navegación y textos', () => {
  it('las pantallas existen', () => {
    expect(existsSync('src/app/configuracion/providentia.tsx')).toBe(true);
    expect(existsSync('src/app/configuracion/fundador.tsx')).toBe(true);
    expect(existsSync('assets/images/providentia-logo.png')).toBe(true);
  });

  it('los textos de Ajustes existen en español e inglés', () => {
    for (const key of ['settings.contactProvidentia', 'settings.aboutProvidentia', 'settings.founder'] as const) {
      expect(es[key]).toBeTruthy();
      expect(en[key]).toBeTruthy();
    }
  });

  it('el contacto es el correo existente', () => {
    expect(BRAND.supportEmail).toBe('providentiatech.digital@gmail.com');
  });
});
