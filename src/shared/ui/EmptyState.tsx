import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  /** Botón u otra acción opcional debajo del mensaje. */
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={36} color={colors.brand.accent} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      {message && (
        <AppText tone="secondary" align="center" style={styles.message}>
          {message}
        </AppText>
      )}
      {action}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    maxWidth: 320,
  },
}));
