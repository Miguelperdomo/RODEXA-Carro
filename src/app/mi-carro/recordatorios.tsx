import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { customStatus, repeatText, sortReminders, type CustomReminder } from '@/features/customReminders/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon, SectionHeader } from '@/shared/ui';
import { today } from '@/shared/utils/date';

/**
 * Recordatorios que crea el usuario, por fecha o por kilometraje. Los de fecha llegan como
 * notificación ese día; los de km aparecen en "Hoy" cuando se acercan.
 */
export default function CustomRemindersScreen() {
  const { customReminders } = useSession();
  const { odometer } = useAppData();
  const now = today();
  const km = odometer.registeredKm;
  const active = sortReminders(customReminders.filter((r) => !r.doneAt), km, now);
  const done = customReminders.filter((r) => r.doneAt);

  return (
    <FormScreen
      title="Recordatorios"
      closeIcon="back"
      footer={<Button label="Crear recordatorio" icon="add" fullWidth onPress={() => router.push('/mi-carro/recordatorio')} />}>
      <AppText tone="secondary">
        Lo que quieras que te recordemos: cambiar plumillas, revisar el extintor, renovar la póliza… Por fecha te llega una
        notificación ese día; por kilometraje lo ves en Inicio cuando te acerques.
      </AppText>

      {customReminders.length === 0 ? (
        <EmptyState icon="notifications" title="Aún no tienes recordatorios" message="Crea el primero con el botón de abajo." />
      ) : (
        <>
          {active.length > 0 && <ReminderList title="Activos" list={active} km={km} now={now} />}
          {done.length > 0 && <ReminderList title="Hechos" list={done} km={km} now={now} />}
        </>
      )}
    </FormScreen>
  );
}

function ReminderList({ title, list, km, now }: { title: string; list: CustomReminder[]; km: number; now: Date }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title={title} caption={`${list.length}`} />
      <Card flush>
        {list.map((reminder, i) => {
          const status = customStatus(reminder, km, now);
          const tone =
            status.level === 'due' || status.level === 'soon' || status.level === 'ok' ? colors.status[status.level] : colors.status.na;
          return (
            <Fragment key={reminder.id}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/mi-carro/recordatorio', params: { id: reminder.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: tone.background }]}>
                  <Icon name={reminder.trigger.type === 'km' ? 'odometer' : 'calendar'} size={20} color={tone.color} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{reminder.title}</AppText>
                  <AppText variant="caption" color={status.level === 'due' ? tone.color : colors.text.secondary}>
                    {status.detail}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {repeatText(reminder)}
                  </AppText>
                </View>
                <Icon name="chevronRight" color={colors.text.muted} />
              </Pressable>
            </Fragment>
          );
        })}
      </Card>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
