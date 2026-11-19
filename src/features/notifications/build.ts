import { buildComponentDetail, missingSummary } from '@/features/cars/componentDetail';
import { DOCUMENT_DEFINITIONS } from '@/features/documents/catalog';
import { documentStatusText } from '@/features/documents/presentation';
import { needsAttention } from '@/features/documents/summary';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import type { AppData } from '@/features/session/types';
import type { Settings } from '@/features/settings/types';
import { effectiveSettings, isTranqui, TRANQUI_ODOMETER_STALE_DAYS } from '@/features/settings/usageStyle';
import { addDays, daysBetween, formatDate, parseISODate, toISODate } from '@/shared/utils/date';

import type { AppNotification } from './types';
import { cmpText } from '@/shared/utils/compare';

/** Días sin lectura de km para avisar (igual que la confirmación semanal, §8.5). */
const ODOMETER_STALE_DAYS = 7;
/** Un mantenimiento se confirma como "registrado" si ocurrió en los últimos 30 días. */
const RECENT_MAINTENANCE_DAYS = 30;

/**
 * Deduce las notificaciones de la situación actual del carro. Nada aleatorio:
 * cada una corresponde a un estado real de los datos y respeta las preferencias.
 */
export function buildNotifications(data: AppData, saved: Settings, today: Date): AppNotification[] {
  const settings = effectiveSettings(saved);
  // Tranqui: el km se pide una vez al mes, no cada semana.
  const staleDays = isTranqui(saved) ? TRANQUI_ODOMETER_STALE_DAYS : ODOMETER_STALE_DAYS;
  const todayIso = toISODate(today);
  const list: AppNotification[] = [];

  // Mantenimiento: componentes próximos o pendientes
  if (settings.maintenanceReminders) {
    for (const c of data.components) {
      if (!c.enabled || (c.status !== 'soon' && c.status !== 'due')) continue;
      list.push({
        // El último servicio va en el id: el aviso del ciclo siguiente es otro (no aparece ya leído).
        id: `maint-${c.code}-${c.status}-${c.lastService?.date ?? ''}-${c.lastService?.km ?? ''}`,
        category: 'maintenance',
        icon: c.icon,
        title: `${c.title} ${c.status === 'due' ? 'pendiente' : 'próximo'}`,
        message: `${c.detail}. Revisa si ya corresponde hacerlo.`,
        date: todayIso,
        href: { pathname: '/mi-carro/componente/[code]', params: { code: c.code } },
      });
    }
  }

  // Documentos: próximos a vencer o vencidos, según la preferencia de cada uno (catálogo).
  if (settings.documentReminders) {
    for (const doc of data.documents) {
      const setting = DOCUMENT_DEFINITIONS[doc.type].reminderSetting;
      if (!needsAttention(doc) || !setting || !settings[setting]) continue;
      list.push({
        id: `doc-${doc.key}-${doc.status}-${doc.alertDate ?? ''}`,
        category: 'documents',
        icon: DOCUMENT_DEFINITIONS[doc.type].icon,
        title: `${doc.title} · ${documentStatusText(doc).toLowerCase()}`,
        message: `${doc.detail}, según la fecha que registraste.`,
        date: todayIso,
        href: { pathname: '/documentos/[key]', params: { key: doc.key } },
      });
    }
  }

  // Kilometraje desactualizado
  if (settings.odometerReminders && data.odometer.daysSinceReading >= staleDays) {
    const since = parseISODate(data.odometer.lastReadingDate);
    list.push({
      id: `km-stale-${data.odometer.lastReadingDate}`,
      category: 'odometer',
      icon: 'odometer',
      title: 'Kilometraje desactualizado',
      message: `Tu último registro fue el ${formatDate(since)}. Actualízalo para que tus avisos sigan al día.`,
      date: toISODate(addDays(since, staleDays)),
      href: '/registrar/kilometraje',
    });
  }

  // Sistema: información incompleta (componentes activos sin datos)
  if (settings.importantNotifications) {
    const incomplete = data.components.filter((c) => c.enabled && c.status === 'nodata');
    if (incomplete.length > 0) {
      const first = incomplete[0];
      const detail = buildComponentDetail(first, data.history, data.odometer.registeredKm, today);
      list.push({
        id: `info-incomplete-${incomplete.map((c) => c.code).join('-')}`,
        category: 'system',
        icon: 'statusNoData',
        title: `Información incompleta: ${incomplete.map((c) => c.title).join(', ')}`,
        message: `${missingSummary(detail) || 'Faltan datos'} para calcular el estado.`,
        date: todayIso,
        href: { pathname: '/mi-carro/configurar/[code]', params: { code: first.code } },
      });
    }
  }

  // Sistema: último mantenimiento registrado (confirmación)
  if (settings.actionConfirmations) {
    const last = data.history
      .filter((e) => e.kind === 'maintenance')
      .sort((a, b) => cmpText(b.date, a.date))[0];
    if (last && last.kind === 'maintenance' && daysBetween(parseISODate(last.date), today) <= RECENT_MAINTENANCE_DAYS) {
      list.push({
        id: `sys-maint-${last.id}`,
        category: 'system',
        icon: 'check',
        title: 'Mantenimiento registrado',
        message: `${last.types.map(maintenanceLabel).join(', ')} · ${formatDate(parseISODate(last.date))}.`,
        date: last.date,
        href: '/historial',
      });
    }
  }

  return list.sort((a, b) => cmpText(b.date, a.date));
}
