import { View } from 'react-native';

import { DEMO_DATA_ENABLED } from '@/config/dev';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import { useAppData } from '@/features/session/SessionProvider';

/** Aviso fijo: los repuestos según el vehículo llegan próximamente (en desarrollo, los DEMO no son reales). */
export function PreviewBanner() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { profile } = useAppData();
  const carName = [profile.brandName, profile.model, profile.year].filter(Boolean).join(' ') || 'tu carro';
  return (
    <View style={styles.banner}>
      <Icon name="preview" size={20} color={colors.brand.accent} />
      <View style={styles.texts}>
        <AppText variant="captionStrong" tone="brand">
          Próximamente: repuestos según tu carro
        </AppText>
        <AppText variant="caption" tone="secondary">
          {DEMO_DATA_ENABLED
            ? 'Modo desarrollo: los productos marcados DEMO son de ejemplo, no son reales.'
            : `Aquí estarán los repuestos para tu ${carName}. Mientras tanto, anota lo que usa tu carro (aceite, filtros, frenos, llantas…) y quedará guardado.`}
        </AppText>
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand.accent,
    backgroundColor: colors.brand.soft,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
}));
