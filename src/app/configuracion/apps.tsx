import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { FAMILY_APPS, notifiedApps, type FamilyApp } from '@/features/about/familyApps';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, BrandFooter, FormScreen, Icon } from '@/shared/ui';

/**
 * Más apps de RODEXA: las otras apps de la familia (moto, negocio, hogar…). Al tocar una se
 * abre su detalle; las que aún no están publicadas dicen "Próximamente".
 */
export default function FamilyAppsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <FormScreen title="Más apps de RODEXA" closeIcon="back">
      <View style={styles.hero}>
        <AppText variant="title" color={colors.brand.onPrimary}>
          La familia RODEXA
        </AppText>
        <AppText color={colors.brand.onPrimary}>
          Apps sencillas para tener tus cosas bajo control, hechas en Colombia por Providentia Tech. Si alguna te sirve,
          descárgala.
        </AppText>
      </View>

      <View style={styles.list}>
        {FAMILY_APPS.map((app) => (
          <AppCard key={app.key} app={app} />
        ))}
      </View>

      <AppText variant="caption" tone="muted" align="center">
        Cada app es independiente: tus datos de RODEXA Carro no se comparten con las otras.
      </AppText>
      <BrandFooter />
    </FormScreen>
  );
}

function AppCard({ app }: { app: FamilyApp }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { settings } = useSettings();
  const available = app.status === 'available' && !!app.url;
  const notified = notifiedApps(settings.familyAppsNotify).includes(app.key);
  return (
    // Al tocarla: el detalle (qué hace, para quién es, Descargar o Avísame).
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${app.name}. ${app.description}${available ? '' : ' Próximamente.'} Ver más.`}
      onPress={() => router.push({ pathname: '/configuracion/apps/[key]', params: { key: app.key } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.icon, app.logo ? styles.logoBox : undefined]}>
        {app.logo ? (
          <Image
            source={app.logo}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel={`Logo de ${app.name}`}
          />
        ) : (
          <AppText style={styles.emoji}>{app.emoji}</AppText>
        )}
      </View>
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <AppText variant="bodyStrong" style={styles.flex}>
            {app.name}
          </AppText>
          <View style={[styles.badge, available ? styles.badgeOn : styles.badgeSoon]}>
            <AppText variant="tabLabel" tone={available ? 'inverse' : 'brand'}>
              {available ? 'Descargar' : 'Próximamente'}
            </AppText>
          </View>
        </View>
        <AppText variant="captionStrong" tone="brand">
          {app.tagline}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {app.description}
        </AppText>
        {notified && !available && (
          <AppText variant="captionStrong" tone="brand">
            Te avisaremos cuando salga
          </AppText>
        )}
      </View>
      <Icon name="chevronRight" color={colors.text.muted} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  hero: {
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  // El logo va sobre blanco: se ve igual en tema claro y oscuro.
  logoBox: {
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 44,
    height: 44,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeOn: {
    backgroundColor: colors.brand.primary,
  },
  badgeSoon: {
    backgroundColor: colors.brand.soft,
  },
}));
