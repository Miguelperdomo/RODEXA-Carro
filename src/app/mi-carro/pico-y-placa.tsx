import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import {
  DISCLAIMER,
  formatDay,
  formatTime,
  formatWindows,
  MAX_WINDOWS,
  MODE_LABELS,
  officialSearchUrl,
  REMINDER_EVENING_HOUR,
  from12h,
  to12h,
  upcomingDays,
  validateConfig,
  WEEKDAY_LABELS,
  type Period,
  type PicoYPlacaConfig,
  type PicoYPlacaMode,
  type TimeWindow,
} from '@/features/picoYPlaca/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Chip, Field, FormScreen, Icon, NumberField, SettingsRow, SettingsSection, useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';
import { appAlert } from '@/shared/ui/AppDialog';

/** Un horario como lo escribe la persona: hora de 1 a 12, minutos y a. m. / p. m. */
type RawWindow = {
  sh: number | null;
  sm: number | null;
  sp: Period;
  eh: number | null;
  em: number | null;
  ep: Period;
};

const EMPTY_WINDOW: RawWindow = { sh: null, sm: 0, sp: 'am', eh: null, em: 0, ep: 'pm' };

const fromWindow = (w: TimeWindow): RawWindow => {
  const s = to12h(w.start);
  const e = to12h(w.end);
  return { sh: s.hour, sm: s.minute, sp: s.period, eh: e.hour, em: e.minute, ep: e.period };
};
const MODES: PicoYPlacaMode[] = ['weekdays', 'even_dates', 'odd_dates'];

/**
 * Mi pico y placa: el usuario marca los días y el horario de SU placa. RODEXA no conoce
 * las reglas de la ciudad; solo le recuerda lo que configuró.
 */
export default function PicoYPlacaScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { user, profile } = useAppData();
  const { picoYPlaca, setPicoYPlaca } = useSession();

  const [enabled, setEnabled] = useState(picoYPlaca?.enabled ?? true);
  const [mode, setMode] = useState<PicoYPlacaMode>(picoYPlaca?.mode ?? 'weekdays');
  const [weekdays, setWeekdays] = useState<number[]>(picoYPlaca?.weekdays ?? []);
  const [windows, setWindows] = useState<RawWindow[]>(
    picoYPlaca?.windows.map(fromWindow) ?? [EMPTY_WINDOW],
  );
  const [remind, setRemind] = useState(picoYPlaca?.remindNightBefore ?? true);
  const [submitted, setSubmitted] = useState(false);

  const parsed = windows.map((w) => ({ start: from12h(w.sh, w.sm, w.sp), end: from12h(w.eh, w.em, w.ep) }));
  const rawInvalid = parsed.some((w) => w.start === undefined || w.end === undefined);
  const validWindows = rawInvalid ? [] : (parsed as TimeWindow[]);
  const errors = validateConfig({ weekdays, windows: validWindows }, rawInvalid);
  const shown = submitted ? errors : {};

  const config: PicoYPlacaConfig = {
    enabled,
    mode,
    weekdays: [...weekdays].sort(),
    windows: validWindows,
    remindNightBefore: remind,
    updatedAt: toISODate(today()),
  };
  const preview = Object.keys(errors).length === 0 ? upcomingDays(config, today(), 5) : [];

  const toggleDay = (day: number) =>
    setWeekdays(weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day]);
  const setWindow = <K extends keyof RawWindow>(i: number, key: K) => (value: RawWindow[K]) =>
    setWindows(windows.map((w, j) => (j === i ? { ...w, [key]: value } : w)));

  const changeMode = (next: PicoYPlacaMode) => {
    // En par/impar casi siempre rige de lunes a viernes: se sugiere si no había días.
    if (next !== 'weekdays' && weekdays.length === 0) setWeekdays([1, 2, 3, 4, 5]);
    setMode(next);
  };

  const save = async () => {
    setSubmitted(true);
    const valid = Object.keys(errors).length === 0;
    if (enabled && !valid) return;
    // Desactivado: se conservan los días y el horario para volver a activarlo después.
    const toSave: PicoYPlacaConfig | null = enabled || valid ? config : picoYPlaca ? { ...picoYPlaca, enabled: false } : null;
    if (!(await persist(() => setPicoYPlaca(toSave)))) return;
    toast.show(enabled ? 'Pico y placa guardado' : 'Pico y placa desactivado');
    router.back();
  };

  const remove = () =>
    appAlert('¿Quitar tu pico y placa?', 'Se borran los días y el horario que configuraste.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => setPicoYPlaca(null)))) return;
          toast.show('Pico y placa quitado');
          router.back();
        },
      },
    ]);

  const openOfficial = async () => {
    const url = officialSearchUrl(user.city);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url).catch(() => toast.show('No se pudo abrir el navegador.'));
    }
  };

  return (
    <FormScreen
      title="Mi pico y placa"
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button label="Guardar" fullWidth onPress={save} />
          {picoYPlaca && <Button label="Quitar pico y placa" variant="ghost" fullWidth onPress={remove} />}
        </View>
      }>
      <AppText tone="secondary">
        Marca los días y el horario en que tu placa{profile.plate ? ` (${profile.plate})` : ''} tiene pico y placa. RODEXA te lo
        recuerda con lo que configures.
      </AppText>

      {/* Consulta oficial */}
      <Card style={styles.card}>
        <View style={styles.row}>
          <Icon name="search" color={colors.brand.accent} />
          <AppText variant="bodyStrong" style={styles.flex}>
            ¿No sabes cuál es tu pico y placa?
          </AppText>
        </View>
        <AppText variant="caption" tone="secondary">
          Consúltalo en la página oficial de la Secretaría de Movilidad de {user.city || 'tu ciudad'}. Cambia según la
          ciudad, el último dígito de la placa y las fechas.
        </AppText>
        <Button label={`Consultar el de ${user.city || 'mi ciudad'}`} variant="secondary" icon="search" onPress={openOfficial} />
      </Card>

      <SettingsSection>
        <SettingsRow
          icon="car"
          label="Tengo pico y placa"
          accessory={{ type: 'switch', value: enabled, onChange: setEnabled }}
        />
      </SettingsSection>

      {enabled && (
        <>
          <Field label="¿Cómo funciona en tu ciudad?">
            <View style={styles.chips}>
              {MODES.map((m) => (
                <Chip key={m} label={MODE_LABELS[m]} selected={mode === m} onPress={() => changeMode(m)} />
              ))}
            </View>
          </Field>

          <Field
            label={mode === 'weekdays' ? '¿Qué días tienes pico y placa?' : '¿Qué días de la semana rige?'}
            hint={
              mode === 'weekdays'
                ? undefined
                : `Tendrás pico y placa los días ${mode === 'even_dates' ? 'pares' : 'impares'} del mes que caigan en estos días.`
            }
            error={shown.weekdays}>
            <View style={styles.chips}>
              {WEEKDAY_LABELS.map((label, i) => (
                <Chip key={label} label={label} selected={weekdays.includes(i + 1)} onPress={() => toggleDay(i + 1)} />
              ))}
            </View>
          </Field>

          <Field label="Horario" hint="Por ejemplo, de 6:00 a. m. a 9:00 p. m." error={shown.windows}>
            <View style={styles.windows}>
              {windows.map((w, i) => (
                <View key={i} style={styles.windowCard}>
                  {windows.length > 1 && (
                    <View style={styles.windowHeader}>
                      <AppText variant="captionStrong" tone="secondary" style={styles.flex}>
                        Horario {i + 1}
                      </AppText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar el horario ${i + 1}`}
                        hitSlop={8}
                        onPress={() => setWindows(windows.filter((_, j) => j !== i))}>
                        <Icon name="close" color={colors.text.muted} />
                      </Pressable>
                    </View>
                  )}
                  <TimeInput
                    title="Desde"
                    hour={w.sh}
                    minute={w.sm}
                    period={w.sp}
                    onHour={setWindow(i, 'sh')}
                    onMinute={setWindow(i, 'sm')}
                    onPeriod={setWindow(i, 'sp')}
                  />
                  <TimeInput
                    title="Hasta"
                    hour={w.eh}
                    minute={w.em}
                    period={w.ep}
                    onHour={setWindow(i, 'eh')}
                    onMinute={setWindow(i, 'em')}
                    onPeriod={setWindow(i, 'ep')}
                  />
                </View>
              ))}
              {windows.length < MAX_WINDOWS && (
                <Pressable onPress={() => setWindows([...windows, EMPTY_WINDOW])} hitSlop={8}>
                  <AppText variant="captionStrong" tone="brand">
                    + Agregar otro horario (por ejemplo mañana y tarde)
                  </AppText>
                </Pressable>
              )}
            </View>
          </Field>

          <SettingsSection footnote={`Te avisamos a las ${formatTime(REMINDER_EVENING_HOUR * 60)} del día anterior.`}>
            <SettingsRow
              icon="notifications"
              label="Recordarme la noche anterior"
              accessory={{ type: 'switch', value: remind, onChange: setRemind }}
            />
          </SettingsSection>

          {preview.length > 0 && (
            <Card style={styles.card}>
              <AppText variant="bodyStrong">Próximos días con pico y placa</AppText>
              {preview.map((day) => (
                <View key={day.toISOString()} style={styles.row}>
                  <Icon name="calendar" size={18} color={colors.text.secondary} />
                  <AppText variant="caption" style={styles.flex}>
                    {formatDay(day)} · {formatWindows(config.windows)}
                  </AppText>
                </View>
              ))}
              <AppText variant="caption" tone="muted">
                Según lo que configuraste. Revisa que coincida con lo oficial.
              </AppText>
            </Card>
          )}
        </>
      )}

      <View style={styles.disclaimer}>
        <Icon name="info" size={18} color={colors.text.secondary} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          {DISCLAIMER}
        </AppText>
      </View>
    </FormScreen>
  );
}

type TimeInputProps = {
  title: string;
  hour: number | null;
  minute: number | null;
  period: Period;
  onHour: (v: number | null) => void;
  onMinute: (v: number | null) => void;
  onPeriod: (v: Period) => void;
};

/** Hora de 12 horas: hora (1 a 12) : minutos + a. m. / p. m. */
function TimeInput({ title, hour, minute, period, onHour, onMinute, onPeriod }: TimeInputProps) {
  const styles = useStyles();
  const label = title.toLowerCase();
  return (
    <View style={styles.timeRow}>
      <AppText variant="bodyStrong" style={styles.timeTitle}>
        {title}
      </AppText>
      <View style={styles.timePart}>
        <NumberField value={hour} onChange={onHour} size="md" maxDigits={2} grouping={false} placeholder="6" accessibilityLabel={`Hora ${label}`} />
      </View>
      <AppText variant="bodyStrong">:</AppText>
      <View style={styles.timePart}>
        <NumberField value={minute} onChange={onMinute} size="md" maxDigits={2} grouping={false} placeholder="00" accessibilityLabel={`Minutos ${label}`} />
      </View>
      <View style={styles.period}>
        <Chip label="a. m." selected={period === 'am'} onPress={() => onPeriod('am')} />
        <Chip label="p. m." selected={period === 'pm'} onPress={() => onPeriod('pm')} />
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  footer: {
    gap: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  windows: {
    gap: spacing.md,
  },
  windowCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeTitle: {
    width: 56,
  },
  timePart: {
    width: 64,
  },
  period: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
