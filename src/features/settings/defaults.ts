import type { Settings } from './types';

/** Valores por defecto: Colombia · COP · km · DD/MM/YYYY · tema claro. */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  language: 'es',
  distanceUnit: 'km',
  currency: 'COP',
  dateFormat: 'DD/MM/YYYY',

  // Quien ya usa la app sigue como siempre ("Al detalle"); el primer ingreso propone Tranqui.
  usageStyle: 'detail',
  fuelTracking: 'each',
  tranquiAskSnoozedUntil: '',
  styleSuggestionSnoozedUntil: '',

  maintenanceReminders: true,
  documentReminders: true,
  odometerReminders: true,
  fuelReminders: true,
  activityReminders: true,
  actionConfirmations: true,
  importantNotifications: true,
  creditReminders: true,
  longWeekendReminders: true,
  rainSeasonDismissed: '',
  carOpenGroups: 'maintenance,documents',
  fineReminders: true,
  roadKit: '',
  historyFilter: '',
  historyView: 'list',
  statsTab: 'month',

  showEstimate: true,
  showRecommendations: true,
  showGettingStarted: true,
  quickCallInviteDismissed: false,
  carPhotoUri: '',
  lastBackupAt: '',
  backupFolderUri: '',
  backupFolderName: '',
  transitFareCop: 0,
  transitTripsPerMonth: 0,
  largeText: false,
  sunMode: false,
  familyAppsNotify: '',
  proNotifyMe: false,
  proLaunchSeen: false,
  weeklyCheckEnabled: false,
  weeklyCheckLastDone: '',
  weeklyCheckSince: '',

  remindSoat: true,
  remindRtm: true,
  remindLicense: true,
  remindPolicy: true,
  remindTax: true,
  remindOther: true,
};

/** Región actual (única por ahora). Estructura lista para futuras regiones. */
export const REGIONS = {
  CO: {
    code: 'CO',
    country: 'Colombia',
    currency: 'COP',
    currencyName: 'Peso colombiano',
  },
} as const;

export const CURRENT_REGION = REGIONS.CO;
