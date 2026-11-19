import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { weeklyItemsFor, weeklyStatusText, WEEKLY_REMINDER_HOUR } from '@/features/weeklyCheck/rules';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, SettingsRow, SettingsSection, useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';

/**
 * Revisión semanal (opcional): 5 puntos que miras tú en el carro. RODEXA no revisa
 * nada; solo guarda cuándo la hiciste y te la recuerda si quieres.
 */
export default function WeeklyCheckScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { profile } = useAppData();
  const { settings, update } = useSettings();
  const items = weeklyItemsFor(profile);
  const [checked, setChecked] = useState<string[]>([]);
  const all = checked.length === items.length;

  const toggle = (key: string) => setChecked(checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]);

  const setReminder = (enabled: boolean) =>
    update({ weeklyCheckEnabled: enabled, weeklyCheckSince: enabled ? toISODate(today()) : settings.weeklyCheckSince });

  const done = () => {
    update({ weeklyCheckLastDone: toISODate(today()) });
    toast.show(all ? 'Revisión completada' : 'Revisión guardada');
    router.back();
  };

  return (
    <FormScreen
      title="Revisión semanal"
      closeIcon="back"
      footer={
        <Button
          label={all ? 'Finalizar revisión' : `Guardar · ${checked.length} de ${items.length} revisados`}
          fullWidth
          disabled={checked.length === 0}
          onPress={done}
        />
      }>
      <AppText tone="secondary">
        5 puntos rápidos para mirar tu carro una vez por semana. Te toma un par de minutos.
      </AppText>
      <AppText variant="caption" tone="muted">
        {weeklyStatusText(settings, today())}
      </AppText>

      <Card flush>
        {items.map((item, i) => {
          const on = checked.includes(item.key);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(item.key)}
              style={({ pressed }) => [styles.item, i > 0 && styles.divider, pressed && styles.pressed]}>
              <View style={styles.icon}>
                <Icon name={item.icon} size={20} color={colors.brand.accent} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{item.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {item.hint}
                </AppText>
              </View>
              <Icon name={on ? 'checkboxOn' : 'checkboxOff'} color={on ? colors.brand.accent : colors.text.muted} />
            </Pressable>
          );
        })}
      </Card>

      <SettingsSection footnote={`Te avisamos cada semana a las ${WEEKLY_REMINDER_HOUR}:00 a. m., contando desde tu última revisión.`}>
        <SettingsRow
          icon="notifications"
          label="Recordarme cada semana"
          accessory={{ type: 'switch', value: settings.weeklyCheckEnabled, onChange: setReminder }}
        />
      </SettingsSection>

      <View style={styles.note}>
        <Icon name="info" size={18} color={colors.text.secondary} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          RODEXA no revisa tu carro: esta lista es para que tú lo mires. Si notas algo fuera de lo normal, consulta a tu mecánico.
        </AppText>
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.brand.soft,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
