import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { energyRecordKinds } from '@/features/cars/energy';
import { ENERGY_ACTION_DESCRIPTIONS, energyActionTitle } from '@/features/energy/form';
import { ENERGY_META } from '@/features/energy/meta';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Icon, type IconName } from '@/shared/ui';

type QuickAction = {
  icon: IconName;
  title: string;
  description: string;
  href: Href;
};

/** Si la energía no está confirmada no se ofrece ningún abastecimiento: se pide confirmarla. */
const CONFIRM_ENERGY: QuickAction = {
  icon: 'fuel',
  title: 'Carga de combustible o energía',
  description: 'Primero confirma el combustible o la energía de tu carro',
  href: '/mi-carro/editar',
};

const OTHER_ACTIONS: QuickAction[] = [
  {
    icon: 'maintenance',
    title: 'Mantenimiento',
    description: 'Frenos, llantas, revisiones…',
    href: '/registrar/mantenimiento',
  },
  {
    icon: 'expense',
    title: 'Gasto',
    description: 'Lavada, parqueadero, repuestos…',
    href: '/registrar/gasto',
  },
  {
    icon: 'odometer',
    title: 'Kilometraje',
    description: '¿Cuánto marca tu carro hoy?',
    href: '/registrar/kilometraje',
  },
  {
    icon: 'document',
    title: 'Documento',
    description: 'SOAT, tecnomecánica…',
    href: '/registrar/documento',
  },
];

export default function NewEntrySheet() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { profile } = useAppData();
  // Tanqueo / carga de GNC / carga eléctrica según la regla central del vehículo.
  const kinds = energyRecordKinds(profile);
  const energyActions: QuickAction[] =
    kinds.length > 0
      ? kinds.map((kind) => ({
          icon: ENERGY_META[kind].icon,
          title: energyActionTitle(kind, profile.energySource),
          description: ENERGY_ACTION_DESCRIPTIONS[kind],
          href: { pathname: '/registrar/energia', params: { tipo: kind } },
        }))
      : [CONFIRM_ENERGY];
  const actions = [...energyActions, ...OTHER_ACTIONS];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <AppText variant="title">¿Qué quieres registrar?</AppText>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.title}
            accessibilityRole="button"
            accessibilityLabel={`Registrar ${action.title.toLowerCase()}`}
            // replace: la hoja se cierra y en su lugar se abre el formulario.
            onPress={() => router.replace(action.href)}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
            <View style={styles.actionIcon}>
              <Icon name={action.icon} color={colors.brand.accent} />
            </View>
            <View style={styles.actionTexts}>
              <AppText variant="bodyStrong">{action.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {action.description}
              </AppText>
            </View>
            <Icon name="chevronRight" color={colors.text.muted} />
          </Pressable>
        ))}
      </View>

      <Button label="Cancelar" variant="ghost" fullWidth onPress={() => router.back()} />
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionPressed: {
    backgroundColor: colors.brand.soft,
    borderColor: colors.brand.soft,
  },
  actionIcon: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: {
    flex: 1,
  },
}));
