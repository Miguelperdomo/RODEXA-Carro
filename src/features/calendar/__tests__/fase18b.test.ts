/** Fase 18B: Mi carro organizado, calendario en Historial, filtro recordado y "+km desde la última vez". */
import type { DocumentSummary } from '@/features/cars/types';
import type { HistoryEntry } from '@/features/history/types';
import { kmSinceLast } from '@/features/odometer/sinceLast';
import type { RecurringExpense } from '@/features/recurring/rules';
import { searchDestinations } from '@/features/search/destinations';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

import { monthEvents, monthGrid, monthRainNote } from '../calendar';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(`src/${p}`, 'utf8');

describe('calendario', () => {
  const history: HistoryEntry[] = [{ id: 'k1', kind: 'odometer', date: '2026-11-03', km: 20000 }];
  const documents = [{ key: 'soat', title: 'SOAT', alertDate: '2026-11-20' }] as unknown as DocumentSummary[];
  const recurring: RecurringExpense[] = [{ id: 'r1', category: 'loan', amountCop: 500000, dayOfMonth: 31, note: 'Cuota del carro', createdAt: '2026-10-01' }];
  const events = monthEvents(2026, 10, { history, documents, recurring, describe: () => 'Kilometraje' });

  it('lo que hiciste, lo que vence, lo que pagas y los festivos de noviembre', () => {
    expect(events.get('2026-11-03')).toEqual([{ kind: 'done', title: 'Kilometraje' }]);
    expect(events.get('2026-11-20')).toEqual([{ kind: 'due', title: 'SOAT: vence' }]);
    // Día 31 en noviembre → el último día (30).
    expect(events.get('2026-11-30')).toEqual([{ kind: 'payment', title: 'Cuota del carro' }]);
    expect(events.get('2026-11-02')).toEqual([{ kind: 'holiday', title: 'Festivo: Todos los Santos' }]);
    expect(events.get('2026-11-16')).toEqual([{ kind: 'holiday', title: 'Festivo: Independencia de Cartagena' }]);
  });

  it('cuadrícula de lunes a domingo, con los días del mes anterior y siguiente', () => {
    const grid = monthGrid(2026, 10, events);
    expect(grid.length % 7).toBe(0);
    expect(grid[0]).toMatchObject({ date: '2026-10-26', inMonth: false });
    expect(grid.find((d) => d.date === '2026-11-01')).toMatchObject({ day: 1, inMonth: true });
  });

  it('temporada de lluvias en el mes (aproximada), solo donde hay fechas confirmadas', () => {
    expect(monthRainNote(2026, 10, '73')).toMatch(/segunda temporada de lluvias \(aproximada, según el IDEAM\)/);
    expect(monthRainNote(2026, 7, '73')).toBeUndefined();
    expect(monthRainNote(2026, 10, '91')).toBeUndefined();
  });

  it('se abre desde Mi carro y el buscador; la vista y el filtro de Historial se recuerdan', () => {
    expect(searchDestinations('calendario')[0].key).toBe('calendar');
    const screen = read('app/(tabs)/historial.tsx');
    expect(screen).toContain("update({ historyFilter: next === 'all' ? '' : next })");
    expect(screen).toContain('update({ historyView: next })');
    expect(screen).toContain('<CalendarView />');
    expect(DEFAULT_SETTINGS.historyView).toBe('list');
  });
});

describe('Mi carro organizado', () => {
  const screen = read('app/(tabs)/carro.tsx');

  it('accesos rápidos, ayuda en la vía y grupos plegables que se recuerdan', () => {
    expect(screen).toContain('title="Accesos rápidos"');
    expect(screen).toContain('title="Ayuda en la vía"');
    for (const g of ['Mantenimiento', 'Documentos', 'Mi dinero', 'Para no olvidar', 'Servicios', 'Mi carro']) {
      expect(screen).toContain(`title="${g}"`);
    }
    expect(screen).toContain('update({ carOpenGroups:');
    expect(DEFAULT_SETTINGS.carOpenGroups).toBe('maintenance,documents');
  });

  it('ninguna opción se perdió al reorganizar', () => {
    for (const route of [
      '/mi-carro/editar',
      '/documentos',
      '/mi-carro/presupuesto',
      '/mi-carro/gastos-fijos',
      '/mi-carro/credito',
      '/ingresos',
      '/ahorro',
      '/mi-carro/recordatorios',
      '/mi-carro/pico-y-placa',
      '/revision-semanal',
      '/emergencia',
      '/varado',
      '/parqueadero',
      '/mi-carro/contactos',
      '/mi-carro/ficha',
      '/talleres',
      '/mis-repuestos',
      '/inscribir',
    ]) {
      expect(screen).toContain(`router.push('${route}')`);
    }
    expect(screen).toContain("openSite('simit')");
    expect(screen).toContain("openSite('runt')");
  });
});

describe('"+342 km desde la última vez"', () => {
  it('diferencia entre las dos últimas lecturas reales; sin dos lecturas no dice nada', () => {
    const history: HistoryEntry[] = [
      { id: 'a', kind: 'odometer', date: '2026-10-01', km: 20000 },
      { id: 'b', kind: 'odometer', date: '2026-11-01', km: 20342 },
    ];
    expect(kmSinceLast(history)).toBe(342);
    expect(kmSinceLast(history.slice(0, 1))).toBeUndefined();
    expect(read('features/cars/components/OdometerCard.tsx')).toContain('desde la última vez');
  });
});
