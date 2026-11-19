import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useEditingEntry } from '@/features/history/useEditingEntry';
import { validateOdometerReading } from '@/features/odometer/validation';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  DateField,
  Field,
  FormScreen,
  Icon,
  NumberField,
  SuccessView,
  useToast,
} from '@/shared/ui';
import { addDays, daysBetween, formatDateWithRelative, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatDaysAgo, formatKm, formatThousands } from '@/shared/utils/format';
import { editedKmWarning } from '@/features/odometer/editCheck';

export default function RegisterOdometerScreen() {
  const { colors } = useTheme();
  // Último registro conocido (guardado en el teléfono).
  const { odometer, history } = useAppData();
  const { registeredKm: lastKm, daysSinceReading, estimate } = odometer;
  const { addOdometerReading, editEntry } = useSession();
  const persist = usePersist();
  const toast = useToast();
  // Con ?id= se corrige un registro existente.
  const editing = useEditingEntry('odometer');
  const lastReadingDate = addDays(today(), -daysSinceReading);

  const [km, setKm] = useState<number | null>(editing?.km ?? null);
  const [date, setDate] = useState(() => (editing ? parseISODate(editing.date) : today()));
  const [submitted, setSubmitted] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [saved, setSaved] = useState(false);

  // Al corregir un registro no se compara con el último (podría ser él mismo): solo que sea válido.
  const validation = validateOdometerReading({
    newKm: km,
    lastKm: editing ? 0 : lastKm,
    daysSinceLast: editing ? Number.MAX_SAFE_INTEGER : daysBetween(lastReadingDate, date),
  });
  // Al corregir: ¿cuadra con las lecturas de antes y de después? (pregunta, no bloquea).
  const editWarning = editing && km !== null ? editedKmWarning(history, editing.id, toISODate(date), km) : undefined;
  const pendingWarning = validation.warning ?? editWarning;
  // Los errores se muestran después del primer intento de guardar, para no regañar mientras escribe.
  const error = submitted ? validation.error : undefined;
  const warning = submitted ? pendingWarning : undefined;
  const traveled = !editing && km !== null && km >= lastKm ? km - lastKm : null;

  const handleKmChange = (value: number | null) => {
    setKm(value);
    setWarningAccepted(false);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (validation.error) return;
    if (pendingWarning && !warningAccepted) {
      // Primer toque: mostramos la advertencia. Segundo toque: guarda.
      setWarningAccepted(true);
      return;
    }
    if (km === null || saved) return;
    if (editing) {
      const ok = await persist(() => editEntry(editing.id, { ...editing, km, date: toISODate(date) }));
      if (!ok) return;
      toast.show('Cambios guardados');
      router.back();
      return;
    }
    // Éxito solo cuando quedó guardado en el teléfono.
    if (await persist(() => addOdometerReading({ date: toISODate(date), km }))) setSaved(true);
  };

  if (saved && km !== null) {
    return (
      <FormScreen
        title="Registrar kilometraje"
        footer={<Button label="Listo" fullWidth onPress={() => router.back()} />}>
        <SuccessView
          title="Kilometraje registrado"
          summary={[
            { label: 'Kilometraje', value: formatKm(km) },
            { label: 'Recorrido', value: `+${formatKm(km - lastKm)}` },
            { label: 'Fecha', value: formatDateWithRelative(date) },
          ]}
          message="Guardado en tu celular."
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={editing ? 'Editar kilometraje' : 'Registrar kilometraje'}
      footer={
        <Button
          label={warningAccepted && pendingWarning ? 'Sí, guardar' : editing ? 'Guardar cambios' : 'Guardar kilometraje'}
          fullWidth
          disabled={km === null}
          onPress={handleSave}
        />
      }>
      <Card>
        <View style={styles.lastRow}>
          <Icon name="odometer" color={colors.brand.accent} />
          <View style={styles.lastTexts}>
            <AppText variant="caption" tone="secondary">
              Último registro · {formatDaysAgo(daysSinceReading)}
            </AppText>
            <AppText variant="heading" numeric>
              {formatKm(lastKm)}
            </AppText>
          </View>
        </View>
        {estimate.kind === 'available' && (
          <AppText variant="caption" tone="muted" style={styles.estimate}>
            Referencia: estimamos ~{formatThousands(estimate.km)} km hoy. Escribe lo que marca tu
            tablero, no el estimado.
          </AppText>
        )}
      </Card>

      <Field
        label="¿Cuánto marca tu carro hoy?"
        hint={
          traveled !== null ? `+${formatKm(traveled)} desde tu último registro` : 'Míralo en el tablero de tu carro.'
        }
        error={error}
        warning={warning}>
        <NumberField
          value={km}
          onChange={handleKmChange}
          suffix="km"
          autoFocus
          invalid={!!error}
          accessibilityLabel="Kilometraje actual"
        />
      </Field>

      <Field label="Fecha del registro">
        <DateField value={date} onChange={setDate} minDate={lastReadingDate} />
      </Field>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  lastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lastTexts: {
    flex: 1,
  },
  estimate: {
    marginTop: spacing.md,
  },
});
