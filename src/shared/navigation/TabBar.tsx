import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon, type IconName } from '@/shared/ui';

/** Ícono de cada pestaña, según el nombre del archivo de la ruta. */
const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  historial: 'history',
  estadisticas: 'stats',
  carro: 'car',
};

const ADD_BUTTON_SIZE = 56;

/**
 * Barra inferior de RODEXA Carro: 4 pestañas + botón "+" central.
 * El "+" no es una pestaña: abre la hoja `/nuevo` encima de la pantalla actual.
 */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const focused = state.index === index;
    const color = focused ? colors.brand.accent : colors.text.muted;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={onPress}
        style={styles.tab}>
        <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
          <Icon name={TAB_ICONS[route.name] ?? 'home'} size={sizes.iconMd} color={color} />
        </View>
        <AppText variant="tabLabel" color={color} numberOfLines={1}>
          {label}
        </AppText>
      </Pressable>
    );
  });

  const middle = Math.ceil(tabs.length / 2);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.slice(0, middle)}
      <View style={styles.addSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Registrar gasto, mantenimiento o kilometraje"
          onPress={() => router.push('/nuevo')}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <Icon name="add" size={sizes.iconLg} color={colors.brand.onPrimary} />
        </Pressable>
      </View>
      {tabs.slice(middle)}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: sizes.touchMin,
  },
  tabIcon: {
    width: 56,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    backgroundColor: colors.brand.soft,
  },
  addSlot: {
    flex: 1,
    alignItems: 'center',
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    marginTop: -spacing.xl,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    elevation: 6,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addButtonPressed: {
    backgroundColor: colors.brand.pressed,
  },
}));
