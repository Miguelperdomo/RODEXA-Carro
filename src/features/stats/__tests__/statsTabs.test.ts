/** Estadísticas en 3 pestañas: tendencia, "Lo que notamos" y categorías que abren Historial. */
import type { HistoryEntry } from '@/features/history/types';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

import { categoryLabel } from '../compute';
import { monthBars, monthInsights, totalsByMonth } from '../trend';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(`src/${p}`, 'utf8');

const expense = (id: string, date: string, amountCop: number, category = 'wash'): HistoryEntry =>
  ({ id, kind: 'expense', date, amountCop, category }) as HistoryEntry;

describe('tendencia por mes', () => {
  const entries = [expense('a', '2026-09-10', 100000), expense('b', '2026-11-02', 50000), expense('c', '2026-11-20', 30000)];

  it('suma por mes; un mes sin gastos es "sin datos" (nunca $0)', () => {
    const totals = totalsByMonth(entries);
    expect(totals.get('2026-11')).toBe(80000);
    expect(monthBars(totals, '2026-11', 3)).toEqual([
      { monthKey: '2026-09', totalCop: 100000 },
      { monthKey: '2026-10', totalCop: undefined },
      { monthKey: '2026-11', totalCop: 80000 },
    ]);
  });

  it('cruza de año sin problema', () => {
    expect(monthBars(new Map(), '2027-01', 3).map((b) => b.monthKey)).toEqual(['2026-11', '2026-12', '2027-01']);
  });
});

describe('Lo que notamos', () => {
  it('compara con tu promedio solo con al menos 2 meses anteriores y diferencias de 10 % o más', () => {
    const entries = [
      expense('a', '2026-08-10', 100000),
      expense('b', '2026-09-10', 100000),
      expense('c', '2026-10-10', 150000),
    ];
    const lines = monthInsights(entries, '2026-10', [{ key: 'wash', label: 'Lavado', icon: 'wash', amountCop: 150000, share: 1 }]);
    expect(lines).toEqual(['Gastaste 50 % más que tu promedio de los meses anteriores.', 'Lavado fue 50 % más que su promedio.']);
  });

  it('sin datos suficientes no dice nada (no se inventa)', () => {
    expect(monthInsights([expense('a', '2026-10-10', 1000)], '2026-10', [])).toEqual([]);
    const flat = [expense('a', '2026-08-10', 100000), expense('b', '2026-09-10', 100000), expense('c', '2026-10-10', 105000)];
    expect(monthInsights(flat, '2026-10', [])).toEqual([]);
  });
});

describe('pantalla', () => {
  const screen = read('app/(tabs)/estadisticas.tsx');

  it('3 pestañas que se recuerdan; no se perdió nada', () => {
    expect(screen).toContain("{ value: 'month', label: 'Mes' }");
    expect(screen).toContain("{ value: 'year', label: 'Año' }");
    expect(screen).toContain("{ value: 'records', label: 'Récords' }");
    expect(screen).toContain('update({ statsTab: next })');
    expect(DEFAULT_SETTINGS.statsTab).toBe('month');
    for (const piece of ['<EnergyBlockCard', 'Récords de tu carro', "router.push('/tu-ano')", 'Promedio diario', 'INFO_COST_PER_KM_YEAR']) {
      expect(screen).toContain(piece);
    }
    expect(screen).not.toMatch(/RODEXA Pro/);
  });

  it('tocar una categoría abre Historial con esa categoría', () => {
    expect(screen).toContain("params: { categoria: item.key }");
    expect(read('app/(tabs)/historial.tsx')).toContain('categoryOf(e) === category');
    expect(categoryLabel('wash')).toBe('Lavado');
    expect(categoryLabel('cng')).toBe('GNC');
  });
});
