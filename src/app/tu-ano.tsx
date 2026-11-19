import { useState } from 'react';
import { ScrollView, Share, useWindowDimensions, View } from 'react-native';

import { ENERGY_META } from '@/features/energy/meta';
import { useAppData } from '@/features/session/SessionProvider';
import { buildYearWrapped, energyCountText, wrappedShareText } from '@/features/stats/yearWrapped';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, EmptyState, FormScreen, Icon, type IconName } from '@/shared/ui';
import { today } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

type Slide = { key: string; icon: IconName; kicker: string; big: string; text: string };

/** "Tu año en carro": el año con lo que registraste, en tarjetas para deslizar. */
export default function YearWrappedScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { history, profile } = useAppData();
  const ref = today();
  const w = buildYearWrapped(history, profile, ref.getFullYear(), ref);
  const [page, setPage] = useState(0);
  const cardWidth = width - sizes.screenPadding * 2;

  if (!w.hasData) {
    return (
      <FormScreen title={`Tu ${w.year} en carro`} closeIcon="back">
        <EmptyState icon="stats" title="Aún no hay datos de este año" message="Registra tus cargas de combustible o energía, gastos y mantenimientos: aquí verás tu año." />
      </FormScreen>
    );
  }

  const slides: Slide[] = [
    {
      key: 'intro',
      icon: 'car',
      kicker: w.partial ? `Tu ${w.year} hasta hoy` : `Tu ${w.year}`,
      big: w.carName,
      text: 'Así fue tu año en carro, con lo que registraste en RODEXA.',
    },
    ...(w.km !== undefined
      ? [{ key: 'km', icon: 'odometer' as IconName, kicker: 'Recorriste', big: formatKm(w.km), text: 'Medidos con tus registros de kilometraje.' }]
      : []),
    ...(w.totalCop > 0
      ? [
          {
            key: 'spent',
            icon: 'expense' as IconName,
            kicker: 'Tu carro te costó',
            big: formatCop(w.totalCop),
            text:
              w.monthlyAverageCop !== undefined
                ? `En promedio ${formatCop(w.monthlyAverageCop)} por cada mes con gastos (${w.monthsWithExpenses}).`
                : 'Con lo que registraste.',
          },
        ]
      : []),
    ...w.energy.map((e) => ({
      key: `energy-${e.kind}`,
      icon: ENERGY_META[e.kind].icon,
      kicker: 'Hiciste',
      big: energyCountText(e.kind, e.records),
      text: `${e.quantity}${e.spentCop > 0 ? ` · ${formatCop(e.spentCop)}` : ''}`,
    })),
    ...(w.maintenanceCount > 0
      ? [
          {
            key: 'maintenance',
            icon: 'maintenance' as IconName,
            kicker: 'Cuidaste tu carro',
            big: `${w.maintenanceCount} ${w.maintenanceCount === 1 ? 'mantenimiento' : 'mantenimientos'}`,
            text: w.topMaintenance ? `Lo que más hiciste: ${w.topMaintenance.label} (${w.topMaintenance.times} ${w.topMaintenance.times === 1 ? 'vez' : 'veces'}).` : '',
          },
        ]
      : []),
    ...(w.topCategory
      ? [
          {
            key: 'category',
            icon: 'stats' as IconName,
            kicker: 'Categoría con más gastos',
            big: w.topCategory.label,
            text: `${formatCop(w.topCategory.amountCop)} · ${Math.round(w.topCategory.share * 100)} % de tus gastos`,
          },
        ]
      : []),
    ...w.records.slice(0, 2).map((r) => ({ key: `record-${r.key}`, icon: r.icon, kicker: `Récord · ${r.title}`, big: r.value, text: r.detail })),
    { key: 'end', icon: 'checked', kicker: 'Gracias', big: 'Sigue así', text: 'Cuidar tu carro también es llevar sus cuentas claras.' },
  ];

  const share = () => Share.share({ message: wrappedShareText(w, formatCop, formatKm) }).catch(() => {});

  return (
    <FormScreen
      title={`Tu ${w.year} en carro`}
      closeIcon="back"
      footer={<Button label="Compartir mi año" icon="share" fullWidth onPress={share} />}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + spacing.md}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + spacing.md)))}
        contentContainerStyle={styles.slides}>
        {slides.map((s) => (
          <View key={s.key} style={[styles.slide, { width: cardWidth }]}>
            <View style={styles.slideIcon}>
              <Icon name={s.icon} size={36} color={colors.brand.onPrimary} />
            </View>
            <AppText variant="captionStrong" color={colors.brand.onPrimaryMuted}>
              {s.kicker.toUpperCase()}
            </AppText>
            <AppText variant="display" color={colors.brand.onPrimary} align="center" numeric>
              {s.big}
            </AppText>
            {s.text !== '' && (
              <AppText color={colors.brand.onPrimaryMuted} align="center">
                {s.text}
              </AppText>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      <AppText variant="caption" tone="muted" align="center">
        Desliza para ver más. Todo sale de tus registros.
      </AppText>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  slides: {
    gap: spacing.md,
  },
  slide: {
    minHeight: 380,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  slideIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.onPrimarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.brand.primary,
  },
}));
