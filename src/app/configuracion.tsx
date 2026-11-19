import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { budgetStatus, budgetSummary } from '@/features/budget/rules';
import { CarAvatar } from '@/features/cars/components/CarAvatar';
import { useCarPhoto } from '@/features/cars/useCarPhoto';
import { useNotifications } from '@/features/notifications/useNotifications';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { CURRENT_REGION } from '@/features/settings/defaults';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { FuelTracking, UsageStyle } from '@/features/settings/types';
import { USAGE_STYLES, usageStyleInfo, usageStyleLabel } from '@/features/settings/usageStyle';
import { FUEL_TRACKING_OPTIONS, fuelWords } from '@/features/tranqui/style';
import { useApplyStyle } from '@/features/tranqui/useApplyStyle';
import { LANGUAGE_NAMES, useT } from '@/i18n';
import { createStyles, radius, spacing, useTheme, type ThemePreference } from '@/shared/theme';
import {
  AppText,
  BrandFooter,
  Card,
  FormScreen,
  Icon,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
  SettingsSelectRow,
  useToast,
} from '@/shared/ui';
import { AppSearch } from '@/features/search/components/AppSearch';

/**
 * Configuración: arriba quién eres y tu carro, luego el atajo de Tema y las secciones
 * Mi carro · La app · Tus datos · Ayuda · RODEXA. "Restablecer preferencias" está al final de
 * Preferencias generales; el centro de notificaciones, dentro de Notificaciones; Providentia,
 * dentro de "Acerca de".
 */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = useT();
  const toast = useToast();
  const { settings, update } = useSettings();
  const { user, profile, dashboard } = useAppData();
  const { budget } = useSession();
  const { unreadCount } = useNotifications();
  const version = Constants.expoConfig?.version;
  const name = user.name?.trim() || t('common.notRegistered');
  const car = profile.nickname?.trim() || `${profile.brandName} ${profile.model}`.trim();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('settings.theme.light') },
    { value: 'dark', label: t('settings.theme.dark') },
    { value: 'system', label: t('settings.theme.system') },
  ];

  const changeTheme = (theme: ThemePreference) => {
    if (theme === settings.theme) return;
    update({ theme });
    toast.show(t('toast.themeChanged'));
  };

  // Mi estilo: Tranqui o Al detalle. "¿Qué hace?" despliega la explicación completa.
  const applyStyle = useApplyStyle();
  const carPhoto = useCarPhoto();
  const [explainOpen, setExplainOpen] = useState(false);
  const styleOptions = USAGE_STYLES.map((s) => ({ value: s.value, label: usageStyleLabel(s.value) }));
  const currentStyle = usageStyleInfo(settings.usageStyle);
  const fuel = fuelWords(profile);
  const changeStyle = (usageStyle: UsageStyle) => {
    if (usageStyle === settings.usageStyle) return;
    applyStyle({ usageStyle });
    // Al elegir, se explica qué cambia.
    setExplainOpen(true);
    toast.show(`Estilo cambiado a ${usageStyleLabel(usageStyle)}`);
  };

  return (
    <FormScreen title={t('settings.title')} closeIcon="back">
      <AppSearch />
      {/* Cabecera: quién eres y tu carro. */}
      <Card>
        <View style={styles.header}>
          {/* La foto del carro si la pusieron; si no, la inicial de siempre. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={carPhoto.photo ? 'Ver la foto de tu carro' : 'Ponerle foto a tu carro (opcional)'}
            onPress={carPhoto.onPhotoPress}>
            <CarAvatar
              photo={carPhoto.photo}
              size={48}
              radius={radius.pill}
              fallback={
                <View style={styles.avatar}>
                  <AppText variant="heading" tone="brand">
                    {name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
              }
            />
          </Pressable>
          <View style={styles.flex}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.profile')}: ${name}`}
              onPress={() => router.push('/configuracion/perfil')}>
              <AppText variant="bodyStrong">{name}</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.car')}: ${car}`}
              onPress={() => router.navigate('/(tabs)/carro')}
              style={styles.carLink}>
              <Icon name="car" size={18} color={colors.text.secondary} />
              <AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.shrink}>
                {car}
              </AppText>
              <Icon name="chevronRight" size={18} color={colors.text.muted} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/configuracion/perfil')} hitSlop={8}>
            <AppText variant="captionStrong" tone="brand">
              Editar
            </AppText>
          </Pressable>
        </View>
      </Card>

      {/* Atajo: el tema cambia al instante. */}
      <Card>
        <View style={styles.quick}>
          <AppText variant="captionStrong" tone="secondary">
            {t('settings.theme').toUpperCase()}
          </AppText>
          <SegmentedControl options={themeOptions} value={settings.theme} onChange={changeTheme} />
        </View>
        <View style={[styles.quick, styles.quickGap]}>
          <AppText variant="captionStrong" tone="secondary">
            MI ESTILO
          </AppText>
          <SegmentedControl options={styleOptions} value={settings.usageStyle} onChange={changeStyle} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: explainOpen }}
            accessibilityLabel={`${currentStyle.title}. ¿Qué hace?`}
            onPress={() => setExplainOpen((v) => !v)}
            style={styles.explainToggle}>
            <AppText variant="bodyStrong" style={styles.flex}>
              {currentStyle.promise}
            </AppText>
            <AppText variant="captionStrong" tone="brand">
              {explainOpen ? 'Ocultar' : '¿Qué hace?'}
            </AppText>
            <Icon name={explainOpen ? 'expandLess' : 'expandMore'} size={20} color={colors.brand.accent} />
          </Pressable>
          {explainOpen && (
            <View style={styles.explain}>
              {currentStyle.details.map((d) => (
                <View key={d.title} style={styles.explainItem}>
                  <Icon name="check" size={16} color={colors.brand.accent} />
                  <View style={styles.flex}>
                    <AppText variant="captionStrong">{d.title}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {d.text}
                    </AppText>
                  </View>
                </View>
              ))}
              <AppText variant="caption" tone="muted">
                Puedes cambiar de estilo cuando quieras: tus datos no se pierden.
              </AppText>
            </View>
          )}
        </View>
      </Card>

      <SettingsSection title="Mi carro">
        <SettingsRow
          icon="camera"
          label="Foto de mi carro"
          accessory={{ type: 'value', value: carPhoto.photo ? 'Puesta' : 'Opcional', navigate: true }}
          onPress={carPhoto.openMenu}
        />
        <SettingsRow
          icon="maintenance"
          label={t('settings.maintenance')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/mantenimiento')}
        />
        <SettingsRow
          icon="document"
          label={t('settings.documents')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/documentos')}
        />
        <SettingsRow
          icon="expense"
          label="Presupuesto mensual"
          description={budgetSummary(budgetStatus(budget, dashboard.month.totalCop))}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/mi-carro/presupuesto')}
        />
        {settings.usageStyle === 'tranqui' && (
          <SettingsSelectRow<FuelTracking>
            icon="fuel"
            label={fuel.noun.charAt(0).toUpperCase() + fuel.noun.slice(1)}
            options={FUEL_TRACKING_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description }))}
            value={settings.fuelTracking}
            cancelLabel={t('common.cancel')}
            onChange={(fuelTracking) => applyStyle({ fuelTracking })}
          />
        )}
      </SettingsSection>

      <SettingsSection title="La app">
        <SettingsRow
          icon="notifications"
          label={t('settings.section.notifications')}
          description={unreadCount > 0 ? t('settings.unread', { count: unreadCount }) : 'Avisos y centro de notificaciones'}
          accessory={unreadCount > 0 ? { type: 'badge', count: unreadCount } : { type: 'chevron' }}
          onPress={() => router.push('/configuracion/notificaciones')}
        />
        <SettingsRow
          icon="language"
          label={t('settings.languageRegion')}
          accessory={{
            type: 'value',
            value: `${LANGUAGE_NAMES[settings.language]} · ${CURRENT_REGION.country}`,
            navigate: true,
          }}
          onPress={() => router.push('/configuracion/idioma')}
        />
        <SettingsRow
          icon="settings"
          label={t('settings.general')}
          description={t('settings.general.description')}
          accessory={{ type: 'value', value: `km · ${settings.dateFormat}`, navigate: true }}
          onPress={() => router.push('/configuracion/preferencias')}
        />
        <SettingsRow
          icon="textSize"
          label="Letra grande"
          description="Agranda el texto de toda la app"
          accessory={{ type: 'switch', value: settings.largeText, onChange: (largeText) => update({ largeText }) }}
        />
        <SettingsRow
          icon="theme"
          label="Modo sol"
          description="Más contraste para leer bajo el sol"
          accessory={{ type: 'switch', value: settings.sunMode, onChange: (sunMode) => update({ sunMode }) }}
        />
      </SettingsSection>

      <SettingsSection title="Tus datos">
        <SettingsRow
          icon="storage"
          label={t('settings.data')}
          description={t('settings.data.description')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/datos')}
        />
        <SettingsRow
          icon="insurance"
          label={t('settings.privacy')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/privacidad')}
        />
      </SettingsSection>

      <SettingsSection title="Ayuda">
        <SettingsRow
          icon="bug"
          label={t('help.report')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/reportar')}
        />
        <SettingsRow
          icon="faq"
          label="Ayuda y contacto"
          description="Preguntas frecuentes, sugerencias y correo"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/ayuda')}
        />
      </SettingsSection>

      <SettingsSection title="RODEXA">
        <SettingsRow
          icon="premium"
          label={t('premium.title')}
          description={t('premium.subtitle')}
          accessory={{ type: 'value', value: t('common.comingSoon'), navigate: true }}
          onPress={() => router.push('/pro')}
        />
        <SettingsRow
          icon="usageApps"
          label="Más apps de RODEXA"
          description="Moto, Negocio, Hogar, Seguridad"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/apps')}
        />
        <SettingsRow
          icon="car"
          label={t('settings.about')}
          description="Versión, legales y Providentia Tech"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/acerca')}
        />
      </SettingsSection>

      {carPhoto.sheet}
      <BrandFooter />
      {version && (
        <AppText variant="caption" tone="muted" align="center">
          {t('settings.version')} {version}
        </AppText>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  quick: {
    gap: spacing.sm,
  },
  quickGap: {
    marginTop: spacing.lg,
  },
  explainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  explain: {
    gap: spacing.sm,
  },
  explainItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
}));
