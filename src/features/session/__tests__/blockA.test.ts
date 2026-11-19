/**
 * Auditoría, bloque A: el último cambio cuenta aunque se haya configurado el mismo día,
 * ids estables de los mantenimientos del primer ingreso y documento vigente por vencimiento.
 * Datos de PRUEBA.
 */
import { buildComponentDetail, configIsNewer } from '@/features/cars/componentDetail';
import { buildDocumentSummaries } from '@/features/documents/summary';
import type { DocumentRecord, HistoryEntry } from '@/features/history/types';
import { EMPTY_STORED_USER_DATA, sanitizeUserData, type StoredUserData } from '@/storage/userDataStore';

import { buildAppDataFromOnboarding } from '../buildFromOnboarding';
import type { OnboardingData } from '../types';
import { userDataActions as A } from '../userDataActions';

const TODAY = new Date(2026, 9, 2);

const onboarding = (d: Partial<OnboardingData> = {}): OnboardingData => ({
  user: { name: 'Ana', city: '' },
  profile: { id: 'car-1', brandCode: 'kia', brandName: 'Kia', model: 'Picanto', energySource: 'gasoline' },
  km: 50000,
  maintenance: [],
  documents: {},
  completedAt: '2026-09-01',
  ...d,
});

describe('un mantenimiento registrado siempre cuenta', () => {
  it('configuró el 1/10 con último cambio a 40.000; registra el 2/10 un cambio del 30/9 a 49.000 → manda el registro', () => {
    const records: HistoryEntry[] = [{ id: 'm', kind: 'maintenance', date: '2026-09-30', km: 49000, types: ['oil'] }];
    const data = buildAppDataFromOnboarding(onboarding(), TODAY, {
      records,
      componentConfigs: { oil: { enabled: true, interval: { km: 5000 }, lastService: { km: 40000, setAt: '2026-10-01' } } },
    });
    const oil = data.components.find((c) => c.code === 'oil')!;
    const detail = buildComponentDetail(oil, data.history, 50000, TODAY);
    expect(detail.status).toBe('ok');
    expect(detail.remaining).toBe('Faltan 4.000 km');
  });

  it('un cambio registrado HOY, el mismo día de configurar, también cuenta', () => {
    expect(configIsNewer({ km: 40000, setAt: '2026-10-02' }, { date: '2026-10-02', km: 49000 })).toBe(false);
  });

  it('si lo configurado es realmente más reciente (por fecha o por km), manda la configuración', () => {
    expect(configIsNewer({ date: '2026-09-20', setAt: '2026-10-01' }, { date: '2026-08-01', km: 45000 })).toBe(true);
    expect(configIsNewer({ km: 48000, setAt: '2026-10-01' }, { date: '2026-08-01', km: 45000 })).toBe(true);
    expect(configIsNewer({ date: '2026-08-01', setAt: '2026-10-01' }, { date: '2026-08-01', km: 45000 })).toBe(false);
    expect(configIsNewer({ km: 48000, setAt: '2026-10-01' }, undefined)).toBe(true);
  });
});

describe('ids estables de los mantenimientos del primer ingreso', () => {
  const three = onboarding({
    maintenance: [
      { code: 'oil', date: '2026-08-01', km: 48000, costCop: null },
      { code: 'air_filter', date: '2026-08-02', km: 48100, costCop: null },
      { code: 'brake_pads_front', date: '2026-08-03', km: 48200, costCop: null },
    ],
  });
  const stored = { ...EMPTY_STORED_USER_DATA, onboarding: three };
  const ids = (d: StoredUserData) =>
    buildAppDataFromOnboarding(d.onboarding!, TODAY, { records: d.records }).history.filter((e) => e.kind === 'maintenance');

  it('editar el del medio: conserva su id y los demás no se mueven', () => {
    const edited: HistoryEntry = { id: 'x', kind: 'maintenance', date: '2026-08-02', km: 48150, types: ['air_filter'], costCop: 90000 };
    const after = A.editEntry(stored, 'onb-m-1', edited);
    const list = ids(after);
    expect(list.find((e) => e.id === 'onb-m-1')).toMatchObject({ km: 48150, costCop: 90000 });
    expect(list.find((e) => e.id === 'onb-m-2')).toMatchObject({ types: ['brake_pads_front'] });
    expect(list.filter((e) => e.id === 'onb-m-1')).toHaveLength(1);
  });

  it('borrar el primero no hace que "onb-m-1" pase a ser otro', () => {
    const after = A.deleteEntry(stored, 'onb-m-0');
    const list = ids(after);
    expect(list.map((e) => e.id).sort()).toEqual(['onb-m-1', 'onb-m-2']);
    expect(list.find((e) => e.id === 'onb-m-1')).toMatchObject({ types: ['air_filter'] });
  });

  it('lo retirado sobrevive a cerrar y abrir la app', () => {
    const after = A.deleteEntry(stored, 'onb-m-1');
    const reloaded = sanitizeUserData(JSON.parse(JSON.stringify(after))).data;
    expect(ids(reloaded).map((e) => e.id).sort()).toEqual(['onb-m-0', 'onb-m-2']);
  });
});

describe('documento vigente', () => {
  const soat = (id: string, date: string, expiresAt: string): DocumentRecord => ({ id, kind: 'document', date, docType: 'soat', expiresAt });

  it('registrar después un SOAT viejo no lo vuelve el vigente', () => {
    const history: HistoryEntry[] = [soat('nuevo', '2026-09-10', '2027-09-10'), soat('viejo', '2026-09-20', '2026-09-09')];
    const summary = buildDocumentSummaries(history, new Date(2026, 8, 25)).find((d) => d.type === 'soat')!;
    expect(summary).toMatchObject({ status: 'ok', expiresAt: '2027-09-10', latestRecordId: 'nuevo', records: 2 });
  });

  it('una renovación (vence después) sí pasa a ser la vigente', () => {
    const history: HistoryEntry[] = [soat('a', '2025-09-10', '2026-09-10'), soat('b', '2026-09-05', '2027-09-10')];
    expect(buildDocumentSummaries(history, new Date(2026, 8, 25)).find((d) => d.type === 'soat')?.latestRecordId).toBe('b');
  });
});
