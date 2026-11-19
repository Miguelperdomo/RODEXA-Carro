/** Ingresos (ya no es "Próximamente"): sin plataformas y sin llamar "ganancia" a lo que queda. */
import { INCOME_COPY, WORK_TYPES } from '@/features/income/income';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync, readFileSync } = require('fs') as {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: string) => string;
};

describe('Ingresos', () => {
  const screen = readFileSync('src/app/ingresos.tsx', 'utf8');
  const form = readFileSync('src/app/registrar/ingreso.tsx', 'utf8');

  it('la pantalla existe y se abre desde Mi carro', () => {
    expect(existsSync('src/app/ingresos.tsx')).toBe(true);
    expect(readFileSync('src/app/(tabs)/carro.tsx', 'utf8')).toContain("router.push('/ingresos')");
  });

  it('ya no es una vista previa', () => {
    expect(screen).not.toMatch(/Próximamente|EJEMPLO/);
  });

  it('"Te quedó" no se presenta como ganancia exacta', () => {
    expect(screen).toContain('label="Te quedó"');
    expect(INCOME_COPY.disclaimer).toMatch(/Según lo que registraste/);
    expect(screen).not.toMatch(/Ganancia neta/i);
  });

  it('no nombra ninguna plataforma de transporte ni de domicilios', () => {
    const all = [screen, form, JSON.stringify(WORK_TYPES), JSON.stringify(INCOME_COPY)].join(' ');
    expect(all).not.toMatch(/Uber|DiDi|inDrive|Cabify|Rappi|Picap|Beat|iFood|Mensajeros Urbanos/i);
  });
});
