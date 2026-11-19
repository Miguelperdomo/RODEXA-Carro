import type { TextStyle } from 'react-native';

/**
 * Escala tipográfica. Usa la fuente del sistema (Roboto en Android).
 * Tamaño mínimo de texto: 14. Única excepción aprobada: `tabLabel` (12),
 * el estándar de Android para las etiquetas de la barra inferior.
 */
export const typography = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  captionStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  tabLabel: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Dígitos de ancho fijo: el km y los pesos no "bailan" al cambiar. */
export const tabularNumbers: TextStyle = { fontVariant: ['tabular-nums'] };
