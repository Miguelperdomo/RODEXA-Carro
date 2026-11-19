import type { IconName } from '@/shared/ui';

import type { Settings, UsageStyle } from './types';

/**
 * Los dos estilos de RODEXA. En Tranqui la app NO insiste en registrar: pide el km una vez
 * al mes (o cuando un mantenimiento podría estar cerca), no recuerda el combustible y el
 * Inicio muestra solo lo importante. Las preferencias guardadas no se tocan: al volver a
 * "Al detalle", todo queda como estaba.
 */
export type UsageStyleInfo = {
  value: UsageStyle;
  /** Los únicos emojis permitidos en la interfaz: 😎 Tranqui y 📊 Al detalle. */
  emoji: string;
  icon: IconName;
  title: string;
  promise: string;
  points: string[];
  /** Explicación completa (Configuración): solo lo que de verdad cambia. */
  details: { title: string; text: string }[];
};

export const USAGE_STYLES: UsageStyleInfo[] = [
  {
    value: 'detail',
    emoji: '📊',
    icon: 'stats',
    title: 'Al detalle',
    promise: 'Controla cada peso y cada kilómetro.',
    points: [
      'Registras cada carga, gasto y kilometraje',
      'Ves cuánto rinde tu carro y en qué gastas',
      'Para quien quiere todos los números',
    ],
    details: [
      { title: 'Para quién es', text: 'Para quien quiere saber exactamente cuánto gasta y cuánto rinde su carro.' },
      {
        title: 'Kilometraje y combustible',
        text: 'Registras cada carga y el kilometraje. Con dos cargas de tanque lleno calculamos el consumo de tu carro.',
      },
      {
        title: 'Avisos',
        text: 'Mantenimiento, documentos, combustible y días sin registrar. Puedes activar o desactivar cada aviso en Configuración → Notificaciones.',
      },
      { title: 'Inicio', text: 'Completo: actividad reciente, resumen del mes y más.' },
    ],
  },
  {
    value: 'tranqui',
    emoji: '😎',
    icon: 'usagePersonal',
    title: 'Tranqui',
    promise: 'Tú manejas; RODEXA te avisa lo importante.',
    points: [
      'No tienes que registrar el km ni el combustible a cada rato',
      'Te avisamos el aceite, el SOAT y lo importante',
      'Inicio sencillo, solo con lo que necesitas',
    ],
    details: [
      { title: 'Para quién es', text: 'Para quien quiere cuidar el carro sin anotarlo todo.' },
      {
        title: 'Kilometraje',
        text: 'Te lo pedimos una vez al mes, no cada semana. Con tus registros calculamos cuánto recorres y te preguntamos cuando un mantenimiento podría estar cerca.',
      },
      {
        title: 'Combustible',
        text: 'Tú eliges: no llevarlo, poner un valor fijo al mes o registrar cada carga.',
      },
      {
        title: 'Avisos',
        text: 'No te recordamos registrar el combustible, los días sin registrar ni la revisión semanal. Los avisos de mantenimiento y documentos (aceite, SOAT, revisión técnico-mecánica) siguen igual.',
      },
      { title: 'Inicio', text: 'Más sencillo: sin la actividad reciente ni el resumen del mes.' },
    ],
  },
];

/** "Al detalle" va primero (es el predeterminado). */
export const usageStyleInfo = (style: UsageStyle): UsageStyleInfo =>
  USAGE_STYLES.find((s) => s.value === style) ?? USAGE_STYLES[0];

/** "😎 Tranqui" / "📊 Al detalle". */
export const usageStyleLabel = (style: UsageStyle) => {
  const info = usageStyleInfo(style);
  return `${info.emoji} ${info.title}`;
};

export const isTranqui = (settings: Pick<Settings, 'usageStyle'>) => settings.usageStyle === 'tranqui';

/** En Tranqui el km se pide una vez al mes (no cada semana). */
export const TRANQUI_MILEAGE_DAYS = [30];
export const TRANQUI_ODOMETER_STALE_DAYS = 30;

/** Avisos que se apagan en Tranqui (los que piden registrar seguido). */
export const TRANQUI_MUTED: (keyof Settings)[] = ['fuelReminders', 'activityReminders', 'weeklyCheckEnabled'];

/**
 * Las preferencias que valen según el estilo. En Tranqui se apagan los avisos que piden
 * registrar seguido (combustible, "hace días no registras", revisión semanal); lo de cuidar
 * el carro (mantenimiento, documentos) sigue igual. No cambia lo guardado.
 */
export function effectiveSettings(settings: Settings): Settings {
  if (!isTranqui(settings)) return settings;
  return { ...settings, fuelReminders: false, activityReminders: false, weeklyCheckEnabled: false };
}
