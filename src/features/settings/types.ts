import type { ThemePreference } from '@/shared/theme';

export type Language = 'es' | 'en';
export type DistanceUnit = 'km' | 'mi';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type Currency = 'COP';
/** Estilo de uso: Tranqui (la app pregunta poco) o Al detalle (se registra todo). */
export type UsageStyle = 'tranqui' | 'detail';
/** En Tranqui: el combustible no se lleva, se lleva con un valor al mes o con cada carga. */
export type FuelTracking = 'none' | 'monthly' | 'each';

/**
 * Preferencias del usuario. Hoy viven en memoria (mock); en la etapa de SQLite
 * se guardarán en `app_settings` con estas mismas claves.
 * Los intervalos de cada componente NO van aquí: pertenecen a su configuración.
 */
export type Settings = {
  theme: ThemePreference;
  language: Language;
  distanceUnit: DistanceUnit;
  currency: Currency;
  dateFormat: DateFormat;

  // Estilo de uso (se elige en el primer ingreso; se cambia en Configuración → Mi estilo)
  usageStyle: UsageStyle;
  fuelTracking: FuelTracking;
  /** "Ahora no" en la pregunta de Tranqui: no se vuelve a preguntar hasta esta fecha (AAAA-MM-DD) o ''. */
  tranquiAskSnoozedUntil: string;
  /** "No, gracias" a la sugerencia de cambiar de estilo: hasta esta fecha (AAAA-MM-DD) o ''. */
  styleSuggestionSnoozedUntil: string;

  // Notificaciones (una sola fuente: se muestran también en Mantenimiento y Documentos)
  maintenanceReminders: boolean;
  documentReminders: boolean;
  odometerReminders: boolean;
  fuelReminders: boolean;
  activityReminders: boolean;
  actionConfirmations: boolean;
  importantNotifications: boolean;
  /** Aviso 2 días antes de cada cuota del crédito del carro. */
  creditReminders: boolean;
  /** Aviso 3 días antes de cada puente festivo (abre la revisión de viaje). */
  longWeekendReminders: boolean;
  /** Temporada de lluvias que ya cerró en Inicio ("2026-2") o ''. */
  rainSeasonDismissed: string;
  /** Grupos abiertos en Mi carro ("maintenance,documents"): se recuerda cómo los dejó. */
  carOpenGroups: string;
  /** Aviso el día hábil antes de que se acabe el descuento de un comparendo. */
  fineReminders: boolean;
  /** "¿Estoy en regla?": lo que marcó que lleva en el carro ("jack,triangles"). */
  roadKit: string;
  /** Filtro de Historial que dejó elegido y su vista (lista o calendario). */
  historyFilter: string;
  historyView: string;
  /** Pestaña de Estadísticas que dejó abierta (month, year o records). */
  statsTab: string;

  // Mantenimiento
  showEstimate: boolean;
  showRecommendations: boolean;
  /** Tarjeta "Primeros pasos" en Inicio (se apaga con "Omitir"). */
  showGettingStarted: boolean;
  /** Se cerró la invitación "Guarda el número de tu mecánico y de la grúa" en Inicio. */
  quickCallInviteDismissed: boolean;
  /** Foto del carro (opcional), en la carpeta privada de RODEXA. '' = sin foto. No es una preferencia. */
  carPhotoUri: string;
  /** Última copia .rodexa guardada y COMPROBADA (AAAA-MM-DD) o ''. No es una preferencia. */
  lastBackupAt: string;
  /** Carpeta elegida para las copias (las próximas se guardan ahí sin preguntar) o ''. */
  backupFolderUri: string;
  backupFolderName: string;
  /** "¿Cuánto me ahorro?": pasaje del transporte público y viajes al mes que escribió (0 = sin calcular). */
  transitFareCop: number;
  transitTripsPerMonth: number;
  /** "Letra grande": agranda el texto de toda la app un 15 %. */
  largeText: boolean;
  /** "Modo sol": alto contraste para leer bajo el sol. */
  sunMode: boolean;
  /** Apps de la familia RODEXA de las que pidió aviso ("moto,hogar"). No es una preferencia: se conserva al restablecer. */
  familyAppsNotify: string;
  /** "Avísame cuando salga RODEXA Pro" y si ya vio el aviso del lanzamiento (no son preferencias). */
  proNotifyMe: boolean;
  proLaunchSeen: boolean;

  // Revisión semanal (opcional)
  weeklyCheckEnabled: boolean;
  /** Última revisión hecha (AAAA-MM-DD) o '' si nunca. */
  weeklyCheckLastDone: string;
  /** Día en que se activó (AAAA-MM-DD) o ''. */
  weeklyCheckSince: string;

  // Documentos
  remindSoat: boolean;
  remindRtm: boolean;
  remindLicense: boolean;
  remindPolicy: boolean;
  remindTax: boolean;
  remindOther: boolean;
};
