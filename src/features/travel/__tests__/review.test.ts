/** "Voy a viajar" y Ficha del carro. Fechas y valores: DATOS DE PRUEBA. */
import { sheetGroupsFor } from '@/features/cars/sheet';
import type { CarProfile, EnergySource } from '@/features/cars/types';
import { vehicleInfoRows } from '@/features/cars/vehicleOptions';
import type { DocumentRecord, EnergyRecord, HistoryEntry } from '@/features/history/types';
import { buildAppDataFromOnboarding } from '@/features/session/buildFromOnboarding';
import type { CarSheet, ComponentConfig, OnboardingData } from '@/features/session/types';

import { itemKind, MANUAL_SECTIONS } from '../checklist';
import { buildTripReview, summarizeTrip } from '../review';

const TODAY = new Date(2026, 8, 30); // 30/09/2026

function review(
  energySource: EnergySource | undefined,
  records: HistoryEntry[] = [],
  componentConfigs: Partial<Record<string, ComponentConfig>> = {},
  maintenance: OnboardingData['maintenance'] = [],
) {
  const onboarding: OnboardingData = {
    user: { name: 'Ana', city: '' },
    profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource },
    km: 20000,
    maintenance,
    documents: {},
    completedAt: '2026-09-25',
  };
  const data = buildAppDataFromOnboarding(onboarding, TODAY, { records, componentConfigs });
  return buildTripReview(data, TODAY);
}
const manualIds = (r: ReturnType<typeof review>) => r.sections.flatMap((s) => s.items.map((i) => i.id));
const check = (r: ReturnType<typeof review>, id: string) => r.checks.find((c) => c.id === id);
const infoIds = (r: ReturnType<typeof review>) => r.info.map((i) => i.id);
const doc = (id: string, docType: DocumentRecord['docType'], extra: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id,
  kind: 'document',
  date: '2026-09-01',
  docType,
  ...extra,
});
const fuel: EnergyRecord = { id: 'f', kind: 'fuel', date: '2026-09-20', km: 19900, quantity: 30, unit: 'L', fullTank: true };

describe('energía según el vehículo (reglas A/C)', () => {
  it('gasolina: revisa aceite y combustible; no carga eléctrica ni GNC', () => {
    const r = review('gasoline', [fuel]);
    expect(manualIds(r)).toEqual(expect.arrayContaining(['engine.oil', 'road.fuel', 'engine.belts']));
    expect(manualIds(r)).not.toEqual(expect.arrayContaining(['road.charge']));
    expect(manualIds(r)).not.toContain('road.cng');
    expect(infoIds(r)).toEqual(['energy.fuel']);
  });

  it('diésel: combustible y aceite', () => {
    const r = review('diesel');
    expect(manualIds(r)).toEqual(expect.arrayContaining(['engine.oil', 'road.fuel']));
    expect(manualIds(r)).not.toContain('road.charge');
  });

  it('eléctrico: sin aceite, correas ni combustible; con carga y cable', () => {
    const r = review('electric');
    const ids = manualIds(r);
    for (const id of ['engine.oil', 'engine.belts', 'road.fuel', 'road.cng']) expect(ids).not.toContain(id);
    expect(ids).toEqual(expect.arrayContaining(['road.charge', 'road.cable']));
    expect(infoIds(r)).toEqual(['energy.charge']);
    // No hay componente de aceite de motor (Fase B).
    expect(check(r, 'component.oil')).toBeUndefined();
  });

  it('HEV: combustible sí, carga externa no; incluye el sistema híbrido', () => {
    const r = review('hybrid_gasoline');
    expect(manualIds(r)).toContain('road.fuel');
    expect(manualIds(r)).not.toContain('road.charge');
    expect(infoIds(r)).toEqual(['energy.fuel']);
    expect(check(r, 'component.hybrid_system')).toBeDefined();
  });

  it('PHEV: combustible y carga, informados por separado', () => {
    const r = review('phev_gasoline');
    expect(manualIds(r)).toEqual(expect.arrayContaining(['road.fuel', 'road.charge']));
    expect(infoIds(r)).toEqual(['energy.fuel', 'energy.charge']);
  });

  it('GNC: carga de GNC; la información de energía solo de lo confirmado', () => {
    const r = review('cng');
    expect(manualIds(r)).toContain('road.cng');
    expect(infoIds(r)).toEqual(['energy.cng']);
  });

  it('GNC + gasolina: GNC y combustible', () => {
    const r = review('cng_gasoline');
    expect(manualIds(r)).toEqual(expect.arrayContaining(['road.cng', 'road.fuel']));
    expect(infoIds(r)).toEqual(['energy.fuel', 'energy.cng']);
  });

  it('energía desconocida: pide confirmarla y no informa ninguna energía', () => {
    const r = review('unknown');
    expect(check(r, 'energy.confirm')).toMatchObject({ status: 'nodata', label: 'Sin confirmar' });
    expect(r.info).toEqual([]);
    expect(r.verdict).not.toBe('ready');
  });

  it('nunca afirma que hay combustible suficiente ni calcula autonomía', () => {
    const detail = review('gasoline', [fuel]).info[0].detail;
    expect(detail).toMatch(/no sabe cuánto tienes/i);
    expect(detail).not.toMatch(/autonom|suficiente/i);
  });
});

describe('documentos (estados centrales de la Fase D)', () => {
  it('sin registrar: SOAT, tecnomecánica, licencias → "Sin registrar" (nunca OK)', () => {
    const r = review('gasoline');
    for (const key of ['soat', 'rtm', 'transit_license', 'license']) {
      expect(check(r, `document.${key}`)).toMatchObject({ status: 'nodata', label: 'Sin registrar' });
    }
  });

  it('licencia de tránsito registrada → "Registrado"', () => {
    const r = review('gasoline', [doc('t', 'transit_license', { number: 'ABC' })]);
    expect(check(r, 'document.transit_license')).toMatchObject({ status: 'ok', label: 'Registrado' });
  });

  it('vencido y próximo a vencer', () => {
    const r = review('gasoline', [doc('s', 'soat', { expiresAt: '2026-09-01' }), doc('r', 'rtm', { expiresAt: '2026-10-10' })]);
    expect(check(r, 'document.soat')).toMatchObject({ status: 'attention', label: 'Vencido', level: 'due' });
    expect(check(r, 'document.rtm')).toMatchObject({ status: 'attention', label: 'Próximo a vencer', level: 'soon' });
    expect(r.verdict).toBe('attention');
  });

  it('vigente → "Vigente" y abre el detalle del documento', () => {
    const c = check(review('gasoline', [doc('s', 'soat', { expiresAt: '2027-09-01' })]), 'document.soat');
    expect(c).toMatchObject({ status: 'ok', label: 'Vigente' });
    expect(c?.href).toEqual({ pathname: '/documentos/[key]', params: { key: 'soat' } });
  });

  it('RTM "aún no aplica" → No aplica; la póliza solo aparece si está registrada; el impuesto no', () => {
    const r = review('gasoline', [doc('r', 'rtm', { notApplicable: true }), doc('t', 'tax', { taxYear: 2026, dueDate: '2026-10-05' })]);
    expect(check(r, 'document.rtm')?.status).toBe('na');
    expect(check(r, 'document.policy')).toBeUndefined();
    expect(check(r, 'document.tax')).toBeUndefined();
    const withPolicy = review('gasoline', [doc('p', 'policy', { expiresAt: '2027-01-01' })]);
    expect(check(withPolicy, 'document.policy')?.status).toBe('ok');
  });
});

describe('mantenimiento (aplicabilidad de la Fase B)', () => {
  it('aplicable: el aceite aparece en gasolina; no aplicable: no aparece en eléctrico', () => {
    expect(check(review('gasoline'), 'component.oil')).toBeDefined();
    expect(check(review('electric'), 'component.oil')).toBeUndefined();
  });

  it('sin datos: frenos sin registros → "Sin datos sobre la última revisión" (nunca OK)', () => {
    expect(check(review('gasoline'), 'component.brake_check')).toMatchObject({
      status: 'nodata',
      detail: 'Sin datos sobre la última revisión',
    });
  });

  it('con último cambio pero sin intervalo → "Sin intervalo configurado"', () => {
    const r = review('gasoline', [], {}, [{ code: 'oil', date: '2026-08-01', km: 18000, costCop: null }]);
    expect(check(r, 'component.oil')).toMatchObject({ status: 'nodata', label: 'Sin intervalo configurado' });
  });

  it('con intervalo del usuario y datos: se calcula el estado real', () => {
    const r = review('gasoline', [], { oil: { enabled: true, interval: { km: 5000 } } }, [
      { code: 'oil', date: '2026-08-01', km: 18000, costCop: null },
    ]);
    expect(check(r, 'component.oil')).toMatchObject({ status: 'ok', label: 'Al día' });
    const due = review('gasoline', [], { oil: { enabled: true, interval: { km: 1000 } } }, [
      { code: 'oil', date: '2026-08-01', km: 18000, costCop: null },
    ]);
    expect(check(due, 'component.oil')).toMatchObject({ status: 'attention', label: 'Pendiente' });
  });

  it('"Depende de tu carro" se muestra como tal, no como OK', () => {
    const c = check(review('unknown'), 'component.oil');
    expect(c).toMatchObject({ status: 'nodata', label: 'Depende de tu carro' });
  });
});

describe('veredicto y resumen', () => {
  it('sin alertas pero con datos faltantes → "incomplete", nunca "ready"', () => {
    expect(review('gasoline').verdict).toBe('incomplete');
  });

  it('el resumen no cuenta lo que no tiene datos como OK', () => {
    const r = review('gasoline');
    const summary = summarizeTrip(r, {});
    expect(summary.noData).toBe(r.checks.filter((c) => c.status === 'nodata').length);
    expect(summary.ok).toBe(r.checks.filter((c) => c.status === 'ok').length);
    expect(summary.manualChecked).toBe(0);
    expect(summary.recommendations.some((x) => /sin marcar/.test(x.text))).toBe(true);
  });
});

describe('equipo y revisión manual', () => {
  const labels = MANUAL_SECTIONS.flatMap((s) => [s.title, ...s.items.map((i) => i.label)]).join(' | ');

  it('no hay elementos de moto', () => {
    expect(labels).not.toMatch(/casco|guantes|cadena|impermeable|manubrio|\bmotos?\b|motocicl|piñ[oó]n|parrillero|kit de arrastre/i);
  });

  it('todo es "Recomendado": ningún punto se presenta como requisito legal sin fuente verificada', () => {
    for (const item of MANUAL_SECTIONS.flatMap((s) => s.items)) expect(itemKind(item)).toBe('recommended');
    expect(labels).not.toMatch(/obligatori|exig|requisito/i);
  });

  it('solo con una fuente verificable un punto sería "Requisito legal"', () => {
    const item = { id: 'x', label: 'X', legalSource: { type: 'official' as const, name: 'Fuente', url: 'https://ejemplo.gov.co' } };
    expect(itemKind(item)).toBe('legal');
    expect(itemKind({ ...item, legalSource: { type: 'official' as const, name: 'Fuente' } })).toBe('recommended');
  });
});

describe('ficha del carro', () => {
  const base: CarProfile = { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto' };
  const keys = (profile: CarProfile) => vehicleInfoRows(profile).map((r) => r.key);

  it('eléctrico: sin cilindraje, transmisión, distribución ni tanque; con batería', () => {
    const k = keys({ ...base, energySource: 'electric' });
    for (const key of ['cc', 'transmission', 'timing', 'tank']) expect(k).not.toContain(key);
    expect(k).toContain('battery');
  });

  it('gasolina: sin capacidad de batería; PHEV: tanque y batería', () => {
    expect(keys({ ...base, energySource: 'gasoline' })).not.toContain('battery');
    expect(keys({ ...base, energySource: 'phev_gasoline' })).toEqual(expect.arrayContaining(['tank', 'battery']));
  });

  it('"No sé" se muestra como desconocido, no como un valor', () => {
    const rows = vehicleInfoRows({ ...base, energySource: 'gasoline', transmission: 'unknown', drivetrain: 'unknown' });
    expect(rows.find((r) => r.key === 'transmission')?.value).toBe('Desconocido');
    expect(rows.find((r) => r.key === 'drivetrain')?.value).toBe('Desconocido');
    expect(vehicleInfoRows({ ...base }).find((r) => r.key === 'energy')?.value).toBe('Sin confirmar');
  });

  it('notas: un eléctrico no ve aceite ni bujías, salvo que ya los haya anotado', () => {
    const fields = (sheet: CarSheet) => sheetGroupsFor({ energySource: 'electric' }, sheet).flatMap((g) => g.fields.map((f) => f.key));
    expect(fields({})).not.toEqual(expect.arrayContaining(['oil']));
    expect(fields({})).not.toContain('sparkPlug');
    expect(fields({ oil: 'Anotado antes' })).toContain('oil');
    expect(sheetGroupsFor({ energySource: 'gasoline' }, {}).flatMap((g) => g.fields.map((f) => f.key))).toContain('sparkPlug');
  });
});
