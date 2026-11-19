import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { NotificationCategory } from '@/features/notifications/types';
import { useNotifications, type NotificationWithState } from '@/features/notifications/useNotifications';
import { useT, type TranslationKey } from '@/i18n';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Chip, EmptyState, FormScreen, Icon, useToast } from '@/shared/ui';
import { daysBetween, parseISODate, today } from '@/shared/utils/date';

type Filter = 'all' | NotificationCategory;

const FILTERS: { value: Filter; label: TranslationKey }[] = [
  { value: 'all', label: 'notif.filter.all' },
  { value: 'maintenance', label: 'notif.filter.maintenance' },
  { value: 'documents', label: 'notif.filter.documents' },
  { value: 'odometer', label: 'notif.filter.odometer' },
  { value: 'system', label: 'notif.filter.system' },
];

const CATEGORY_LABEL: Record<NotificationCategory, TranslationKey> = {
  maintenance: 'notif.filter.maintenance',
  documents: 'notif.filter.documents',
  odometer: 'notif.filter.odometer',
  system: 'notif.filter.system',
};

/** Centro de notificaciones (dentro de la app). Deducidas de los datos actuales, no aleatorias. */
export default function NotificationCenterScreen() {
  const styles = useStyles();
  const t = useT();
  const toast = useToast();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = filter === 'all' ? notifications : notifications.filter((n) => n.category === filter);

  const relativeTime = (iso: string) => {
    const days = daysBetween(parseISODate(iso), today());
    if (days <= 0) return t('notif.time.today');
    if (days === 1) return t('notif.time.yesterday');
    return t('notif.time.daysAgo', { count: days });
  };

  const open = (n: NotificationWithState) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <FormScreen title={t('notif.title')} closeIcon="back">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersBar}
        contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.value} label={t(f.label)} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      {unreadCount > 0 && (
        <View style={styles.markAll}>
          <Button
            label={t('notif.markAllRead')}
            icon="markRead"
            variant="ghost"
            onPress={() => {
              markAllRead();
              toast.show(t('toast.allRead'));
            }}
          />
        </View>
      )}

      {visible.length === 0 ? (
        <EmptyState icon="notifications" title={t('notif.title')} message={t('notif.empty')} />
      ) : (
        <View style={styles.list}>
          {visible.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              category={t(CATEGORY_LABEL[n.category])}
              time={relativeTime(n.date)}
              unreadLabel={t('notif.unread')}
              markReadLabel={t('notif.markRead')}
              onOpen={() => open(n)}
              onMarkRead={() => markRead(n.id)}
            />
          ))}
        </View>
      )}
    </FormScreen>
  );
}

type NotificationCardProps = {
  notification: NotificationWithState;
  category: string;
  time: string;
  unreadLabel: string;
  markReadLabel: string;
  onOpen: () => void;
  onMarkRead: () => void;
};

/** No leída: fondo ligeramente destacado + punto azul (no rojo) + etiqueta de texto. */
function NotificationCard({
  notification: n,
  category,
  time,
  unreadLabel,
  markReadLabel,
  onOpen,
  onMarkRead,
}: NotificationCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Card flush style={!n.read && styles.unreadCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${n.read ? '' : `${unreadLabel}. `}${category}. ${n.title}. ${n.message}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.iconBox}>
          <Icon name={n.icon} size={sizes.iconMd} color={colors.brand.accent} />
        </View>
        <View style={styles.texts}>
          <View style={styles.meta}>
            <AppText variant="captionStrong" tone="secondary">
              {category}
            </AppText>
            <AppText variant="caption" tone="muted">
              · {time}
            </AppText>
            {!n.read && (
              <View style={styles.unreadTag}>
                <View style={styles.dot} />
                <AppText variant="captionStrong" tone="brand">
                  {unreadLabel}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="bodyStrong">{n.title}</AppText>
          <AppText variant="caption" tone="secondary">
            {n.message}
          </AppText>
        </View>
        {n.href && <Icon name="chevronRight" color={colors.text.muted} />}
      </Pressable>
      {!n.read && (
        <View style={styles.actions}>
          <Button label={markReadLabel} variant="ghost" onPress={onMarkRead} />
        </View>
      )}
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  // Evita que la fila de filtros se estire verticalmente.
  filtersBar: {
    flexGrow: 0,
  },
  filters: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  markAll: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: -spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  unreadCard: {
    backgroundColor: colors.brand.soft,
    borderColor: colors.brand.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unreadTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
  },
  actions: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    marginTop: -spacing.md,
  },
}));
