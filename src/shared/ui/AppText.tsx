import { Text, type TextProps, type TextStyle } from 'react-native';

import {
  tabularNumbers,
  typography,
  useTheme,
  type Palette,
  type TypographyVariant,
} from '@/shared/theme';

type Tone = 'primary' | 'secondary' | 'muted' | 'brand' | 'inverse';

/** Color de cada tono según el tema. "brand" usa el azul legible sobre el fondo (accent). */
const toneColor = (tone: Tone, colors: Palette): string =>
  ({
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    brand: colors.brand.accent,
    inverse: colors.text.inverse,
  })[tone];

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
  /** Color explícito (p. ej. el de un estado). Tiene prioridad sobre `tone`. */
  color?: string;
  /** Usa dígitos de ancho fijo, para km y dinero. */
  numeric?: boolean;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  color,
  numeric = false,
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors, textScale } = useTheme();
  const base = typography[variant];
  return (
    <Text
      style={[
        base,
        // "Letra grande" (Configuración): todo el texto crece en la misma proporción.
        textScale !== 1 && { fontSize: base.fontSize * textScale, lineHeight: Math.round(base.lineHeight * textScale) },
        { color: color ?? toneColor(tone, colors), textAlign: align },
        numeric && tabularNumbers,
        style,
      ]}
      {...rest}
    />
  );
}
