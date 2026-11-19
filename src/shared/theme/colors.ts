import type { IconName } from '@/shared/ui/Icon';

import { statusIcons, type StatusLevel } from './status';

export type ColorScheme = 'light' | 'dark';

type StatusColors = Record<StatusLevel, { color: string; background: string; icon: IconName }>;

/** Agrega el ícono (fijo) a los colores de estado de cada tema. */
const withIcons = (
  colors: Record<StatusLevel, { color: string; background: string }>,
): StatusColors =>
  Object.fromEntries(
    Object.entries(colors).map(([level, value]) => [
      level,
      { ...value, icon: statusIcons[level as StatusLevel] },
    ]),
  ) as StatusColors;

/** Tokens de color de RODEXA Carro. Cada tema define los mismos tokens. */
export type Palette = {
  scheme: ColorScheme;
  /** Modo sol: alto contraste para el sol de mediodía. */
  highContrast: boolean;
  brand: {
    /** Azul de marca para rellenos (botones, tarjeta del carro). Igual en ambos temas. */
    primary: string;
    pressed: string;
    /** Fondo suave de marca (insignias de íconos, tarjetas destacadas). */
    soft: string;
    onPrimary: string;
    /** Texto secundario sobre fondo azul de marca. */
    onPrimaryMuted: string;
    /** Paneles sutiles dentro de una superficie azul de marca. */
    onPrimarySubtle: string;
    /** Azul de marca como texto o ícono sobre el fondo del tema (contraste legible). */
    accent: string;
  };
  /** Fondo de la app. */
  background: string;
  /** Tarjetas. */
  surface: string;
  /** Hojas, modales y elementos sobre tarjetas. */
  surfaceElevated: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    /** Texto sobre azul de marca. */
    inverse: string;
  };
  overlay: string;
  /**
   * Colores de estado (reservados para el estado del carro):
   * verde Al día · amarillo Próximo · rojo Pendiente · gris Sin datos.
   */
  status: StatusColors;
};

/** Tema claro: la paleta aprobada, sin cambios. */
export const lightColors: Palette = {
  scheme: 'light',
  highContrast: false,
  brand: {
    primary: '#1E4FD8',
    pressed: '#173FAF',
    soft: '#E8EEFC',
    onPrimary: '#FFFFFF',
    onPrimaryMuted: 'rgba(255, 255, 255, 0.78)',
    onPrimarySubtle: 'rgba(255, 255, 255, 0.14)',
    accent: '#1E4FD8',
  },
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E6EC',
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    muted: '#6B7280',
    inverse: '#FFFFFF',
  },
  overlay: 'rgba(17, 24, 39, 0.4)',
  status: withIcons({
    ok: { color: '#15803D', background: '#DCFCE7' },
    soon: { color: '#A16207', background: '#FEF3C7' },
    due: { color: '#B91C1C', background: '#FEE2E2' },
    nodata: { color: '#4B5563', background: '#F3F4F6' },
    na: { color: '#9CA3AF', background: '#F3F4F6' },
  }),
};

/**
 * Tema oscuro: superficies azul-grisáceas (no negro puro) con jerarquía
 * fondo < tarjeta < hoja/modal. El azul de marca se mantiene para rellenos;
 * `accent` es su versión legible como texto/ícono sobre fondo oscuro.
 */
export const darkColors: Palette = {
  scheme: 'dark',
  highContrast: false,
  brand: {
    primary: '#1E4FD8',
    pressed: '#173FAF',
    soft: '#1B2A4D',
    onPrimary: '#FFFFFF',
    onPrimaryMuted: 'rgba(255, 255, 255, 0.8)',
    onPrimarySubtle: 'rgba(255, 255, 255, 0.14)',
    accent: '#8FAEFF',
  },
  background: '#0E131D',
  surface: '#161C28',
  surfaceElevated: '#1D2433',
  border: '#2A3242',
  text: {
    primary: '#F1F4F9',
    secondary: '#B3BCCC',
    muted: '#8F99AB',
    inverse: '#FFFFFF',
  },
  overlay: 'rgba(0, 0, 0, 0.6)',
  status: withIcons({
    ok: { color: '#5EE08E', background: '#15301F' },
    soon: { color: '#F5C84B', background: '#33290F' },
    due: { color: '#FF8A8A', background: '#3A1718' },
    nodata: { color: '#B3BCCC', background: '#232A38' },
    na: { color: '#8F99AB', background: '#1D2330' },
  }),
};

/**
 * Modo sol: los mismos colores de marca, con el texto secundario casi tan oscuro (o claro) como
 * el principal, bordes marcados y fondo puro. Pensado para leer bajo el sol de mediodía.
 */
export function withHighContrast(base: Palette): Palette {
  if (base.scheme === 'dark') {
    return {
      ...base,
      highContrast: true,
      background: '#000000',
      surface: '#0D121C',
      surfaceElevated: '#141A27',
      border: '#6B7891',
      text: { ...base.text, primary: '#FFFFFF', secondary: '#E3E8F0', muted: '#C7CFDC' },
      brand: { ...base.brand, accent: '#A9C1FF' },
    };
  }
  return {
    ...base,
    highContrast: true,
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#6B7280',
    text: { ...base.text, primary: '#000000', secondary: '#1F2937', muted: '#374151' },
    brand: { ...base.brand, accent: '#1640B8' },
  };
}
