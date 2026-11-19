import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { FAMILY_APPS, FAMILY_PROMISES, notifiedApps, toggleNotify } from '@/features/about/familyApps';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon, useToast } from '@/shared/ui';

/** Dorado de "Próximamente" (el mismo de la placa y de Pro). */
const GOLD = '#F5C400';
const ON_GOLD = '#111111';

/**
 * Detalle de una app de la familia RODEXA: qué es, qué vas a poder hacer, para quién es
 * y sus promesas. Publicada → "Descargar en Google Play"; si no → "Avísame cuando salga"
 * (se guarda solo en el celular).
 */
export default function FamilyAppScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { settings, update } = useSettings();
  const { key } = useLocalSearchParams<{ key: string }>();
  const app = FAMILY_APPS.find((a) => a.key === key);

  if (!app) {
    return (
      <FormScreen title="Más apps de RODEXA" closeIcon="back">
        <EmptyState icon="info" title="No encontramos esa app" />
      </FormScreen>
    );
  }

  const available = app.status === 'available' && !!app.url;
  const notified = notifiedApps(settings.familyAppsNotify).includes(app.key);

  const footer = available ? (
    <Button label="Descargar en Google Play" icon="exportData" fullWidth onPress={() => app.url && void Linking.openURL(app.url).catch(() => undefined)} />
  ) : notified ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Te avisaremos cuando salga ${app.name}. Toca para dejar de avisarte.`}
      onPress={() => update({ familyAppsNotify: toggleNotify(settings.familyAppsNotify, app.key) })}
      style={styles.notified}>
      <Icon name="checked" size={20} color={colors.brand.accent} />
      <AppText variant="bodyStrong" tone="brand">
        Te avisaremos cuando salga
      </AppText>
    </Pressable>
  ) : (
    <Button
      label="Avísame cuando salga"
      icon="notifications"
      fullWidth
      onPress={() => {
        update({ familyAppsNotify: toggleNotify(settings.familyAppsNotify, app.key) });
        toast.show(`Te avisaremos aquí cuando salga ${app.name}`);
      }}
    />
  );

  return (
    <FormScreen title={app.name} closeIcon="back" onClose={() => router.back()} footer={footer}>
      {/* Encabezado */}
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          {app.logo ? (
            <Image source={app.logo} style={styles.logo} contentFit="contain" accessibilityLabel={`Logo de ${app.name}`} />
          ) : (
            <AppText style={styles.bigEmoji}>{app.emoji}</AppText>
          )}
        </View>
        <AppText variant="title" align="center">
          {app.name}
        </AppText>
        <AppText variant="bodyStrong" tone="brand" align="center">
          {app.tagline}
        </AppText>
        <View style={[styles.status, available ? styles.statusOn : styles.statusSoon]}>
          <AppText variant="captionStrong" color={available ? colors.brand.onPrimary : ON_GOLD}>
            {available ? '✓ Disponible en Google Play' : '✦ PRÓXIMAMENTE'}
          </AppText>
        </View>
      </View>

      {/* ¿Qué es? */}
      <Card>
        <AppText variant="captionStrong" tone="secondary">
          ¿QUÉ ES?
        </AppText>
        <AppText style={styles.top}>{app.about ?? app.description}</AppText>
        {!app.features && (
          <AppText variant="caption" tone="muted" style={styles.top}>
            Pronto compartiremos todo lo que vas a poder hacer.
          </AppText>
        )}
      </Card>

      {/* Lo que vas a poder hacer */}
      {app.features && (
        <View style={styles.group}>
          <AppText variant="heading">{available ? 'Lo que puedes hacer' : 'Lo que vas a poder hacer'}</AppText>
          <Card flush>
            {app.features.map((f, i) => (
              <View key={f.title} style={[styles.feature, i > 0 && styles.divider]}>
                <View style={styles.featureIcon}>
                  <AppText style={styles.emoji}>{f.emoji}</AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{f.title}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {f.text}
                  </AppText>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Para quién es */}
      {app.forWho && (
        <Card tone="highlight">
          <AppText variant="captionStrong" tone="brand">
            ¿PARA QUIÉN ES?
          </AppText>
          <AppText style={styles.top}>{app.forWho}</AppText>
        </Card>
      )}

      {/* Lo que tienen todas las apps RODEXA */}
      <View style={styles.group}>
        <AppText variant="heading">Como todas las apps RODEXA</AppText>
        <Card flush>
          {FAMILY_PROMISES.map((f, i) => (
            <View key={f.title} style={[styles.feature, i > 0 && styles.divider]}>
              <AppText style={styles.emoji}>{f.emoji}</AppText>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{f.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {f.text}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {app.motto && (
        <AppText variant="heading" tone="brand" align="center" style={styles.motto}>
          “{app.motto}”
        </AppText>
      )}

      {!available && (
        <AppText variant="caption" tone="muted" align="center">
          Cuando {app.name} esté en Google Play, aquí aparecerá el botón para descargarla.
        </AppText>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  top: {
    marginTop: spacing.xs,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  // El logo va sobre blanco: se ve igual en tema claro y oscuro.
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
  bigEmoji: {
    fontSize: 56,
    lineHeight: 68,
  },
  status: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  statusOn: {
    backgroundColor: colors.brand.primary,
  },
  statusSoon: {
    backgroundColor: GOLD,
  },
  group: {
    gap: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emoji: {
    fontSize: 22,
  },
  motto: {
    paddingHorizontal: spacing.lg,
  },
  notified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
}));
