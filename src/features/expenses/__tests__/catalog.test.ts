/** Gastos: el combustible se registra en Tanquear, no como gasto. */
import { EXPENSE_CATEGORIES, NEW_EXPENSE_CATEGORIES } from '../catalog';

describe('categorías de gasto', () => {
  it('un gasto nuevo no ofrece "Combustible"', () => {
    expect(NEW_EXPENSE_CATEGORIES.map((c) => c.code)).not.toContain('fuel');
    expect(NEW_EXPENSE_CATEGORIES).toHaveLength(EXPENSE_CATEGORIES.length - 1);
  });

  it('los gastos viejos de combustible se siguen mostrando con su nombre', () => {
    expect(EXPENSE_CATEGORIES.find((c) => c.code === 'fuel')?.label).toBe('Combustible');
  });
});

describe('categorías nuevas', () => {
  it('se pueden elegir en un gasto nuevo, sin códigos repetidos', () => {
    const labels = NEW_EXPENSE_CATEGORIES.map((c) => c.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Grúa / asistencia en carretera',
        'Patios / inmovilización',
        'Cerrajería',
        'Latonería y pintura',
        'Diagnóstico / escáner',
        'Lavado detallado / polichado',
        'Polarizado',
        'Trámites de tránsito',
        'Licencia de conducción',
        'Cuota del crédito o leasing',
        'Garaje o parqueadero mensual',
      ]),
    );
    const codes = EXPENSE_CATEGORIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('"Otros" sigue al final', () => {
    expect(NEW_EXPENSE_CATEGORIES.at(-1)?.code).toBe('other');
  });
});
