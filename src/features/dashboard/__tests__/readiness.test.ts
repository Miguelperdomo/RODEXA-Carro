/** ¿Cómo está mi carro? Una sola regla para Inicio y la revisión de viaje. */
import type { ComponentSummary, DocumentSummary } from '@/features/cars/types';
import type { CustomReminder } from '@/features/customReminders/rules';
import type { StatusLevel } from '@/shared/theme';

import {
  blockedWhy,
  blockersSentence,
  maintDueSentence,
  readinessHeadline,
  readinessOf,
  renewWord,
  tripHeadline,
  unknownSentence,
} from '../readiness';
import { buildToday, type TodayInput } from '../today';

const TODAY = new Date(2026, 10, 6);
const doc = (type: DocumentSummary['type'], status: StatusLevel, extra: Partial<DocumentSummary> = {}): DocumentSummary =>
  ({
    key: type,
    type,
    title: { soat: 'SOAT', rtm: 'Tecnomecánica', license: 'Licencia de conducción', policy: 'Póliza de seguro' }[type as string] ?? type,
    status,
    detail: '',
    records: status === 'nodata' ? 0 : 1,
    ...extra,
  }) as DocumentSummary;
const comp = (code: string, status: StatusLevel): ComponentSummary =>
  ({ code, title: code === 'oil' ? 'Aceite de motor' : 'Frenos', status, enabled: true }) as unknown as ComponentSummary;
const data = (documents: DocumentSummary[], components: ComponentSummary[] = []) =>
  ({ documents, components, odometer: { registeredKm: 20_000 } }) as never;

describe('documentos obligatorios', () => {
  it('SOAT vencido → bloqueado, con la norma citada y sin cifras', () => {
    const r = readinessOf(data([doc('soat', 'due'), doc('rtm', 'ok')]), TODAY);
    expect(r.level).toBe('blocked');
    expect(readinessHeadline(r)).toBe('Tienes documentos vencidos');
    expect(blockersSentence(r)).toBe('Tu SOAT está vencido');
    expect(renewWord(r)).toBe('Renuévalo');
    expect(blockedWhy(r)).toMatch(/multa e inmovilización del vehículo \(Código Nacional de Tránsito, Ley 769 de 2002, artículo 131\)/);
    expect(blockedWhy(r)).not.toMatch(/\$|\d+ SMLMV|salarios/i);
  });

  it('concordancia: tecnomecánica (femenino) y varios', () => {
    const rtm = readinessOf(data([doc('rtm', 'due')]), TODAY);
    expect(blockersSentence(rtm)).toBe('Tu tecnomecánica está vencida');
    expect(renewWord(rtm)).toBe('Renuévala');
    const both = readinessOf(data([doc('soat', 'due'), doc('rtm', 'due')]), TODAY);
    expect(blockersSentence(both)).toBe('Tu SOAT y tu tecnomecánica están vencidos');
    expect(renewWord(both)).toBe('Renuévalos');
  });

  it('licencia vencida: se pide renovarla, sin afirmar una sanción', () => {
    const r = readinessOf(data([doc('license', 'due')]), TODAY);
    expect(r.level).toBe('blocked');
    expect(blockedWhy(r)).toBe('Renueva tu licencia de conducción lo antes posible.');
  });

  it('tecnomecánica que no aplica (carro nuevo): ni vencida ni faltante', () => {
    const r = readinessOf(data([doc('soat', 'ok'), doc('rtm', 'na', { notApplicable: true })]), TODAY);
    expect(r.level).toBe('ok');
  });

  it('sin fecha de un obligatorio nunca dice "al día"', () => {
    const r = readinessOf(data([doc('soat', 'nodata'), doc('rtm', 'ok')]), TODAY);
    expect(r.level).toBe('missing');
    expect(readinessHeadline(r)).toBe('Sin alertas, pero falta la fecha de SOAT');
    expect(unknownSentence(r)).toMatch(/no se puede saber si está vigente/);
  });

  it('todo en orden → al día', () => {
    expect(readinessHeadline(readinessOf(data([doc('soat', 'ok'), doc('rtm', 'ok')]), TODAY))).toBe(
      'Según tus registros, todo está al día',
    );
  });
});

describe('mantenimientos: plazo cumplido, nunca "el carro está malo"', () => {
  it('se dice que se cumplió el plazo que pusiste', () => {
    const reminder: CustomReminder = { id: 'r', title: 'Revisar extintor', trigger: { type: 'km', km: 19_000 }, createdAt: '2026-01-01' };
    const r = readinessOf(data([doc('soat', 'ok'), doc('rtm', 'ok')], [comp('oil', 'due')]), TODAY, [reminder]);
    expect(r.level).toBe('review');
    expect(maintDueSentence(r)).toBe(
      'Se cumplió el plazo que pusiste para aceite de motor y revisar extintor: revísalo. RODEXA no ve tu carro; si ya lo hiciste, actualízalo en la app.',
    );
    expect(maintDueSentence(r)).not.toMatch(/malo|dañad|averiad/i);
  });
});

describe('Inicio ("Hoy")', () => {
  const base: TodayInput = {
    picoYPlaca: undefined,
    statusItems: [],
    kmCheckDue: false,
    daysSinceReading: 0,
    weeklySettings: { weeklyCheckEnabled: false } as TodayInput['weeklySettings'],
    today: TODAY,
  };

  it('documento vencido arriba, sin repetirlo en su propia fila', () => {
    const readiness = readinessOf(data([doc('soat', 'due')]), TODAY);
    const statusItems = [{ id: 'soat', kind: 'document', title: 'SOAT', icon: 'insurance', status: 'due', detail: '', href: '/documentos' }] as TodayInput['statusItems'];
    const { items } = buildToday({ ...base, statusItems, readiness });
    expect(items[0]).toMatchObject({ key: 'readiness-blocked', tone: 'due', title: 'Tienes documentos vencidos' });
    expect(items[0].detail).toBe('Tu SOAT está vencido según la fecha que registraste. Renuévalo antes de salir.');
    expect(items.some((i) => i.key === 'status-soat')).toBe(false);
  });

  it('sin fecha del SOAT no dice "Nada pendiente para hoy"', () => {
    const { items } = buildToday({ ...base, readiness: readinessOf(data([doc('soat', 'nodata')]), TODAY) });
    expect(items[0].key).toBe('readiness-missing');
    expect(items.some((i) => i.title === 'Nada pendiente para hoy')).toBe(false);
  });
});

describe('revisión de viaje', () => {
  const ready = { title: 'Según tus registros, todo está al día', detail: '…', level: 'ok' as const };

  it('un obligatorio vencido manda', () => {
    const h = tripHeadline(ready, readinessOf(data([doc('rtm', 'due')]), TODAY));
    expect(h).toMatchObject({ title: 'Tu tecnomecánica está vencida', level: 'due' });
    expect(h.detail).toMatch(/Renuévala antes de viajar\.$/);
  });

  it('sin fecha de un obligatorio no dice "al día"', () => {
    const h = tripHeadline(ready, readinessOf(data([doc('soat', 'nodata')]), TODAY));
    expect(h).toMatchObject({ title: 'Sin alertas, pero faltan datos', level: 'nodata' });
  });

  it('si todo está bien, se respeta el veredicto de la revisión', () => {
    expect(tripHeadline(ready, readinessOf(data([doc('soat', 'ok'), doc('rtm', 'ok')]), TODAY))).toBe(ready);
  });
});
