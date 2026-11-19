import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import {
  addDays,
  formatDateWithRelative,
  formatMonthYear,
  isSameDay,
  startOfDay,
  today,
} from '@/shared/utils/date';
import {
  isMonthSelectable,
  isYearInRange,
  MONTH_SHORT,
  pageHasYears,
  yearPage,
  yearPageStart,
  yearRange,
  YEARS_PER_PAGE,
} from '@/shared/utils/calendar';

import { AppText } from './AppText';
import { Chip } from './Chip';
import { Icon } from './Icon';

type DateFieldProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  /** Fecha más antigua permitida (p. ej. la del último registro de km). */
  minDate?: Date;
  /** Fecha más reciente permitida. Por defecto hoy; `null` = sin límite (vencimientos). */
  maxDate?: Date | null;
  /** Muestra los accesos rápidos "Hoy" / "Ayer" / "Antier". Para vencimientos se desactiva. */
  quickOptions?: boolean;
  invalid?: boolean;
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Fecha con accesos rápidos "Hoy" / "Ayer" y un calendario propio (sin librerías). */
export function DateField({
  value,
  onChange,
  minDate,
  maxDate: maxDateProp,
  quickOptions = true,
  invalid = false,
}: DateFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const now = today();
  const maxDate = maxDateProp === undefined ? now : (maxDateProp ?? undefined);
  const yesterday = addDays(now, -1);
  const dayBefore = addDays(now, -2);
  const [calendarOpen, setCalendarOpen] = useState(!quickOptions && value === null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = value ?? now;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const pick = (date: Date) => {
    onChange(date);
    setCalendarOpen(false);
  };

  const isQuick =
    value !== null && (isSameDay(value, now) || isSameDay(value, yesterday) || isSameDay(value, dayBefore));
  const yesterdayAllowed = !minDate || yesterday >= startOfDay(minDate);
  const dayBeforeAllowed = !minDate || dayBefore >= startOfDay(minDate);

  return (
    <View style={styles.container}>
      {quickOptions ? (
        <>
          <View style={styles.chips}>
            <Chip
              label="Hoy"
              selected={value !== null && isSameDay(value, now)}
              onPress={() => pick(now)}
            />
            {yesterdayAllowed && (
              <Chip
                label="Ayer"
                selected={value !== null && isSameDay(value, yesterday)}
                onPress={() => pick(yesterday)}
              />
            )}
            {dayBeforeAllowed && (
              <Chip
                label="Antier"
                selected={value !== null && isSameDay(value, dayBefore)}
                onPress={() => pick(dayBefore)}
              />
            )}
            <Chip
              label="Otra fecha"
              icon="calendar"
              selected={(value !== null && !isQuick) || calendarOpen}
              onPress={() => setCalendarOpen((open) => !open)}
            />
          </View>
          {value && (
            <AppText variant="caption" tone="secondary">
              {formatDateWithRelative(value)}
            </AppText>
          )}
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setCalendarOpen((open) => !open)}
          style={[styles.dateButton, invalid && styles.dateButtonInvalid]}>
          <Icon name="calendar" color={colors.brand.accent} />
          <AppText
            variant={value ? 'bodyStrong' : 'body'}
            tone={value ? 'primary' : 'muted'}
            style={styles.dateButtonText}>
            {value ? formatDateWithRelative(value) : 'Elegir fecha'}
          </AppText>
        </Pressable>
      )}

      {calendarOpen && (
        <Calendar
          month={visibleMonth}
          onChangeMonth={setVisibleMonth}
          selected={value}
          minDate={minDate}
          maxDate={maxDate}
          onSelect={pick}
        />
      )}
    </View>
  );
}

type CalendarProps = {
  month: Date;
  onChangeMonth: (month: Date) => void;
  selected: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onSelect: (date: Date) => void;
};

/** Vista del calendario: días (como siempre), meses de un año o páginas de 12 años. */
type CalendarView = 'days' | 'months' | 'years';

function Calendar({ month, onChangeMonth, selected, minDate, maxDate, onSelect }: CalendarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [view, setView] = useState<CalendarView>('days');
  // Primer año de la página visible en la vista de años.
  const [pageStart, setPageStart] = useState(() => yearPageStart(month.getFullYear()));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const range = yearRange(minDate, maxDate, today());

  if (view === 'years') {
    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <MonthButton
            icon="back"
            label="Años anteriores"
            disabled={!pageHasYears(pageStart - YEARS_PER_PAGE, range)}
            onPress={() => setPageStart(pageStart - YEARS_PER_PAGE)}
          />
          <AppText variant="bodyStrong" style={styles.monthLabel}>
            {pageStart} – {pageStart + YEARS_PER_PAGE - 1}
          </AppText>
          <MonthButton
            icon="chevronRight"
            label="Años siguientes"
            disabled={!pageHasYears(pageStart + YEARS_PER_PAGE, range)}
            onPress={() => setPageStart(pageStart + YEARS_PER_PAGE)}
          />
        </View>
        <View style={styles.pickGrid}>
          {yearPage(pageStart).map((y) => (
            <PickCell
              key={y}
              label={String(y)}
              selected={y === year}
              disabled={!isYearInRange(y, range)}
              onPress={() => {
                // Al elegir un año se abre la vista de sus meses.
                onChangeMonth(new Date(y, monthIndex, 1));
                setView('months');
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (view === 'months') {
    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <MonthButton
            icon="back"
            label="Año anterior"
            disabled={!isYearInRange(year - 1, range)}
            onPress={() => onChangeMonth(new Date(year - 1, monthIndex, 1))}
          />
          <TitleButton
            label={String(year)}
            hint="Elegir el año"
            onPress={() => {
              setPageStart(yearPageStart(year));
              setView('years');
            }}
          />
          <MonthButton
            icon="chevronRight"
            label="Año siguiente"
            disabled={!isYearInRange(year + 1, range)}
            onPress={() => onChangeMonth(new Date(year + 1, monthIndex, 1))}
          />
        </View>
        <View style={styles.pickGrid}>
          {MONTH_SHORT.map((name, m) => (
            <PickCell
              key={name}
              label={name}
              selected={m === monthIndex}
              disabled={!isMonthSelectable(year, m, minDate, maxDate)}
              onPress={() => {
                // Al elegir un mes se vuelve a los días de ese mes.
                onChangeMonth(new Date(year, m, 1));
                setView('days');
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Lunes = 0 … Domingo = 6
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];

  const canGoNext = !maxDate || new Date(year, monthIndex + 1, 1) <= maxDate;
  const canGoPrev = !minDate || new Date(year, monthIndex, 0) >= startOfDay(minDate);

  const isDisabled = (date: Date) =>
    (maxDate !== undefined && date > maxDate) ||
    (minDate !== undefined && date < startOfDay(minDate));

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <MonthButton
          icon="back"
          label="Mes anterior"
          disabled={!canGoPrev}
          onPress={() => onChangeMonth(new Date(year, monthIndex - 1, 1))}
        />
        <TitleButton label={formatMonthYear(month)} hint="Elegir el año y el mes" onPress={() => setView('months')} />
        <MonthButton
          icon="chevronRight"
          label="Mes siguiente"
          disabled={!canGoNext}
          onPress={() => onChangeMonth(new Date(year, monthIndex + 1, 1))}
        />
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((day, i) => (
          <View key={`w${i}`} style={styles.cell}>
            <AppText variant="caption" tone="muted">
              {day}
            </AppText>
          </View>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={`e${i}`} style={styles.cell} />;
          const disabled = isDisabled(date);
          const isSelected = selected !== null && isSameDay(date, selected);
          return (
            <Pressable
              key={date.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: isSelected }}
              disabled={disabled}
              onPress={() => onSelect(date)}
              style={styles.cell}>
              <View style={[styles.day, isSelected && styles.daySelected]}>
                <AppText
                  variant={isSelected ? 'captionStrong' : 'caption'}
                  color={
                    isSelected
                      ? colors.brand.onPrimary
                      : disabled
                        ? colors.border
                        : colors.text.primary
                  }>
                  {date.getDate()}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Título que se puede tocar ("octubre de 2026 ▾") para cambiar de vista. */
function TitleButton({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      onPress={onPress}
      style={({ pressed }) => [styles.titleButton, pressed && styles.pressed]}>
      <AppText variant="bodyStrong" style={styles.titleText}>
        {label}
      </AppText>
      <Icon name="expandMore" size={20} color={colors.brand.accent} />
    </Pressable>
  );
}

type PickCellProps = { label: string; selected: boolean; disabled: boolean; onPress: () => void };

/** Celda de año o de mes (4 filas de 3). Fuera de rango se ve apagada y no se puede tocar. */
function PickCell({ label, selected, disabled, onPress }: PickCellProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={styles.pickCell}>
      <View style={[styles.pick, selected && styles.daySelected]}>
        <AppText
          variant={selected ? 'bodyStrong' : 'body'}
          color={selected ? colors.brand.onPrimary : disabled ? colors.border : colors.text.primary}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

type MonthButtonProps = {
  icon: 'back' | 'chevronRight';
  label: string;
  disabled: boolean;
  onPress: () => void;
};

function MonthButton({ icon, label, disabled, onPress }: MonthButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={styles.monthButton}>
      <Icon name={icon} color={disabled ? colors.border : colors.brand.accent} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  container: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateButtonInvalid: {
    borderColor: colors.status.due.color,
  },
  dateButtonText: {
    flex: 1,
  },
  calendar: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  titleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: sizes.touchMin,
  },
  titleText: {
    textTransform: 'capitalize',
  },
  pressed: {
    opacity: 0.7,
  },
  pickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickCell: {
    width: `${100 / 3}%`,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pick: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.brand.primary,
  },
}));
