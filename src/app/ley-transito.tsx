import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import { FINES, fineCodeLabel, fineCop, SIMIT_NOTE, type FineCode } from '@/features/law/values';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';

const ORDER: FineCode[] = ['D02', 'C35', 'D01', 'C29'];

/**
 * Ley de tránsito para carro: solo situaciones bien soportadas, con su multa aproximada y si
 * implican inmovilización (cuando está confirmado). Solo lo que aplica a un carro.
 */
export default function TrafficLawScreen() {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <FormScreen title="Ley de tránsito" closeIcon="back">
      <AppText tone="secondary">
        Lo más común para un carro particular, según el artículo 131 del Código Nacional de Tránsito (Ley 769 de 2002). Valores
        2026.
      </AppText>
      <Card flush>
        {ORDER.map((code, i) => {
          const f = FINES[code];
          return (
            <Fragment key={code}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Icon name="fine" color={f.immobilization ? colors.status.due.color : colors.status.soon.color} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{f.what}</AppText>
                  <AppText variant="caption" tone="secondary">
                    Código {fineCodeLabel(code)} · multa de unos {formatCop(fineCop(code))}
                    {f.immobilization ? ' · inmovilización del carro' : ''}
                  </AppText>
                </View>
              </View>
            </Fragment>
          );
        })}
      </Card>
      <AppText variant="caption" tone="muted">
        {SIMIT_NOTE} Si pagas pronto y haces el curso de normas de tránsito, puedes tener descuento (no aplica a las multas
        por alcohol).
      </AppText>
      <Button label="¿Me multaron? Cuenta tu descuento" icon="receipt" variant="secondary" fullWidth onPress={() => router.push('/multas')} />
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
}));
