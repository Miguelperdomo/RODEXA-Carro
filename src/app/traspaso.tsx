import { View } from 'react-native';

import { openOfficialSite } from '@/features/emergency/officialLinks';
import { TRANSFER_STEPS } from '@/features/law/values';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, useToast } from '@/shared/ui';

/**
 * Guía de traspaso: los pasos para vender o comprar un carro usado, con la consulta del RUNT y del
 * SIMIT. Los requisitos pueden cambiar un poco según la ciudad: se dice claramente.
 */
export default function TransferScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { profile } = useAppData();
  const open = async (site: 'runt' | 'simit') =>
    toast.show((await openOfficialSite(site, profile.plate)) ?? 'No se pudo abrir la página. Intenta de nuevo.');

  return (
    <FormScreen title="Guía de traspaso" closeIcon="back">
      <AppText tone="secondary">Para vender o comprar un carro usado. Háganlo juntos, comprador y vendedor.</AppText>
      <Card>
        {TRANSFER_STEPS.map((step, i) => (
          <View key={step.title} style={[styles.step, i > 0 && styles.gap]}>
            <View style={styles.number}>
              <AppText variant="captionStrong" color={colors.brand.onPrimary}>
                {i + 1}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{step.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {step.text}
              </AppText>
            </View>
          </View>
        ))}
      </Card>
      <Button label="Consultar el carro en el RUNT" icon="inspection" variant="secondary" fullWidth onPress={() => void open('runt')} />
      <Button label="Consultar multas en el SIMIT" icon="fine" variant="secondary" fullWidth onPress={() => void open('simit')} />
      <AppText variant="caption" tone="muted">
        Los requisitos y los costos pueden cambiar según la ciudad: confírmalos con el organismo de tránsito donde está
        matriculado el carro.
      </AppText>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  gap: {
    marginTop: spacing.md,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
