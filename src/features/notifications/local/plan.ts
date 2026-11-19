import { energyRecordKinds } from '@/features/cars/energy';
import type { DocumentType } from '@/features/cars/types';
import { DOCUMENT_DEFINITIONS } from '@/features/documents/catalog';
import { consumptionPairs, energyRecords } from '@/features/energy/compute';
import type { AppData } from '@/features/session/types';
import { customNotifications, type CustomReminder } from '@/features/customReminders/rules';
import { picoYPlacaReminders, type PicoYPlacaConfig } from '@/features/picoYPlaca/rules';
import { weeklyReminders } from '@/features/weeklyCheck/rules';
import type { Settings } from '@/features/settings/types';
import { effectiveSettings, isTranqui, TRANQUI_MILEAGE_DAYS } from '@/features/settings/usageStyle';
import { daysUntilMaintenanceAsk } from '@/features/tranqui/ask';
import { LONG_WEEKEND_NOTICE_DAYS, upcomingLongWeekends } from '@/features/colombia/holidays';
import { fineReminderDates, type FineRecord } from '@/features/law/fines';
import { creditOf, CREDIT_REMINDER_DAYS_BEFORE, upcomingCreditDues } from '@/features/credit/credit';
import type { RecurringExpense } from '@/features/recurring/rules';
import { addDays, daysBetween, formatDate, parseISODate, toISODate } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

import { CATEGORY_TITLES, ENERGY_REMINDERS, VARIANTS, documentReminderBody, pickVariant } from './messages';
import type { PlannedReminder, ReminderCategory } from './types';

/** Hora local a la que aparecen los recordatorios (nunca de madrugada). */
export const REMINDER_HOUR = 9;

/** Series de días después del último dato real. Se programan solo las futuras. */
const MILEAGE_DAYS = [7, 14, 21];
/**
 * Mantenimiento próximo o vencido: el día siguiente a la última lectura de km y luego
 * una vez por semana hasta que se registre (aunque el km no se actualice).
 */
const MAINTENANCE_FIRST_DAY = 1;
const MAINTENANCE_EVERY_DAYS = 7;
/** Cuántos avisos semanales futuros se dejan programados (el plan se rehace al abrir la app). */
const MAINTENANCE_UPCOMING = 3;
const MAINTENANCE_STALE_DAYS = [60];
/** Días después del último registro de abastecimiento (diseño de RODEXA, no un dato técnico). */
const ENERGY_REMINDER_DAYS = [10, 20];
const ENERGY_TIP_DAYS = 4;
const INACTIVITY_DAYS = [12, 25];
const DOCUMENT_DAYS_BEFORE = [30, 7, 1] as const;

/** Categoría de los avisos de SOAT, RTM y licencia (las demás usan "document"). */
const DOCUMENT_REMINDER_CATEGORY: Partial<Record<DocumentType, ReminderCategory>> = {
  soat: 'soat',
  rtm: 'technicalReview',
  license: 'license',
};

/** Antelación mínima: nada "de inmediato" (p. ej. justo después del primer ingreso). */
const MIN_LEAD_HOURS = 12;
/** Los documentos son importantes: basta con 1 h (el aviso "vence mañana" es a las 9:00 del día previo). */
const DOCUMENT_MIN_LEAD_HOURS = 1;
/** Entre dos recordatorios "suaves" (kilometraje, combustible, actividad…) al menos estos días. */
const SOFT_GAP_DAYS = 3;
/** Si el día está ocupado, se corre hasta estos días; si no cabe, se descarta. */
const MAX_SHIFT_DAYS = 4;
/** Máximo de recordatorios programados a la vez. */
export const MAX_REMINDERS = 20;

/** Prioridad al repartir días: menor = más importante. */
const PRIORITY: Record<ReminderCategory, number> = {
  soat: 0,
  technicalReview: 0,
  license: 0,
  document: 0,
  maintenance: 1,
  mileage: 2,
  fuel: 3,
  inactivity: 4,
  picoYPlaca: 5,
  weeklyCheck: 5,
  custom: 1,
  credit: 0,
  longWeekend: 1,
  fine: 0,
};

type Candidate = PlannedReminder & { soft: boolean };

function at(iso: string, days: number): Date {
  const date = addDays(parseISODate(iso), days);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

/**
 * Qué recordatorios tiene sentido programar HOY con los datos reales. Función pura
 * (sin librerías del teléfono): mismo dato → mismo plan, así que reprogramar no
 * duplica ni cambia los textos. Nunca inventa fechas ni kilometrajes: si un dato
 * no existe, su recordatorio no se crea.
 */
export function buildReminderPlan(
  data: AppData,
  saved: Settings,
  now: Date,
  picoYPlaca?: PicoYPlacaConfig,
  customReminders: CustomReminder[] = [],
  recurring: RecurringExpense[] = [],
  fines: FineRecord[] = [],
): PlannedReminder[] {
  // Tranqui: sin avisos de combustible, de días sin registrar ni de revisión semanal.
  const settings = effectiveSettings(saved);
  const tranqui = isTranqui(saved);
  const candidates: Candidate[] = [];
  const add = (
    category: ReminderCategory,
    id: string,
    body: string,
    fireAt: Date,
    soft: boolean,
    href: string,
    title = CATEGORY_TITLES[category],
  ) => candidates.push({ id, category, title, body, fireAt, soft, href });

  // Documentos: solo con una fecha registrada por el usuario (vencimiento o fecha límite
  // de pago de un impuesto no pagado ni exento) y su preferencia encendida (catálogo).
  if (settings.documentReminders) {
    for (const doc of data.documents) {
      const setting = DOCUMENT_DEFINITIONS[doc.type].reminderSetting;
      if (!doc.alertDate || !setting || !settings[setting]) continue;
      const category = DOCUMENT_REMINDER_CATEGORY[doc.type] ?? 'document';
      // Al tocarla abre el detalle del documento.
      const href = `/documentos/${encodeURIComponent(doc.key)}`;
      for (const days of DOCUMENT_DAYS_BEFORE) {
        add(
          category,
          `${doc.key}-${doc.alertDate}-${days}d`,
          documentReminderBody(doc, days),
          at(doc.alertDate, -days),
          false,
          href,
          doc.title,
        );
      }
      // Un solo aviso el día siguiente al vencimiento.
      add(
        category,
        `${doc.key}-${doc.alertDate}-after`,
        documentReminderBody(doc, 'after'),
        at(doc.alertDate, 1),
        false,
        href,
        doc.title,
      );
    }
  }

  if (settings.maintenanceReminders) {
    // Componentes próximos o pendientes según los registros (nunca los "Sin datos").
    for (const c of data.components) {
      if (!c.enabled || (c.status !== 'soon' && c.status !== 'due')) continue;
      const base =
        c.status === 'due'
          ? `${c.title}: según tus registros ya corresponde. Revisa si ya lo hiciste.`
          : c.code === 'oil'
            ? '¿Ya revisaste el aceite de tu carro? Según tus registros, su cambio está cerca.'
            : `${c.title}: tu mantenimiento está próximo según tus registros.`;
      // Contexto solo con datos reales: el km del último servicio y el km registrado hoy.
      const lastKm = c.lastService?.km;
      const since = lastKm !== undefined ? data.odometer.registeredKm - lastKm : undefined;
      const body =
        since !== undefined && since > 0
          ? `${base} Llevas ${formatKm(since)} desde ${c.code === 'oil' ? 'el último cambio' : 'el último servicio'}.`
          : base;
      // Ancla estable: la última lectura de km (lo que cambia el estado del componente).
      const anchor = data.odometer.lastReadingDate;
      maintenanceDays(anchor, now).forEach((days) =>
        add(
          'maintenance',
          `maint-${c.code}-${c.status}-${anchor}-${days}`,
          body,
          at(anchor, days),
          false,
          `/mi-carro/componente/${c.code}`,
        ),
      );
    }
    // Hace tiempo sin mantenimientos (solo si alguna vez registró uno).
    const lastMaintenance = latestDate(
      data.history.filter((e) => e.kind === 'maintenance').map((e) => e.date),
    );
    if (lastMaintenance) {
      MAINTENANCE_STALE_DAYS.forEach((days, step) =>
        add(
          'maintenance',
          `maint-stale-${lastMaintenance}-${days}`,
          pickVariant(VARIANTS.maintenanceStale, lastMaintenance, step),
          at(lastMaintenance, days),
          true,
          '/registrar/mantenimiento',
        ),
      );
    }
  }

  // Kilometraje: desde la última lectura CONOCIDA (los km desconocidos no cuentan).
  if (settings.odometerReminders) {
    const last = data.odometer.lastReadingDate;
    (tranqui ? TRANQUI_MILEAGE_DAYS : MILEAGE_DAYS).forEach((days, step) =>
      add(
        'mileage',
        `mileage-${last}-${days}`,
        // Tranqui: la revisión del mes se responde en Inicio con un toque.
        tranqui ? 'Revisión del mes: ¿usaste el carro? Registra cuánto marca desde Inicio.' : pickVariant(VARIANTS.mileage, last, step),
        at(last, days),
        true,
        tranqui ? '/' : '/registrar/kilometraje',
      ),
    );
    // Tranqui: cuando, según tu ritmo, un mantenimiento se acercaría → pedir el km real.
    const ask = tranqui ? daysUntilMaintenanceAsk(data, now) : undefined;
    if (ask) {
      const fireAt = addDays(now, ask.days);
      fireAt.setHours(REMINDER_HOUR, 0, 0, 0);
      add(
        'mileage',
        `tranqui-ask-${last}-${toISODate(fireAt)}`,
        `${ask.title}: según tu ritmo podría estar cerca. ¿Cuánto marca tu carro?`,
        fireAt,
        true,
        '/',
      );
    }
  }

  // Abastecimiento (tanqueo, GNC, carga eléctrica): SOLO los tipos que el carro puede
  // registrar según la regla central (cars/energy) y SOLO si ya hay un registro de ese
  // tipo. La fecha sale del último registro del usuario; nada del fabricante.
  if (settings.fuelReminders) {
    for (const kind of energyRecordKinds(data.profile)) {
      const texts = ENERGY_REMINDERS[kind];
      const last = latestDate(energyRecords(data.history, kind).map((r) => r.date));
      if (!last) continue;
      const href = `/registrar/energia?tipo=${kind}`;
      ENERGY_REMINDER_DAYS.forEach((days, step) =>
        add('fuel', `${kind}-${last}-${days}`, pickVariant(texts.variants, last, step), at(last, days), true, href, texts.title),
      );
      // Consejo para poder calcular el consumo, solo mientras no haya ningún tramo comparable.
      if (consumptionPairs(data.history, kind).length === 0) {
        add('fuel', `${kind}-tip-${last}`, texts.tip, at(last, ENERGY_TIP_DAYS), true, href, texts.title);
      }
    }
  }

  // Actividad: desde el último registro de cualquier tipo. Con moderación (2 como máximo).
  if (settings.activityReminders) {
    const lastActivity = latestDate([data.odometer.lastReadingDate, ...data.history.map((e) => e.date)]);
    if (lastActivity) {
      INACTIVITY_DAYS.forEach((days, step) =>
        add(
          'inactivity',
          `inactivity-${lastActivity}-${days}`,
          pickVariant(VARIANTS.inactivity, lastActivity, step),
          at(lastActivity, days),
          true,
          '/',
        ),
      );
    }
  }

  // Comparendos: el día hábil antes de que se acabe cada descuento (50 % y 25 %). Es dinero: no se corre.
  if (settings.fineReminders) {
    for (const fine of fines) {
      for (const r of fineReminderDates(fine)) {
        add(
          'fine',
          `fine-${fine.id}-${r.percent}`,
          `Mañana se acaba el descuento del ${r.percent} % de tu comparendo. Paga con el curso antes de que se venza.`,
          at(r.date, 0),
          false,
          '/multas',
        );
      }
    }
  }

  // Puentes festivos: 3 días antes, para revisar el carro antes de viajar (se puede apagar).
  if (settings.longWeekendReminders) {
    for (const w of upcomingLongWeekends(now)) {
      add(
        'longWeekend',
        `puente-${w.start}`,
        `Se viene el puente de ${w.name}. ¿Vas a viajar? Revisa tu carro antes de salir.`,
        at(w.start, -LONG_WEEKEND_NOTICE_DAYS),
        true,
        '/revision-viaje',
      );
    }
  }

  // Crédito del carro: 2 días antes de cada cuota que falte (las próximas 2). Es importante
  // (dinero): no es "suave" y no se corre de día.
  if (settings.creditReminders) {
    const credit = creditOf(recurring);
    if (credit) {
      for (const due of upcomingCreditDues(credit, data.history, now)) {
        add(
          'credit',
          `credit-${credit.id}-${due}`,
          `En 2 días (${formatDate(parseISODate(due))}) toca pagar la cuota del carro: ${formatCop(credit.amountCop)}.`,
          at(due, -CREDIT_REMINDER_DAYS_BEFORE),
          false,
          '/mi-carro/credito',
        );
      }
    }
  }

  // Pico y placa: a las 8:00 p. m. del día anterior, aparte del aviso diario de las 9:00 a. m.
  // (no le quita el día a un documento o mantenimiento). Solo si el usuario lo pidió.
  // Los recordatorios que creó el usuario también van aparte: él eligió la fecha.
  return [
    ...spreadOut(candidates, now),
    ...picoYPlacaReminders(picoYPlaca, now),
    ...weeklyReminders(settings, now),
    ...customNotifications(customReminders, now),
  ].sort(
    (a, b) => a.fireAt.getTime() - b.fireAt.getTime(),
  );
}

/**
 * Reglas contra el spam: nada en el pasado ni inmediato, un recordatorio por día
 * (los documentos pueden compartir día), separación mínima entre avisos suaves y
 * un tope total. Lo que no cabe se corre unos días o se descarta.
 */
function spreadOut(candidates: Candidate[], now: Date): PlannedReminder[] {
  const upcoming = candidates.filter((c) => {
    const lead = c.soft || c.category === 'maintenance' ? MIN_LEAD_HOURS : DOCUMENT_MIN_LEAD_HOURS;
    return c.fireAt.getTime() - now.getTime() >= lead * 3_600_000;
  });
  upcoming.sort(
    (a, b) => PRIORITY[a.category] - PRIORITY[b.category] || a.fireAt.getTime() - b.fireAt.getTime(),
  );

  const placed: Candidate[] = [];
  // Los avisos de documentos nunca se corren de día (su fecha importa) y pueden compartirlo.
  const isDocument = (c: Candidate) =>
    c.category === 'soat' || c.category === 'technicalReview' || c.category === 'license' || c.category === 'document';

  for (const candidate of upcoming) {
    if (placed.length >= MAX_REMINDERS) break;
    for (let shift = 0; shift <= (isDocument(candidate) ? 0 : MAX_SHIFT_DAYS); shift++) {
      const fireAt = addDays(candidate.fireAt, shift);
      fireAt.setHours(REMINDER_HOUR, 0, 0, 0);
      const day = toISODate(fireAt);
      const dayTaken = placed.some(
        (p) => toISODate(p.fireAt) === day && !(isDocument(p) && isDocument(candidate)),
      );
      const softTooClose =
        candidate.soft &&
        placed.some(
          (p) => p.soft && Math.abs(p.fireAt.getTime() - fireAt.getTime()) < SOFT_GAP_DAYS * 86_400_000,
        );
      if (!dayTaken && !softTooClose) {
        placed.push({ ...candidate, fireAt });
        break;
      }
    }
  }

  return placed
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .map(({ soft: _soft, ...reminder }) => reminder);
}

/**
 * Días (desde la última lectura) de los avisos de mantenimiento: 1, 8, 15, 22… Solo los
 * próximos MAINTENANCE_UPCOMING a partir de hoy; los ya pasados los descarta spreadOut.
 * Mismo día de cálculo → mismos días (ids estables, sin duplicados al reprogramar).
 */
function maintenanceDays(anchor: string, now: Date): number[] {
  const elapsed = Math.max(daysBetween(parseISODate(anchor), now), 0);
  // Primer paso de la serie que todavía no pasó (o el de hoy, que spreadOut filtra si ya es tarde).
  const firstStep = Math.max(Math.floor((elapsed - MAINTENANCE_FIRST_DAY) / MAINTENANCE_EVERY_DAYS), 0);
  return Array.from(
    { length: MAINTENANCE_UPCOMING + 1 },
    (_, i) => MAINTENANCE_FIRST_DAY + (firstStep + i) * MAINTENANCE_EVERY_DAYS,
  );
}

function latestDate(dates: string[]): string | undefined {
  return dates.reduce<string | undefined>((max, d) => (!max || d > max ? d : max), undefined);
}
