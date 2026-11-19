import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';

import { findCity } from '@/features/catalogs/repository';
import { callEmergency, EMERGENCY_NUMBER } from '@/features/emergency/officialLinks';
import { filterProviders, getProviders } from '@/features/providers/providers';
import { ROADSIDE_GUIDES, type RoadsideGuide } from '@/features/roadside/guides';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, useToast } from '@/shared/ui';

/**
 * "Me quedé varado": qué hacer según el problema (consejos de seguridad, no técnicos), llamar
 * al 123 si hay riesgo y los servicios a domicilio de tu ciudad (grúa, mecánico, batería…).
 */
export default function RoadsideScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [open, setOpen] = useState<RoadsideGuide['key'] | null>(null);

  const call123 = async () => {
    if (!(await callEmergency())) toast.show(`No se pudo abrir el marcador. Marca ${EMERGENCY_NUMBER}.`);
  };

  return (
    <FormScreen title="Me quedé varado" closeIcon="back">
      <Card tone="highlight">
        <AppText variant="bodyStrong">Primero, tu seguridad</AppText>
        <AppText tone="secondary">Si hay heridos o estás en riesgo, llama al {EMERGENCY_NUMBER}.</AppText>
        <View style={styles.action}>
          <Button label={`Llamar al ${EMERGENCY_NUMBER}`} icon="phone" onPress={() => void call123()} />
        </View>
      </Card>

      <AppText variant="captionStrong" tone="secondary">
        ¿QUÉ PASÓ?
      </AppText>
      <Card flush>
        {ROADSIDE_GUIDES.map((guide, i) => {
          const isOpen = open === guide.key;
          return (
            <Fragment key={guide.key}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpen(isOpen ? null : guide.key)}
                style={styles.row}>
                <View style={styles.icon}>
                  <Icon name={guide.icon} size={20} color={colors.brand.accent} />
                </View>
                <AppText variant="bodyStrong" style={styles.flex}>
                  {guide.title}
                </AppText>
                <Icon name={isOpen ? 'expandLess' : 'expandMore'} color={colors.text.muted} />
              </Pressable>
              {isOpen && <GuideSteps guide={guide} />}
            </Fragment>
          );
        })}
      </Card>

      <AppText variant="caption" tone="muted">
        Son consejos generales de seguridad. Para revisar o reparar el carro, acude a un mecánico.
      </AppText>
    </FormScreen>
  );
}

function GuideSteps({ guide }: { guide: RoadsideGuide }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAppData();
  const city = findCity(user.cityId);
  // Servicios a domicilio de la ciudad que sirven para este problema (si hay inscritos).
  const services = filterProviders(getProviders(), { kind: 'mobile', cityId: city?.id, query: guide.search }).slice(0, 3);

  return (
    <View style={styles.steps}>
      {guide.steps.map((step, i) => (
        <View key={step} style={styles.step}>
          <AppText variant="captionStrong" color={colors.brand.accent}>
            {i + 1}.
          </AppText>
          <AppText style={styles.flex}>{step}</AppText>
        </View>
      ))}
      {services.length > 0 && (
        <AppText variant="caption" tone="secondary">
          En {city?.name}: {services.map((s) => s.name).join(', ')}.
        </AppText>
      )}
      <Button
        label={city ? `Ver servicios en ${city.name}` : 'Ver servicios a domicilio'}
        icon="workshop"
        variant="secondary"
        onPress={() => router.push({ pathname: '/talleres', params: { tipo: 'mobile' } })}
      />
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  action: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  steps: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
}));
