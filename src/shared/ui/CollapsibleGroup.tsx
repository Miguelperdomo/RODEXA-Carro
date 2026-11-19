import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  icon: IconName;
  /** Lo útil aunque esté cerrado ("SOAT vence en 12 días", "$1.200.000 este mes"). */
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/** Grupo plegable: título con resumen; al tocarlo se abre o se cierra. */
export function CollapsibleGroup({ title, icon, summary, open, onToggle, children }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${summary ? `. ${summary}` : ''}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={colors.brand.accent} />
        </View>
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{title}</AppText>
          {summary ? (
            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {summary}
            </AppText>
          ) : null}
        </View>
        <Icon name={open ? 'expandLess' : 'expandMore'} color={colors.text.muted} />
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    borderRadius: radius.lg,
    borderWidth: colors.highContrast ? 2 : 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
