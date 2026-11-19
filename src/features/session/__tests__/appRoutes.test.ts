/** Toda pantalla fuera del primer ingreso queda protegida (o es pública a propósito). */
import { APP_ROUTES, PUBLIC_ROUTES } from '../appRoutes';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as {
  readdirSync: (path: string, options: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[];
};

/** Nombres de ruta de las pantallas sueltas de src/app (sin layouts, pestañas ni primer ingreso). */
function routeNames(dir = 'src/app', prefix = ''): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    if (item.isDirectory()) {
      if (item.name.startsWith('(')) return [];
      return routeNames(`${dir}/${item.name}`, `${prefix}${item.name}/`);
    }
    if (!item.name.endsWith('.tsx') || item.name === '_layout.tsx') return [];
    return [`${prefix}${item.name.replace(/\.tsx$/, '')}`];
  });
}

describe('pantallas protegidas antes del primer ingreso', () => {
  const files = routeNames().filter((name) => name !== 'nuevo');

  it('cada pantalla está protegida o es pública a propósito', () => {
    const declared = new Set<string>([...APP_ROUTES, ...PUBLIC_ROUTES]);
    expect(files.filter((name) => !declared.has(name))).toEqual([]);
  });

  it('no hay rutas declaradas que no existan', () => {
    const existing = new Set(files);
    expect([...APP_ROUTES, ...PUBLIC_ROUTES].filter((name) => !existing.has(name))).toEqual([]);
  });

  it('solo son públicos los legales y la ayuda (preguntas frecuentes, reportar y sugerir)', () => {
    expect([...PUBLIC_ROUTES].sort()).toEqual([
      'configuracion/ayuda',
      'configuracion/politica-privacidad',
      'configuracion/reportar',
      'configuracion/sugerir',
      'configuracion/terminos',
    ]);
  });
});
