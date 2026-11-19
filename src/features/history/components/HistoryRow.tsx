import { View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import type { EntryView } from '../presentation';

type HistoryRowProps = {
  view: EntryView;
  /** Versión reducida (sin nota, ícono pequeño) para "Última actividad". */
  compact?: boolean;
};

export function HistoryRow({ view, compact = false }: HistoryRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={[styles.icon, compact && styles.iconCompact]}>
        <Icon
          name={view.icon}
          size={compact ? sizes.iconSm : sizes.iconMd}
          color={colors.brand.accent}
        />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {view.title}
        </AppText>
        <AppText variant="caption" tone="secondary" numeric>
          {view.subtitle}
        </AppText>
        {view.note && !compact && (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {view.note}
          </AppText>
        )}
      </View>
      {view.trailing && (
        <AppText variant={compact ? 'captionStrong' : 'bodyStrong'} numeric>
          {view.trailing}
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowCompact: {
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCompact: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
}));
