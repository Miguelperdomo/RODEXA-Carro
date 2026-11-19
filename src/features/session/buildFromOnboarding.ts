import { estimateOdometer } from '@/features/odometer/estimate';
import { buildRecommendations } from '@/features/dashboard/recommendations';
import type { DashboardData, StatusItem } from '@/features/dashboard/types';
import { DOCUMENT_DEFINITIONS } from '@/features/documents/catalog';
import { buildDocumentSummaries, needsAttention } from '@/features/documents/summary';
import { costDateOf, entryCost } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { findMaintenanceItem } from '@/features/maintenance/catalog';
import { odometerReadingOf } from '@/features/odometer/recordKm';
import { resolveInterval } from '@/features/maintenance/intervals';
import { capabilitiesOf } from '@/features/cars/capabilities';
import { buildComponentDetail } from '@/features/cars/componentDetail';
import { componentsFor, coreComponentsFor } from '@/features/cars/catalog';
import type {
  ComponentSummary,
  OdometerSummary,
} from '@/features/cars/types';
import type { StatusLevel } from '@/shared/theme';
import { daysBetween, formatDate, formatMonthYear, parseISODate, toISODate } from '@/shared/utils/date';

import type { AppData, ComponentConfig, OnboardingData } from './types';
import { cmpText } from '@/shared/utils/compare';

/** Orden del dashboard: 🔴 → 🟡 → ⚪ → 🟢 → ▫️ (docs/diseno-funcional.md §8.4). */
const SEVERITY: Record<StatusLevel, number> = { due: 0, soon: 1, nodata: 2, ok: 3, na: 4 };

/** Lo registrado después del primer ingreso (todo viene de lo guardado en el teléfono). */
export type BuildExtras = {
  records?: HistoryEntry[];
  componentConfigs?: Partial<Record<ComponentSummary['code'], ComponentConfig>>;
};

type MaintenanceEvent = { code: string; date: string; km: number | null };

/**
 * Arma los datos que leen las pantallas a partir de lo que el usuario registró
 * (primer ingreso + registros posteriores + configuración). Todo lo derivado
 * (tablero, estados, recomendaciones) se recalcula aquí: no se guarda duplicado.
 * `today` solo se usa para calcular estados ("hace X días", "vence en…"), nunca
 * como fecha de un registro.
 */
export function buildAppDataFromOnboarding(
  data: OnboardingData,
  today: Date,
  { records = [], componentConfigs = {} }: BuildExtras = {},
): AppData {
  const todayIso = toISODate(today);
  // Fecha REAL del primer ingreso: sus registros no se mueven al reabrir la app otro día.
  const startIso = data.completedAt;

  // ── Historial ───────────────────────────────────────────────────────────────
  const history: HistoryEntry[] = [{ id: 'onb-km', kind: 'odometer', date: startIso, km: data.km }];
  data.maintenance.forEach((m, i) => {
    if (m.removed) return;
    history.push({
      id: `onb-m-${i}`,
      kind: 'maintenance',
      date: m.date,
      // Si el usuario no sabía el km, queda desconocido (null): nunca se usa el km actual.
      km: m.km,
      types: [m.code],
      costCop: m.costCop ?? undefined,
      note: m.description,
    });
  });
  const { soatExpiresAt, rtmExpiresAt } = data.documents;
  if (soatExpiresAt) {
    history.push({
      id: 'onb-soat',
      kind: 'document',
      date: startIso,
      docType: 'soat',
      expiresAt: soatExpiresAt,
    });
  }
  if (rtmExpiresAt) {
    history.push({
      id: 'onb-rtm',
      kind: 'document',
      date: startIso,
      docType: 'rtm',
      expiresAt: rtmExpiresAt,
    });
  }
  history.push(...records);
  history.sort((a, b) => cmpText(b.date, a.date));

  // ── Kilometraje: la última lectura CONOCIDA (km desconocido nunca la reemplaza) ──
  const readings = records
    .flatMap((r) => {
      const reading = odometerReadingOf(r);
      return reading ? [reading] : [];
    })
    .sort((a, b) => cmpText(a.date, b.date) || a.km - b.km);
  let last = { date: startIso, km: data.km };
  for (const r of readings) {
    if (r.km >= last.km && r.date >= last.date) last = r;
  }
  const daysSinceReading = Math.max(0, daysBetween(parseISODate(last.date), today));
  const odometer: OdometerSummary = {
    registeredKm: last.km,
    lastReadingDate: last.date,
    daysSinceReading,
    // Referencia según tu ritmo (lecturas reales, incluida la del primer ingreso).
    estimate: estimateOdometer([{ date: startIso, km: data.km }, ...readings], last.km, last.date, today),
  };

  // ── Documentos: estado según el catálogo y el registro más reciente de cada uno ──
  // (incluye el SOAT y la Tecnomecánica del primer ingreso, que ya están en `history`).
  const documents = buildDocumentSummaries(history, today);

  // ── Componentes: último mantenimiento + configuración del usuario ──────────
  const events: MaintenanceEvent[] = [
    ...data.maintenance.filter((m) => !m.removed).map((m) => ({ code: m.code, date: m.date, km: m.km })),
    ...records.flatMap((r) =>
      r.kind === 'maintenance' ? r.types.map((code) => ({ code, date: r.date, km: r.km })) : [],
    ),
  ];
  // Solo los componentes que aplican a este vehículo (reglas en cars/catalog + capabilities).
  const caps = capabilitiesOf(data.profile);
  const core = coreComponentsFor(caps);
  const components: ComponentSummary[] = componentsFor(caps).map(({ code, title, icon, applicability }) => {
    const meta = { code, title, icon, applicability };
    const lastEvent = events
      .filter((e) => findMaintenanceItem(e.code)?.tracks === meta.code)
      .sort((a, b) => cmpText(b.date, a.date))[0];
    const config = componentConfigs[meta.code];
    // Lo que "depende del carro" nunca se activa solo; lo fijo sí (y lo que ya tiene registros).
    const enabled = config?.enabled ?? (core.includes(meta.code) || lastEvent !== undefined);

    if (!enabled) {
      return {
        ...meta,
        enabled,
        status: 'na',
        detail: applicability === 'maybe' ? 'Depende de tu carro · actívalo si aplica' : 'Actívalo para recibir avisos',
      };
    }
    const base: ComponentSummary = {
      ...meta,
      enabled,
      status: 'nodata',
      detail: lastEvent
        ? `Último cambio: ${formatDate(parseISODate(lastEvent.date))}`
        : 'Registra tu último cambio para activar el aviso',
      interval: resolveInterval(data.profile, meta.code, config?.interval),
      lastService:
        config?.lastService ??
        (lastEvent ? { km: lastEvent.km ?? undefined, date: lastEvent.date } : undefined),
    };
    // Con datos suficientes (último cambio + intervalo) se calcula el estado; si no, "Sin datos".
    const detail = buildComponentDetail(base, history, odometer.registeredKm, today);
    return detail.ready && detail.status
      ? { ...base, status: detail.status, detail: detail.remaining ?? base.detail }
      : base;
  });

  // ── Tablero ─────────────────────────────────────────────────────────────────
  const byCode = (code: string) => components.find((c) => c.code === code);
  const statusItems: StatusItem[] = [
    // Filas fijas: solo las que aplican con certeza a este vehículo.
    ...core.flatMap((code) => {
      const component = byCode(code);
      return component ? [rowForComponent(component)] : [];
    }),
    // Documentos: en Inicio SOLO los que requieren atención (próximos a vencer o vencidos).
    // Los que están al día se quedan organizados en Mi carro → Documentos.
    ...documents.filter(needsAttention).map(
      (doc): StatusItem => ({
        id: doc.key,
        kind: 'document',
        title: doc.title,
        icon: DOCUMENT_DEFINITIONS[doc.type].icon,
        status: doc.status,
        detail: doc.detail,
        href: { pathname: '/documentos/[key]', params: { key: doc.key } },
      }),
    ),
  ].sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status]);

  const monthKey = todayIso.slice(0, 7);
  const dashboard: DashboardData = {
    car: {
      name: `${data.profile.brandName} ${data.profile.model}`,
      subtitle: data.profile.year ? `Mi carro · ${data.profile.year}` : 'Mi carro',
    },
    odometer,
    weeklyCheckDue: daysSinceReading >= 7,
    statusItems,
    // Todo lo vencido, próximo o importante que falta (nunca "todo al día" si hay algo).
    // "Configura el aceite" solo si el aceite de motor aplica con certeza y no tiene intervalo.
    recommendations: buildRecommendations({
      profile: data.profile,
      documents,
      components,
      needsOilSetup: core.includes('oil') && byCode('oil')?.interval === undefined,
    }),
    month: {
      monthLabel: capitalize(formatMonthYear(today).split(' ')[0]),
      // Mantenimientos con costo, gastos y tanqueos del mes (igual que Estadísticas).
      totalCop: history.filter((e) => costDateOf(e).startsWith(monthKey)).reduce((sum, e) => sum + entryCost(e), 0),
    },
  };

  return {
    user: { name: data.user.name, cityId: data.user.cityId, city: data.user.city || undefined },
    profile: data.profile,
    odometer,
    components,
    documents,
    history,
    dashboard,
  };
}

function rowForComponent(component: ComponentSummary): StatusItem {
  return {
    id: component.code,
    kind: 'maintenance',
    title: component.title,
    icon: component.icon,
    status: component.status,
    detail: component.detail,
    href: { pathname: '/mi-carro/componente/[code]', params: { code: component.code } },
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
