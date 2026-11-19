/** RODEXA Pro (local): precios, Free/Pro, análisis, estado, informe y copia de seguridad. Datos de PRUEBA. */
import { PRO_PREVIEW_ENABLED } from '@/config/dev';
import type { EnergySource } from '@/features/cars/types';
import type { EnergyRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { OnboardingData } from '@/features/session/types';
import { wrap } from '@/storage/envelope';
import { USER_SCHEMA_VERSION } from '@/storage/migrations/userData';
import { EMPTY_STORED_USER_DATA, type StoredUserData } from '@/storage/userDataStore';

import { PURCHASE_UNAVAILABLE_MESSAGE, resolveProAccess, startProPurchase } from '../access';
import {
  analysisEnergyKinds,
  analyzeEnergy,
  analyzeExpenses,
  changeBetween,
  comparePeriods,
  maintenanceHistory,
  monthlySeries,
  proCategoryOf,
  proCategoryTotals,
} from '../analytics';
import { BACKUP_FORMAT, createBackup, parseBackup } from '../backup';
import * as config from '../config';
import { buildVehicleReport } from '../report';
import { analyzeState } from '../stateAnalysis';
import { shouldShowProLaunch } from '../components/ProLaunchCard';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

const expense = (date: string, category: string, amountCop: number): HistoryEntry =>
  ({ id: `e-${date}-${category}-${amountCop}`, kind: 'expense', date, category, amountCop }) as HistoryEntry;
const odometer = (date: string, km: number): HistoryEntry => ({ id: `o-${date}`, kind: 'odometer', date, km });
const fuel = (date: string, km: number | null, quantity: number, costCop?: number, fullTank = true): EnergyRecord => ({
  id: `f-${date}-${km}`,
  kind: 'fuel',
  date,
  km,
  quantity,
  unit: 'L',
  fullTank,
  costCop,
});
const charge = (date: string, km: number, quantity: number, costCop?: number): EnergyRecord => ({
  id: `c-${date}`,
  kind: 'charge',
  date,
  km,
  quantity,
  costCop,
  endPercent: 80,
});

const onboarding = (energySource: EnergySource = 'gasoline', overrides: Partial<OnboardingData> = {}): OnboardingData => ({
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', year: 2022, energySource },
  km: 10000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-28',
  ...overrides,
});

const appData = (records: HistoryEntry[] = [], energySource: EnergySource = 'gasoline', overrides: Partial<OnboardingData> = {}) =>
  buildAppDataFromOnboarding(onboarding(energySource, overrides), TODAY, { records });

const stored = (records: HistoryEntry[] = []): StoredUserData => ({
  ...EMPTY_STORED_USER_DATA,
  onboarding: onboarding(),
  records,
});

/** Nunca NaN ni Infinity en lo que llega a la pantalla. */
const expectFinite = (value: unknown) => {
  const text = JSON.stringify(value, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? `BAD:${v}` : v));
  expect(text).not.toMatch(/BAD:|NaN|Infinity/);
};

describe('precios y planes', () => {
  it('7.900 al mes y 59.900 al año; el ahorro y el equivalente mensual se calculan', () => {
    expect(config.PRO_MONTHLY_PRICE).toBe(7900);
    expect(config.PRO_YEARLY_PRICE).toBe(59900);
    expect(config.PRO_MONTHLY_PRICE_PER_YEAR).toBe(94800);
    expect(config.PRO_YEARLY_SAVINGS).toBe(34900);
    expect(config.PRO_YEARLY_MONTHLY_EQUIVALENT).toBe(4992);
  });

  it('textos de la propuesta', () => {
    expect(config.FREE_TAGLINE).toBe('Controla tu carro.');
    expect(config.PRO_TAGLINE).toBe('Entiende cuánto cuesta, cómo lo estás cuidando y cómo se está comportando.');
    expect(config.PRO_HEADLINE).toBe('Más control. Más información. Más claridad sobre tu carro.');
  });

  it('23 funciones en 6 grupos, cada una en un grupo existente y con su explicación', () => {
    expect(config.PRO_FEATURES).toHaveLength(23);
    expect(config.PRO_GROUPS.map((g) => g.title)).toEqual([
      'Ahorra y controla tus gastos',
      'Asistente Pro',
      'Análisis',
      'Comodidad',
      'Personalización',
      'Beneficios',
    ]);
    const groups = new Set(config.PRO_GROUPS.map((g) => g.key));
    expect(config.PRO_FEATURES.every((f) => groups.has(f.group) && f.description.length > 20)).toBe(true);
    const keys = config.PRO_FEATURES.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('conserva las funciones que ya tienen pantalla en carro', () => {
    const href = (key: string) => config.PRO_FEATURES.find((f) => f.key === key)?.href;
    expect(href('advanced_stats')).toBe('/pro/analisis');
    expect(href('state')).toBe('/pro/estado');
    expect(href('report')).toBe('/pro/informe');
    expect(href('life_record')).toBe('/hoja-de-vida');
  });

  it('adaptado a carro: nada de motos, cadena ni kit de arrastre, y sin emojis en los títulos', () => {
    const all = JSON.stringify([config.PRO_FEATURES, config.PRO_GROUPS, config.PRO_FAQ, config.PRO_COMPARISON]);
    expect(all).not.toMatch(/moto|cadena|kit de arrastre|plata/i);
    expect(all).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(config.PRO_FEATURES.map((f) => f.title)).toContain('Varios carros');
  });

  it('nada inventado: sin testimonios ni "el más elegido"', () => {
    expect(JSON.stringify(config)).not.toMatch(/más elegido|testimonio|opini[oó]n de usuarios|\d+ ?usuarios/i);
  });

  it('prueba gratis y preguntas frecuentes (cancelar, datos, varios carros, otro celular)', () => {
    expect(config.PRO_TRIAL_DAYS).toBe(7);
    const questions = config.PRO_FAQ.map((f) => f.question).join(' ');
    expect(questions).toMatch(/7 días/);
    expect(questions).toMatch(/cancelar/);
    expect(questions).toMatch(/mis datos/);
    expect(questions).toMatch(/varios carros/);
    expect(questions).toMatch(/otro celular/);
    expect(config.PRO_FAQ.find((f) => /varios carros/.test(f.question))?.answer).toMatch(/solo lectura/);
  });

  it('el aviso del lanzamiento solo aparece cuando Pro exista, a quien lo pidió, una vez', () => {
    expect(shouldShowProLaunch(config.PRO_AVAILABLE, true, false)).toBe(false); // hoy: Próximamente
    expect(shouldShowProLaunch(true, true, false)).toBe(true);
    expect(shouldShowProLaunch(true, false, false)).toBe(false);
    expect(shouldShowProLaunch(true, true, true)).toBe(false);
  });

  it('Pro está "Próximamente": no disponible para comprar', () => {
    expect(config.PRO_AVAILABLE).toBe(false);
    expect(config.PRO_STATUS_LABEL).toBe('Próximamente');
  });

  it('sin anuncios: Free hoy no tiene publicidad ni librerías de anuncios', () => {
    const pkg = require('../../../../package.json') as { dependencies: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ');
    expect(deps).not.toMatch(/admob|google-mobile-ads|ads|billing|iap|purchase|revenuecat/i);
    // "Sin anuncios" es un beneficio Pro para cuando Free tenga publicidad: no se repite en Free.
    expect(config.FREE_FEATURES).not.toContain('Sin anuncios');
    expect(config.PRO_FEATURES.find((f) => f.key === 'no_ads')?.description).toMatch(/no tiene anuncios/);
  });

  it('lo esencial sigue en Free', () => {
    expect(config.FREE_FEATURES).toEqual(
      expect.arrayContaining(['Mantenimiento', 'Documentos', 'Gastos', 'Historial', 'Recordatorios', 'Revisión para viajar', 'Copia de seguridad (exportar e importar)']),
    );
  });
});

describe('Free / Pro', () => {
  it('sin pagos nadie es Pro; solo la vista previa de desarrollo lo enciende (apagada por defecto)', () => {
    expect(resolveProAccess(false)).toEqual({ isPro: false, source: 'free' });
    expect(resolveProAccess(true)).toEqual({ isPro: true, source: 'dev_preview' });
    expect(PRO_PREVIEW_ENABLED).toBe(false);
  });

  it('el botón de compra no simula pagos ni activa Pro', async () => {
    await expect(startProPurchase('yearly')).resolves.toEqual({ status: 'unavailable', message: PURCHASE_UNAVAILABLE_MESSAGE });
    expect(resolveProAccess(PRO_PREVIEW_ENABLED).isPro).toBe(false);
  });
});

describe('gastos', () => {
  it('sin datos: nada inventado, sin NaN', () => {
    const analysis = analyzeExpenses([], TODAY);
    expect(analysis).toMatchObject({ hasData: false, accumulatedCop: 0, monthsCovered: 0, monthlyAverageCop: undefined, topCategory: undefined });
    expect(analysis.series).toHaveLength(12);
    expect(analysis.series.every((p) => p.costPerKmCop === undefined)).toBe(true);
    expectFinite(analysis);
  });

  it('categorías Pro: repuestos, póliza, impuesto, otros documentos y otros gastos', () => {
    const doc = (docType: string, costCop: number): HistoryEntry =>
      ({ id: `d-${docType}`, kind: 'document', date: '2026-09-10', docType, costCop, paidAt: '2026-09-10' }) as HistoryEntry;
    expect(proCategoryOf(expense('2026-09-01', 'wash', 1))).toBe('other');
    expect(proCategoryOf(expense('2026-09-01', 'parts', 1))).toBe('parts');
    expect(proCategoryOf(expense('2026-09-01', 'insurance', 1))).toBe('policy');
    expect(proCategoryOf(doc('policy', 1))).toBe('policy');
    expect(proCategoryOf(doc('tax', 1))).toBe('tax');
    expect(proCategoryOf(doc('other', 1))).toBe('other_documents');
    // La licencia de conducción es del conductor: no es gasto del carro.
    expect(proCategoryTotals([doc('license', 90000)])).toEqual([]);
  });

  it('promedio mensual desde el primer gasto, categoría de mayor gasto y mes de mayor gasto', () => {
    const analysis = analyzeExpenses(
      [expense('2026-07-05', 'parts', 100000), expense('2026-09-02', 'wash', 20000), expense('2026-09-03', 'parts', 30000)],
      TODAY,
    );
    expect(analysis.monthsCovered).toBe(3); // julio, agosto, septiembre
    expect(analysis.accumulatedCop).toBe(150000);
    expect(analysis.monthlyAverageCop).toBe(50000);
    expect(analysis.topCategory).toMatchObject({ key: 'parts', amountCop: 130000 });
    expect(analysis.highestMonth?.monthKey).toBe('2026-07');
  });

  it('costo por km solo en los meses con lecturas suficientes', () => {
    const series = monthlySeries([odometer('2026-08-31', 10000), odometer('2026-09-30', 11000), expense('2026-09-10', 'parts', 100000)], TODAY);
    expect(series.at(-1)).toMatchObject({ monthKey: '2026-09', km: 1000, costPerKmCop: 100 });
    expect(series.at(-2)?.costPerKmCop).toBeUndefined();
  });

  it('historial de mantenimiento: los que no tienen costo no suman', () => {
    const history = maintenanceHistory([
      { id: 'm1', kind: 'maintenance', date: '2026-08-01', km: 9000, types: ['oil'], costCop: 150000 },
      { id: 'm2', kind: 'maintenance', date: '2026-09-01', km: 9500, types: ['air_filter'] },
    ]);
    expect(history).toMatchObject({ count: 2, totalCop: 150000, withoutCost: 1 });
    expect(history.entries[0].id).toBe('m2');
  });
});

describe('energía según el vehículo', () => {
  const profile = (energySource: EnergySource) => appData([], energySource).profile;

  it('eléctrico: solo carga; gasolina: solo combustible; híbrido: solo combustible; sin confirmar: nada', () => {
    expect(analysisEnergyKinds(profile('electric'), [])).toEqual(['charge']);
    expect(analysisEnergyKinds(profile('gasoline'), [])).toEqual(['fuel']);
    expect(analysisEnergyKinds(profile('hybrid_gasoline'), [])).toEqual(['fuel']);
    expect(analysisEnergyKinds(profile('phev_gasoline'), [])).toEqual(['fuel', 'charge']);
    expect(analysisEnergyKinds(profile('unknown'), [])).toEqual([]);
  });

  it('consumo entre tanques llenos, precio promedio y costo por km', () => {
    const analysis = analyzeEnergy([fuel('2026-09-01', 10000, 40, 400000), fuel('2026-09-20', 10500, 50, 500000)], 'fuel', TODAY);
    expect(analysis.consumption).toMatchObject({ status: 'calculated', kmPerUnit: 10 });
    expect(analysis.costPerKmCop).toBe(1000);
    expect(analysis.avgUnitPriceCop).toBe(10000);
    expect(analysis.series.at(-1)).toMatchObject({ records: 2, kmPerUnit: 10 });
  });

  it('desconocido no es cero: sin costo no suma ni inventa precio; sin tramos → insuficiente', () => {
    const analysis = analyzeEnergy([charge('2026-09-10', 10000, 30)], 'charge', TODAY);
    expect(analysis).toMatchObject({ records: 1, spentCop: 0, withoutCost: 1, avgUnitPriceCop: undefined, costPerKmCop: undefined, monthlyAverageCop: undefined });
    expect(analysis.consumption.status).toBe('insufficient');
    expect(analysis.series.at(-1)?.kmPerUnit).toBeUndefined();
    expectFinite(analysis);
  });

  it('km desconocido no se usa para medir', () => {
    const analysis = analyzeEnergy([fuel('2026-09-01', null, 40, 400000), fuel('2026-09-20', 10500, 50, 500000)], 'fuel', TODAY);
    expect(analysis.consumption.status).toBe('insufficient');
  });
});

describe('comparación de períodos', () => {
  const records = [expense('2026-07-01', 'parts', 10000), expense('2026-08-15', 'parts', 100000), expense('2026-09-15', 'parts', 50000)];

  it('mes actual vs. anterior con datos de ambos', () => {
    const month = comparePeriods(records, TODAY)[0];
    expect(month).toMatchObject({ months: 1, enough: true, current: { fromMonth: '2026-09' }, previous: { fromMonth: '2026-08' } });
    expect(changeBetween(month.current.metrics.totalCop, month.previous.metrics.totalCop)).toEqual({ diff: -50000, percent: -50 });
  });

  it('3, 6 y 12 meses: sin registros que cubran el período anterior → no compara', () => {
    expect(comparePeriods(records, TODAY).slice(1).map((p) => p.enough)).toEqual([false, false, false]);
  });

  it('sin ningún dato no compara nada y no hay NaN', () => {
    const periods = comparePeriods([], TODAY);
    expect(periods.every((p) => !p.enough)).toBe(true);
    expectFinite(periods);
    expect(changeBetween(10, 0)).toEqual({ diff: 10, percent: undefined });
    expect(changeBetween(undefined, 5)).toBeUndefined();
  });
});

describe('análisis del estado', () => {
  it('atrasado, vencido, km desactualizado y energía sin confirmar, sin diagnosticar', () => {
    const data = buildAppDataFromOnboarding(
      onboarding('unknown', {
        completedAt: '2026-09-01',
        maintenance: [{ code: 'oil', date: '2026-02-20', km: 9500, costCop: null }],
        documents: { soatExpiresAt: '2026-09-20' },
      }),
      TODAY,
      { componentConfigs: { oil: { enabled: true, interval: { km: 5000, months: 6 } } } },
    );
    const { items, counts } = analyzeState(data, TODAY);
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(expect.arrayContaining(['maint-due-oil', 'doc-due-soat', 'km-stale', 'energy-unconfirmed']));
    expect(counts.due).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(items)).not.toMatch(/falla|avería|dañad|diagnóstic/i);
  });

  it('datos insuficientes de consumo se dicen como tales', () => {
    const { items } = analyzeState(appData([fuel('2026-09-28', 10000, 40, 400000)]), TODAY);
    expect(items.find((i) => i.key === 'consumption-fuel')?.detail).toMatch(/Datos insuficientes/);
  });
});

describe('informe del vehículo', () => {
  it('con pocos datos se arma sin NaN ni valores inventados', () => {
    const report = buildVehicleReport(appData(), TODAY);
    expect(report.carName).toBe('Kia Picanto 2022');
    expect(report.expenses.hasData).toBe(false);
    expect(report.vehicle.find((r) => r.label.toLowerCase().includes('placa'))?.value).toBe('Sin registrar');
    expectFinite(report);
  });

  it('eléctrico: el informe no muestra combustible', () => {
    const report = buildVehicleReport(appData([charge('2026-09-28', 10000, 30, 40000)], 'electric'), TODAY);
    expect(report.energy.map((e) => e.kind)).toEqual(['charge']);
  });
});

describe('importar y exportar', () => {
  const data = stored([fuel('2026-09-01', 10000, 40, 400000), expense('2026-09-02', 'wash', 20000)]);

  it('exportar → importar devuelve exactamente los mismos datos', () => {
    const text = createBackup(data, TODAY);
    expect(JSON.parse(text)).toMatchObject({ format: BACKUP_FORMAT, formatVersion: 1, userData: { schemaVersion: USER_SCHEMA_VERSION } });
    const result = parseBackup(text);
    expect(result.ok && result.data).toEqual(data);
    expect(result.ok && result.summary).toMatchObject({ carName: 'Kia Picanto 2022', records: 2, unrecognized: 0 });
  });

  it('rechaza vacío, JSON dañado o cortado, y contenido que no es de RODEXA', () => {
    const text = createBackup(data, TODAY);
    expect(parseBackup('  ')).toMatchObject({ ok: false, error: 'empty' });
    expect(parseBackup(text.slice(0, text.length / 2))).toMatchObject({ ok: false, error: 'invalid-json' });
    expect(parseBackup('{"hola":1}')).toMatchObject({ ok: false, error: 'not-rodexa' });
    expect(parseBackup(wrap(data))).toMatchObject({ ok: false, error: 'not-rodexa' });
  });

  it('valida versiones: una copia más nueva se rechaza', () => {
    const file = JSON.parse(createBackup(data, TODAY));
    expect(parseBackup(JSON.stringify({ ...file, formatVersion: 99 }))).toMatchObject({ ok: false, error: 'newer-format' });
    expect(parseBackup(JSON.stringify({ ...file, userData: { ...file.userData, schemaVersion: 99 } }))).toMatchObject({
      ok: false,
      error: 'newer-data',
    });
  });

  it('detecta archivos corruptos y copias sin carro', () => {
    const file = JSON.parse(createBackup(data, TODAY));
    expect(parseBackup(JSON.stringify({ ...file, userData: 'x' }))).toMatchObject({ ok: false, error: 'corrupt' });
    expect(parseBackup(JSON.stringify({ ...file, userData: { ...file.userData, data: [] } }))).toMatchObject({ ok: false, error: 'corrupt' });
    expect(
      parseBackup(JSON.stringify({ ...file, userData: { ...file.userData, data: { ...data, onboarding: { roto: true } } } })),
    ).toMatchObject({ ok: false, error: 'corrupt' });
    expect(parseBackup(createBackup(EMPTY_STORED_USER_DATA, TODAY))).toMatchObject({ ok: false, error: 'no-car' });
  });

  it('compatibilidad: una copia con datos de la versión 1 se migra al importarla', () => {
    const v1 = { ...data, onboarding: { ...onboarding(), profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' } } };
    const file = { format: BACKUP_FORMAT, formatVersion: 1, exportedAt: TODAY.toISOString(), userData: { schemaVersion: 1, data: v1 } };
    const result = parseBackup(JSON.stringify(file));
    expect(result.ok && result.data.onboarding?.profile.energySource).toBe('unknown');
  });

  it('un registro no reconocido no se pierde: se conserva aparte y se avisa', () => {
    const file = JSON.parse(createBackup(data, TODAY));
    file.userData.data.records.push({ id: 'raro', kind: 'teletransporte', date: '2026-09-01' });
    const result = parseBackup(JSON.stringify(file));
    expect(result.ok && result.summary.unrecognized).toBe(1);
    expect(result.ok && result.data.records).toHaveLength(2);
    expect(result.ok && result.warnings.length).toBeGreaterThan(0);
  });

  it('una fecha de exportación inválida no se muestra', () => {
    const file = JSON.parse(createBackup(data, TODAY));
    const result = parseBackup(JSON.stringify({ ...file, exportedAt: 'ayer' }));
    expect(result.ok && result.summary.exportedAt).toBeUndefined();
  });
});
