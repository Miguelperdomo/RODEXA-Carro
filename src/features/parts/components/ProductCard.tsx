import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon } from '@/shared/ui';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

import type { CompatibilityStatus, CompatibleProduct } from '../types';

/** Nunca "el mejor": solo qué tan confirmada está la compatibilidad. */
const STATUS_LABEL: Record<Exclude<CompatibilityStatus, 'unknown'>, string> = {
  verified: 'Compatible',
  specification_match: 'Coincide con las especificaciones',
};

/** Tarjeta de un producto compatible con el carro (datos del catálogo, no de la pantalla). */
export function ProductCard({ item }: { item: CompatibleProduct }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { product, compatibility } = item;
  const status = compatibility.status === 'unknown' ? undefined : compatibility.status;
  const statusColor = status === 'verified' ? colors.status.ok : colors.status.soon;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{product.name}</AppText>
          <AppText variant="caption" tone="secondary">
            {[product.brand, product.reference].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        {product.demo && (
          <View style={styles.demo}>
            <AppText variant="captionStrong" tone="brand">
              DEMO
            </AppText>
          </View>
        )}
      </View>

      {status && (
        <View style={[styles.status, { backgroundColor: statusColor.background }]}>
          <Icon name={statusColor.icon} size={16} color={statusColor.color} />
          <AppText variant="captionStrong" color={statusColor.color}>
            {STATUS_LABEL[status]}
          </AppText>
        </View>
      )}

      {(product.presentation || product.specs.length > 0) && (
        <View style={styles.specs}>
          {product.presentation && <Spec label="Presentación" value={product.presentation} />}
          {product.specs.map((spec) => (
            <Spec key={spec.label} label={spec.label} value={spec.value} />
          ))}
        </View>
      )}

      <View style={styles.price}>
        <AppText variant="caption" tone="secondary">
          Precio orientativo
        </AppText>
        {product.price ? (
          <>
            <AppText variant="heading" numeric>
              {formatCop(product.price.min)} – {formatCop(product.price.max)} {product.price.currency}
            </AppText>
            <AppText variant="caption" tone="muted">
              El precio puede variar según establecimiento, ciudad, disponibilidad y promociones.
            </AppText>
            <AppText variant="caption" tone="muted">
              Referencia: {formatDate(parseISODate(product.price.referenceDate))}
              {product.price.source ? ` · ${product.price.source.name}` : ''}
            </AppText>
          </>
        ) : (
          <AppText variant="bodyStrong" tone="muted">
            Información no disponible
          </AppText>
        )}
      </View>
    </Card>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.specRow}>
      <AppText variant="caption" tone="secondary" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="captionStrong" style={styles.specValue}>
        {value}
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  demo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
  },
  status: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  specs: {
    gap: 4,
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  specValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  price: {
    gap: 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
