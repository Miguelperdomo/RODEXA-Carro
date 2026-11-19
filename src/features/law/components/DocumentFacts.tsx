import { View } from 'react-native';

import type { DocumentType } from '@/features/cars/types';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';
import { today } from '@/shared/utils/date';

import { FINES, fineCop, FIRST_RTM_YEARS, SIMIT_NOTE, soatFamilyCarPrice, UVB_YEAR } from '../values';

/**
 * SOAT y tecnomecánica: cuánto es la multa si están vencidos (y la inmovilización) y, en el SOAT,
 * cuánto cuesta renovarlo para un automóvil familiar. Todo marcado como APROXIMADO.
 */
export function DocumentFacts({ type }: { type: DocumentType }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { profile } = useAppData();
  if (type !== 'soat' && type !== 'rtm') return null;
  const code = type === 'soat' ? 'D02' : 'C35';
  const fine = FINES[code];
  const price = type === 'soat' ? soatFamilyCarPrice(profile.displacementCc, profile.year, today().getFullYear()) : undefined;
  const publicService = profile.serviceType === 'public';

  return (
    <Card>
      <View style={styles.row}>
        <Icon name="fine" color={colors.status.due.color} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Si está vencido</AppText>
          <AppText tone="secondary">
            {fine.what}: multa de unos {formatCop(fineCop(code))} (código {code.charAt(0)}.{code.slice(1)})
            {fine.immobilization ? ' e inmovilización del carro' : ''}.
          </AppText>
        </View>
      </View>
      {type === 'soat' && !publicService && (
        <View style={[styles.row, styles.gap]}>
          <Icon name="insurance" color={colors.brand.accent} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Cuánto cuesta renovarlo</AppText>
            <AppText tone="secondary">
              {price !== undefined
                ? `Para un automóvil familiar como el tuyo, la tarifa ${UVB_YEAR} es de unos ${formatCop(price)}.`
                : 'Escribe el cilindraje y el año en Mi carro para calcular la tarifa de referencia.'}
            </AppText>
          </View>
        </View>
      )}
      {type === 'rtm' && (
        <AppText variant="caption" tone="secondary" style={styles.gap}>
          Un carro nuevo hace la primera revisión a los {publicService ? FIRST_RTM_YEARS.public : FIRST_RTM_YEARS.private} años de la
          matrícula{publicService ? ' (servicio público)' : ''} y después cada año.
        </AppText>
      )}
      <AppText variant="caption" tone="muted" style={styles.gap}>
        {SIMIT_NOTE}
      </AppText>
    </Card>
  );
}

const useStyles = createStyles(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  gap: {
    marginTop: spacing.md,
  },
}));
