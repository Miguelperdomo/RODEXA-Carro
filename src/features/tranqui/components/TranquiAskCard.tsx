import { useState } from 'react';
import { View } from 'react-native';

import { validateOdometerReading } from '@/features/odometer/validation';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon, NumberField, useToast } from '@/shared/ui';
import { addDays, toISODate, today } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';

import { TRANQUI_SNOOZE_DAYS, type TranquiAsk } from '../ask';
import { appAlert } from '@/shared/ui/AppDialog';

/** Pide confirmar un km poco usual (un cero de más, demasiados km por día). */
const confirmWarning = (message: string) =>
  new Promise<boolean>((resolve) =>
    appAlert('Revisa el kilometraje', message, [
      { text: 'Revisar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Sí, está bien', onPress: () => resolve(true) },
    ]),
  );

/**
 * Tranqui → la única pregunta del momento en Inicio: "Tu cambio de aceite podría estar cerca,
 * ¿cuánto marca tu carro?" o "Revisión del mes: ¿usaste el carro?". Se responde sin abrir
 * formularios. "Ahora no" la esconde unos días.
 */
export function TranquiAskCard({ ask }: { ask: TranquiAsk }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { odometer } = useAppData();
  const { addOdometerReading } = useSession();
  const { update } = useSettings();
  // En la revisión del mes, primero "¿Usaste el carro?"; si sí, se pide el km.
  const [askingKm, setAskingKm] = useState(ask.kind === 'maintenance');
  const [km, setKm] = useState<number | null>(null);
  const lastKm = odometer.registeredKm;
  const check = validateOdometerReading({ newKm: km, lastKm, daysSinceLast: odometer.daysSinceReading });
  const tooLow = km !== null && km < lastKm;

  const later = () => {
    update({ tranquiAskSnoozedUntil: toISODate(addDays(today(), TRANQUI_SNOOZE_DAYS)) });
    toast.show(`Te volvemos a preguntar en ${TRANQUI_SNOOZE_DAYS} días`);
  };

  const save = async () => {
    if (km === null || check.error) return;
    if (check.warning && !(await confirmWarning(check.warning))) return;
    if (!(await persist(() => addOdometerReading({ date: toISODate(today()), km })))) return;
    toast.show(`Kilometraje guardado: ${formatKm(km)}`);
  };

  // "No lo usé": se confirma el mismo km hoy (no se suman km que no recorrió).
  const notUsed = async () => {
    if (!(await persist(() => addOdometerReading({ date: toISODate(today()), km: lastKm })))) return;
    toast.show('Kilometraje confirmado sin cambios');
  };

  const title =
    ask.kind === 'maintenance' ? `${ask.title}: podría estar cerca` : 'Revisión del mes';
  const text =
    ask.kind === 'maintenance'
      ? `Según tu ritmo vas por unos ${formatKm(ask.estimateKm)}. ¿Cuánto marca tu carro? Así te avisamos a tiempo.`
      : `Hace ${ask.days} días no registras el kilometraje. ¿Usaste el carro?`;

  return (
    <Card tone="highlight">
      <View style={styles.header}>
        <Icon name={ask.kind === 'maintenance' ? 'maintenance' : 'odometer'} color={colors.brand.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" tone="secondary">
            {text}
          </AppText>
        </View>
      </View>

      {askingKm ? (
        <View style={styles.body}>
          <NumberField
            value={km}
            onChange={setKm}
            suffix="km"
            size="md"
            invalid={tooLow}
            accessibilityLabel="Cuánto marca tu carro"
          />
          {tooLow && (
            <AppText variant="caption" color={colors.status.soon.color}>
              Es menor a tu último registro ({formatKm(lastKm)}). Revísalo.
            </AppText>
          )}
          <View style={styles.actions}>
            <Button label="Guardar" icon="check" disabled={km === null || !!check.error} onPress={save} />
            <Button label="Ahora no" variant="ghost" onPress={later} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Sí, lo usé" onPress={() => setAskingKm(true)} />
          <Button label="No lo usé" variant="secondary" onPress={notUsed} />
          <Button label="Ahora no" variant="ghost" onPress={later} />
        </View>
      )}
    </Card>
  );
}

const useStyles = createStyles(() => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  body: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
}));
