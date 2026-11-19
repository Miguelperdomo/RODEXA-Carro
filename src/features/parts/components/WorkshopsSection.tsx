import { router } from 'expo-router';
import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon, SectionHeader, SettingsRow } from '@/shared/ui';

import { Placeholder } from './Placeholder';

/**
 * "¿Quién lo instala?": búsqueda de talleres y espacio para talleres aliados.
 * Lo patrocinado siempre va marcado y separado (docs/modulo-repuestos.md §3).
 */
export function WorkshopsSection() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title="¿Quién lo instala?" icon="workshop" />
      <Card flush>
        <SettingsRow
          icon="location"
          label="Buscar un taller"
          description="Talleres y servicios a domicilio de tu ciudad"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push({ pathname: '/talleres', params: { tipo: 'workshop' } })}
        />
      </Card>

      <View style={styles.partnersHeader}>
        <AppText variant="bodyStrong">Talleres aliados</AppText>
        <View style={styles.sponsoredPill}>
          <AppText variant="captionStrong" tone="secondary">
            Patrocinado
          </AppText>
        </View>
      </View>

      <Card>
        <View style={styles.workshopRow}>
          <View style={styles.workshopIcon}>
            <Icon name="workshop" color={colors.text.muted} />
          </View>
          <View style={styles.workshopTexts}>
            <Placeholder width="65%" height={14} />
            <Placeholder width="45%" />
            <Placeholder width="30%" />
          </View>
        </View>
        <AppText variant="caption" tone="muted" style={styles.note}>
          Aquí aparecerán talleres aliados de RODEXA Carro. Siempre irán marcados como patrocinados y
          no cambian el orden de las opciones de repuestos.
        </AppText>
      </Card>

      <Card flush style={styles.ownerCard}>
        <SettingsRow
          icon="partner"
          label="¿Ofreces un servicio para carros?"
          description="Taller físico o servicio a domicilio: inscríbelo en RODEXA"
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/inscribir')}
        />
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  partnersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sponsoredPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  workshopRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  workshopIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workshopTexts: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  note: {
    marginTop: spacing.md,
  },
  ownerCard: {
    marginTop: spacing.md,
  },
}));
