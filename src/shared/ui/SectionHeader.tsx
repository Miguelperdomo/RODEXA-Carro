import { StyleSheet, View } from 'react-native';

import { sizes, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { InfoButton, type InfoText } from './InfoButton';

type SectionHeaderProps = {
  title: string;
  icon?: IconName;
  /** Texto pequeño a la derecha: "Según tus registros"… */
  caption?: string;
  /** ⓘ junto al título (solo para lo que no todos entienden). */
  info?: InfoText;
};

export function SectionHeader({ title, icon, caption, info }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {icon && <Icon name={icon} size={sizes.iconSm} color={colors.brand.accent} />}
      <View style={styles.title}>
        <AppText variant="heading" style={styles.titleText}>
          {title}
        </AppText>
        {info && <InfoButton {...info} />}
      </View>
      {caption && (
        <AppText variant="caption" tone="muted">
          {caption}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  titleText: {
    flexShrink: 1,
  },
});
