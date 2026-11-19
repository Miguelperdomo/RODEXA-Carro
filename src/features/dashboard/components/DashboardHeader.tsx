import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useNotifications } from '@/features/notifications/useNotifications';
import { useT } from '@/i18n';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, BrandMark, Icon } from '@/shared/ui';

/** Encabezado de Inicio: marca + notificaciones (con contador) + Configuración. */
export function DashboardHeader() {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = useT();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <BrandMark />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="RODEXA Pro"
        onPress={() => router.push('/pro')}
        style={styles.proTouch}>
        {({ pressed }) => (
          <View style={[styles.proBadge, pressed && styles.proBadgePressed]}>
            <AppText variant="captionStrong" color={colors.brand.onPrimary}>
              ✦ PRO
            </AppText>
          </View>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0
            ? `${t('notif.title')}, ${t('settings.unread', { count: unreadCount })}`
            : t('notif.title')
        }
        onPress={() => router.push('/notificaciones')}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
        <Icon name="notifications" color={colors.text.secondary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <AppText variant="tabLabel" color={colors.brand.onPrimary} numeric>
              {unreadCount > 9 ? '9+' : unreadCount}
            </AppText>
          </View>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.title')}
        onPress={() => router.push('/configuracion')}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
        <Icon name="settings" color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  brand: {
    flex: 1,
  },
  iconButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.border,
  },
  // Área táctil de 48dp; la insignia visible es más baja para no romper el encabezado.
  proTouch: {
    minHeight: sizes.touchMin,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  proBadge: {
    minWidth: 64,
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadgePressed: {
    backgroundColor: colors.brand.pressed,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
