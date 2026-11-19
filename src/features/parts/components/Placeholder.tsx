import { View, type DimensionValue } from 'react-native';

import { createStyles, radius } from '@/shared/theme';

/** Bloque gris que reserva el espacio de un dato que aún no existe. */
export function Placeholder({ width = '60%', height = 12 }: { width?: DimensionValue; height?: number }) {
  const styles = useStyles();
  return <View style={[styles.block, { width, height }]} accessibilityElementsHidden />;
}

const useStyles = createStyles((colors) => ({
  block: {
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
}));
