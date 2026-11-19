import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { HistoryRow } from '@/features/history/components/HistoryRow';
import { describeEntry } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Card, SectionHeader } from '@/shared/ui';

type RecentActivitySectionProps = {
  entries: HistoryEntry[];
};

/** Últimos registros, en formato compacto. Tocar cualquiera abre el Historial. */
export function RecentActivitySection({ entries }: RecentActivitySectionProps) {
  const styles = useStyles();
  if (entries.length === 0) return null;

  const openHistory = () => router.push('/historial');

  return (
    <View>
      <SectionHeader title="Última actividad" icon="history" />
      <Card flush>
        {entries.map((entry, index) => (
          <Fragment key={entry.id}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Abre el historial"
              onPress={openHistory}
              style={({ pressed }) => pressed && styles.pressed}>
              <HistoryRow view={describeEntry(entry)} compact />
            </Pressable>
          </Fragment>
        ))}
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          onPress={openHistory}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
          <AppText variant="captionStrong" tone="brand">
            Ver todo el historial
          </AppText>
        </Pressable>
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  seeAll: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
}));
