import { View } from 'react-native';

import { createStyles, radius, spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

/** Barra de progreso discreta del primer ingreso: "Paso 2 de 6" + segmentos. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const styles = useStyles();
  return (
    <View style={styles.container} accessibilityLabel={`Paso ${step} de ${total}`}>
      <AppText variant="captionStrong" tone="brand">
        Paso {step} de {total}
      </AppText>
      <View style={styles.bar}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i < step && styles.segmentDone]} />
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  container: {
    gap: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  segmentDone: {
    backgroundColor: colors.brand.primary,
  },
}));
