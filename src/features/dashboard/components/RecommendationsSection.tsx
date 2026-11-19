import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon, SectionHeader } from '@/shared/ui';

import type { Recommendation } from '../types';

type RecommendationsSectionProps = {
  items: Recommendation[];
};

/** Cuántas se ven de entrada; el resto con "Ver N más" (nunca se esconden avisos). */
const PREVIEW = 3;

/**
 * "RODEXA Carro recomienda": lo vencido primero, luego lo próximo y lo importante que
 * falta. "Todo al día" SOLO si no hay nada de eso. Tono prudente (regla §8.6).
 */
export function RecommendationsSection({ items }: RecommendationsSectionProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PREVIEW);
  const hidden = items.length - visible.length;
  return (
    <View>
      <SectionHeader title="RODEXA Carro recomienda" icon="recommendation" />
      <Card flush>
        {items.length === 0 ? (
          <View style={styles.item}>
            <AppText>Todo al día según tus registros.</AppText>
          </View>
        ) : (
          visible.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.item}>
                <View style={[styles.bullet, { backgroundColor: colors.status[item.level].background }]}>
                  <Icon name={colors.status[item.level].icon} size={16} color={colors.status[item.level].color} />
                </View>
                <View style={styles.content}>
                  <AppText>{item.text}</AppText>
                  {item.action && (
                    <Button
                      label={item.action.label}
                      variant="secondary"
                      onPress={() => item.action && router.push(item.action.href)}
                    />
                  )}
                </View>
              </View>
            </Fragment>
          ))
        )}
        {hidden > 0 && (
          <View style={styles.more}>
            <Button label={`Ver ${hidden} más`} variant="ghost" fullWidth onPress={() => setExpanded(true)} />
          </View>
        )}
      </Card>
      <AppText variant="caption" tone="muted" style={styles.disclaimer}>
        Basado en lo que registraste. Verifica siempre el manual de tu carro o consulta a tu
        mecánico.
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  bullet: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  more: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm,
  },
  disclaimer: {
    marginTop: spacing.sm,
  },
}));
