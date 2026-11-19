import { View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, DateField, Icon } from '@/shared/ui';

import type { StepProps } from './types';

type DocKey = 'soatExpiresAt' | 'rtmExpiresAt';

const DOCS: { key: DocKey; title: string }[] = [
  { key: 'soatExpiresAt', title: 'SOAT' },
  { key: 'rtmExpiresAt', title: 'Tecnomecánica' },
];

/** Paso 5 — Documentos. Ambos se pueden omitir. */
export function DocumentsStep({ form, update }: StepProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <>
      {DOCS.map((doc) => {
        const value = form[doc.key];
        return (
          <Card key={doc.key}>
            <View style={styles.header}>
              <View style={styles.icon}>
                <Icon name="document" size={sizes.iconMd} color={colors.brand.accent} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{doc.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  Fecha de vencimiento
                </AppText>
              </View>
            </View>
            <View style={styles.field}>
              <DateField
                value={value}
                onChange={(date) => update({ [doc.key]: date })}
                maxDate={null}
                quickOptions={false}
              />
            </View>
            {value && (
              <Button
                label="Quitar fecha"
                variant="ghost"
                onPress={() => update({ [doc.key]: null })}
              />
            )}
          </Card>
        );
      })}
      <AppText variant="caption" tone="muted">
        Si no los tienes a mano, sigue y agrégalos después desde Mi carro. RODEXA Carro no verifica la
        vigencia ante entidades oficiales.
      </AppText>
    </>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    marginTop: spacing.md,
  },
}));
