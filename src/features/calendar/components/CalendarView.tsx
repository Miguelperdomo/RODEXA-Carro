import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { departmentOfCity } from '@/features/colombia/rainSeasons';
import { describeEntry } from '@/features/history/presentation';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon } from '@/shared/ui';
import { formatMonthYear, today, toISODate } from '@/shared/utils/date';

import { EVENT_LABEL, monthEvents, monthGrid, monthRainNote, type CalendarEventKind } from '../calendar';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const KINDS: CalendarEventKind[] = ['done', 'due', 'payment', 'holiday'];

/** Calendario del mes: lo que hiciste, lo que vence, lo que pagas y los festivos. */
export function CalendarView() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { history, documents, profile, user } = useAppData();
  const { recurringExpenses } = useSession();
  const now = today();
  const todayIso = toISODate(now);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(todayIso);
  const year = month.getFullYear();
  const month0 = month.getMonth();

  // Se recalcula solo al cambiar de mes o de datos (no en cada toque de un día).
  const grid = useMemo(
    () =>
      monthGrid(
        year,
        month0,
        monthEvents(year, month0, {
          history,
          documents,
          recurring: recurringExpenses,
          describe: (e) => describeEntry(e, profile.energySource).title,
        }),
      ),
    [year, month0, history, documents, recurringExpenses, profile.energySource],
  );
  const rainNote = monthRainNote(year, month0, departmentOfCity(user.cityId));
  const dot: Record<CalendarEventKind, string> = {
    done: colors.brand.accent,
    due: colors.status.soon.color,
    payment: colors.status.ok.color,
    holiday: colors.status.due.color,
  };
  const selectedDay = grid.find((d) => d.date === selected);
  const title = formatMonthYear(month);

  const move = (delta: number) => setMonth(new Date(year, month0 + delta, 1));
  const backToToday = () => {
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(todayIso);
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" hitSlop={10} onPress={() => move(-1)}>
            <Icon name="back" color={colors.brand.accent} />
          </Pressable>
          <AppText variant="heading" align="center" style={styles.flex}>
            {title.charAt(0).toUpperCase() + title.slice(1)}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" hitSlop={10} onPress={() => move(1)}>
            <Icon name="chevronRight" color={colors.brand.accent} />
          </Pressable>
        </View>

        <View style={styles.week}>
          {WEEKDAYS.map((d, i) => (
            <AppText key={`${d}-${i}`} variant="captionStrong" tone="muted" align="center" style={styles.cell}>
              {d}
            </AppText>
          ))}
        </View>
        <View style={styles.grid}>
          {grid.map((d) => {
            const isToday = d.date === todayIso;
            const isSelected = d.date === selected;
            const kinds = KINDS.filter((k) => d.events.some((e) => e.kind === k));
            return (
              <Pressable
                key={d.date}
                accessibilityRole="button"
                accessibilityLabel={`${d.day}${d.events.length ? `, ${d.events.length} eventos` : ''}`}
                onPress={() => setSelected(d.date)}
                style={[styles.cell, styles.day, isSelected && styles.selected, isToday && !isSelected && styles.today]}>
                <AppText variant="caption" tone={d.inMonth ? 'primary' : 'muted'} numeric>
                  {d.day}
                </AppText>
                <View style={styles.dots}>
                  {kinds.map((k) => (
                    <View key={k} style={[styles.dot, { backgroundColor: dot[k] }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legend}>
          {KINDS.map((k) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: dot[k] }]} />
              <AppText variant="caption" tone="secondary">
                {EVENT_LABEL[k]}
              </AppText>
            </View>
          ))}
        </View>
        {rainNote && (
          <AppText variant="caption" tone="secondary" style={styles.note}>
            {rainNote}
          </AppText>
        )}
        {(year !== now.getFullYear() || month0 !== now.getMonth() || selected !== todayIso) && (
          <AppText variant="captionStrong" tone="brand" accessibilityRole="button" onPress={backToToday} style={styles.note}>
            Volver a hoy
          </AppText>
        )}
      </Card>

      <Card>
        {selectedDay && selectedDay.events.length > 0 ? (
          selectedDay.events.map((e, i) => (
            <View key={`${e.kind}-${i}`} style={styles.eventRow}>
              <View style={[styles.dot, { backgroundColor: dot[e.kind] }]} />
              <AppText style={styles.flex}>{e.title}</AppText>
            </View>
          ))
        ) : (
          <AppText tone="secondary">Nada registrado ni programado este día.</AppText>
        )}
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  wrap: {
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  week: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
  },
  day: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    minHeight: 44,
    borderRadius: radius.md,
  },
  selected: {
    backgroundColor: colors.brand.soft,
  },
  today: {
    borderWidth: 1,
    borderColor: colors.brand.accent,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    minHeight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.xs,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  note: {
    marginTop: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
}));
