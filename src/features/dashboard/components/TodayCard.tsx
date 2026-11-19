import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { budgetStatus } from '@/features/budget/rules';
import { recurringDue } from '@/features/recurring/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { effectiveSettings, isTranqui } from '@/features/settings/usageStyle';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon, SectionHeader } from '@/shared/ui';
import { formatWeekdayDate, today } from '@/shared/utils/date';

import { readinessOf } from '../readiness';
import { buildToday, type TodayItem } from '../today';

export type TodayData = ReturnType<typeof buildToday>;

/**
 * Inicio · "Hoy": lo más importante del día en un solo bloque (pico y placa, lo vencido o
 * próximo, la revisión semanal y el km), según lo que el usuario registró y configuró.
 */
export function useToday(): TodayData {
  const { picoYPlaca, budget, recurringExpenses, customReminders } = useSession();
  const data = useAppData();
  const { dashboard, history, odometer } = data;
  const { settings: saved } = useSettings();
  // Tranqui: sin revisión semanal ni "actualiza tu km" (el km lo pide su propia tarjeta, una vez al mes).
  const settings = effectiveSettings(saved);
  return buildToday({
    picoYPlaca,
    statusItems: dashboard.statusItems,
    kmCheckDue: !isTranqui(saved) && dashboard.weeklyCheckDue && settings.odometerReminders,
    daysSinceReading: dashboard.odometer.daysSinceReading,
    weeklySettings: settings,
    budget: budgetStatus(budget, dashboard.month.totalCop),
    recurring: recurringDue(recurringExpenses, history, today()),
    customReminders,
    currentKm: odometer.registeredKm,
    readiness: readinessOf(data, today(), customReminders),
    today: today(),
  });
}

export function TodayCard({ data: { items, more } }: { data: TodayData }) {
  const styles = useStyles();
  const dateLabel = formatWeekdayDate(today());

  return (
    <View>
      <SectionHeader title="Hoy" caption={dateLabel} />
      <Card flush>
        {items.map((item, i) => (
          <Fragment key={item.key}>
            {i > 0 && <View style={styles.divider} />}
            <TodayRow item={item} />
          </Fragment>
        ))}
        {more > 0 && (
          <>
            <View style={styles.divider} />
            <AppText variant="caption" tone="secondary" style={styles.more}>
              {more === 1 ? '1 cosa más' : `${more} cosas más`} en “Estado de mi carro”
            </AppText>
          </>
        )}
      </Card>
    </View>
  );
}

function TodayRow({ item }: { item: TodayItem }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone =
    item.tone === 'due' || item.tone === 'soon' || item.tone === 'ok'
      ? colors.status[item.tone]
      : { color: colors.brand.accent, background: colors.brand.soft };
  const { href } = item;

  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: tone.background }]}>
        <Icon name={item.icon} size={20} color={tone.color} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" color={item.tone === 'due' ? tone.color : undefined}>
          {item.title}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {item.detail}
        </AppText>
      </View>
      {href && <Icon name="chevronRight" color={colors.text.muted} />}
    </>
  );

  if (!href) {
    return (
      <View style={styles.row} accessible>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  more: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
}));
