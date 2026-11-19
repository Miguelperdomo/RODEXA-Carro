/** Configuración reorganizada: secciones, atajos y opciones movidas (ninguna se pierde). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };

const read = (p: string) => readFileSync(`src/app/${p}`, 'utf8');
const settings = read('configuracion.tsx');

describe('Configuración', () => {
  it('cabecera con perfil y carro, y atajo de Tema sin emojis', () => {
    expect(settings).toMatch(/Cabecera: quién eres y tu carro/);
    expect(settings).toMatch(/SegmentedControl options=\{themeOptions\}/);
    expect(settings).not.toMatch(/[☀-➿\u{1F300}-\u{1FAFF}]/u);
  });

  it('secciones en orden: Mi carro, La app, Tus datos, Ayuda, RODEXA', () => {
    const order = ['"Mi carro"', '"La app"', '"Tus datos"', '"Ayuda"', '"RODEXA"'].map((t) => settings.indexOf(`title=${t}`));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('"Reportar un problema" a la vista', () => {
    expect(settings).toMatch(/router\.push\('\/configuracion\/reportar'\)/);
  });

  it('nada se pierde: cada opción sigue a un toque de distancia', () => {
    for (const route of ['perfil', 'mantenimiento', 'documentos', 'notificaciones', 'idioma', 'preferencias', 'datos', 'privacidad', 'ayuda', 'apps', 'acerca']) {
      expect(settings).toContain(`/configuracion/${route}'`);
    }
    expect(settings).toContain("router.push('/pro')");
    expect(settings).toContain("router.push('/mi-carro/presupuesto')");
  });
});

describe('opciones movidas', () => {
  it('el centro de notificaciones está dentro de Notificaciones', () => {
    expect(settings).not.toContain("router.push('/notificaciones')");
    expect(read('configuracion/notificaciones.tsx')).toContain("router.push('/notificaciones')");
  });

  it('Providentia y el fundador están dentro de "Acerca de"', () => {
    expect(settings).not.toContain('/configuracion/providentia');
    const about = read('configuracion/acerca.tsx');
    expect(about).toContain("router.push('/configuracion/providentia')");
    expect(about).toContain("router.push('/configuracion/fundador')");
  });

  it('"Restablecer preferencias" está al final de Preferencias generales', () => {
    expect(settings).not.toContain('resetPreferences');
    const prefs = read('configuracion/preferencias.tsx');
    expect(prefs.lastIndexOf("t('settings.resetPreferences')")).toBeGreaterThan(prefs.indexOf("t('prefs.dateFormat')"));
  });
});
