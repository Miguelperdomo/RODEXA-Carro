/**
 * Recordatorios LOCALES (notificaciones del teléfono programadas en el propio
 * dispositivo; sin servidor). Categorías ampliables sin rehacer el sistema.
 */
export type ReminderCategory =
  | 'mileage'
  | 'maintenance'
  | 'soat'
  | 'technicalReview'
  | 'license'
  /** Póliza, impuesto y otros documentos (el título es el del documento). */
  | 'document'
  | 'fuel'
  | 'inactivity'
  /** Pico y placa configurado por el usuario (la noche anterior, 8:00 p. m.). */
  | 'picoYPlaca'
  /** Revisión semanal opcional (10:00 a. m.). */
  | 'weeklyCheck'
  /** Recordatorios que creó el usuario (por fecha). */
  | 'custom'
  /** Cuota del crédito del carro (2 días antes). */
  | 'credit'
  /** Puente festivo (3 días antes). */
  | 'longWeekend'
  /** Descuento de un comparendo por acabarse (el día hábil antes). */
  | 'fine';

/**
 * Un recordatorio planificado. El `id` es estable: el mismo dato produce el mismo id,
 * así reprogramar nunca duplica. Con persistencia se guardará tal cual (tabla
 * `scheduled_reminders`: id, category, title, body, fire_at).
 */
export type PlannedReminder = {
  id: string;
  category: ReminderCategory;
  title: string;
  body: string;
  /** Momento en que debe aparecer (hora local). */
  fireAt: Date;
  /** Pantalla que se abre al tocar la notificación (ruta interna). */
  href: string;
};
