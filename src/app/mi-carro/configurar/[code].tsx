import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { capabilitiesOf } from '@/features/cars/capabilities';
import { coreComponentsFor, TIME_BASED_COMPONENTS } from '@/features/cars/catalog';
import { intervalOriginText, NO_INTERVAL_MESSAGE } from '@/features/maintenance/intervals';
import { validateComponentConfig } from '@/features/cars/validation';
import type { ComponentSummary } from '@/features/cars/types';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  Chip,
  DateField,
  EmptyState,
  Field,
  FormScreen,
  Icon,
  NumberField,
  SuccessView,
} from '@/shared/ui';
import { formatDate, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';
import { hasErrors } from '@/shared/utils/validation';

export default function ConfigureComponentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { components, odometer, profile } = useAppData();
  const component = components.find((c) => c.code === code);
  // Fijo = aplica con certeza a este vehículo (regla central en cars/catalog).
  const isCore = component !== undefined && coreComponentsFor(capabilitiesOf(profile)).includes(component.code);

  if (!component) {
    return (
      <FormScreen title="Configurar">
        <EmptyState icon="statusNoData" title="No encontramos este componente" />
      </FormScreen>
    );
  }

  return <ConfigureForm component={component} currentKm={odometer.registeredKm} isCore={isCore} />;
}

/** "Cada 5.000 km o 6 meses, lo que llegue primero" / "Cada 5.000 km" / "Cada 6 meses". */
function intervalText(km: number | null | undefined, months: number | null | undefined): string {
  if (km && months) return `Cada ${formatKm(km)} o ${months} meses, lo que llegue primero`;
  if (km) return `Cada ${formatKm(km)}`;
  if (months) return `Cada ${months} meses`;
  return 'Sin configurar';
}

function ConfigureForm({
  component,
  currentKm,
  isCore,
}: {
  component: ComponentSummary;
  currentKm: number;
  isCore: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  // Solo cambia el orden de los campos: la batería suele ir por tiempo; lo demás, por km.
  const timeFirst = TIME_BASED_COMPONENTS.includes(component.code);
  const { saveComponentConfig } = useSession();
  const persist = usePersist();

  const [enabled, setEnabled] = useState(component.enabled);
  const [lastKm, setLastKm] = useState<number | null>(component.lastService?.km ?? null);
  const [lastDate, setLastDate] = useState<Date | null>(
    component.lastService?.date ? parseISODate(component.lastService.date) : null,
  );
  const [lastUnknown, setLastUnknown] = useState(false);
  // Solo se precarga lo que configuró el usuario; el del fabricante se muestra aparte como referencia.
  const userInterval = component.interval?.origin === 'user' ? component.interval : undefined;
  const manufacturerInterval = component.interval?.origin === 'manufacturer' ? component.interval : undefined;
  const [intervalKm, setIntervalKm] = useState<number | null>(userInterval?.km ?? null);
  const [intervalMonths, setIntervalMonths] = useState<number | null>(userInterval?.months ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const validation = validateComponentConfig({
    enabled,
    lastKm,
    lastUnknown,
    intervalKm,
    intervalMonths,
    currentKm,
    hasSourcedInterval: manufacturerInterval !== undefined,
  });
  const errors = submitted ? validation : {};
  const title = `Configurar ${component.title.toLowerCase()}`;

  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors(validation) || saved) return;
    const setAt = toISODate(today());
    const hasInterval = intervalKm !== null || intervalMonths !== null;
    const config = {
      enabled,
      interval:
        enabled && hasInterval
          ? {
              ...(intervalKm !== null ? { km: intervalKm } : {}),
              ...(intervalMonths !== null ? { months: intervalMonths } : {}),
            }
          : undefined,
      // "No lo sé" = sin último cambio configurado (no se inventa). Se guarda lo que haya: km, fecha o ambos.
      lastService:
        !enabled || lastUnknown || (lastKm === null && lastDate === null)
          ? undefined
          : {
              ...(lastKm !== null ? { km: lastKm } : {}),
              ...(lastDate !== null ? { date: toISODate(lastDate) } : {}),
              setAt,
            },
    };
    if (await persist(() => saveComponentConfig(component.code, config))) setSaved(true);
  };

  if (saved) {
    const lastParts = [lastKm !== null ? formatKm(lastKm) : undefined, lastDate ? formatDate(lastDate) : undefined].filter(
      Boolean,
    );
    const lastText = lastUnknown ? 'No lo sé' : lastParts.length > 0 ? lastParts.join(' · ') : 'Sin registrar';
    return (
      <FormScreen title={title} footer={<Button label="Listo" fullWidth onPress={() => router.back()} />}>
        <SuccessView
          title={enabled ? 'Componente configurado' : 'Componente desactivado'}
          summary={
            enabled
              ? [
                  { label: 'Último cambio', value: lastText },
                  {
                    label: 'Intervalo',
                    value:
                      intervalKm === null && intervalMonths === null
                        ? 'Sin configurar'
                        : `${intervalText(intervalKm, intervalMonths)} · configurado por ti`,
                  },
                ]
              : [{ label: component.title, value: 'No se controlará' }]
          }
          message="Guardado en tu celular."
        />
      </FormScreen>
    );
  }

  const lastKmField = (
    <NumberField
      key="lastKm"
      value={lastKm}
      onChange={setLastKm}
      suffix="km"
      invalid={!!errors.lastKm}
      accessibilityLabel="Kilometraje del último cambio"
    />
  );
  const lastDateField = <DateField key="lastDate" value={lastDate} onChange={setLastDate} quickOptions={false} />;
  const kmField = (
    <Field key="intervalKm" label="Cada cuántos km" optional error={errors.intervalKm}>
      <NumberField
        value={intervalKm}
        onChange={setIntervalKm}
        suffix="km"
        size="md"
        maxDigits={6}
        invalid={!!errors.intervalKm}
        accessibilityLabel="Intervalo en km"
      />
    </Field>
  );
  const monthsField = (
    <Field key="intervalMonths" label="Cada cuántos meses" optional error={errors.intervalMonths}>
      <NumberField
        value={intervalMonths}
        onChange={setIntervalMonths}
        suffix="meses"
        size="md"
        grouping={false}
        maxDigits={2}
        invalid={!!errors.intervalMonths}
        accessibilityLabel="Intervalo en meses"
      />
    </Field>
  );

  return (
    <FormScreen title={title} footer={<Button label="Guardar" fullWidth onPress={handleSave} />}>
      {!isCore && (
        <Card>
          <View style={styles.switchRow}>
            <View style={styles.switchTexts}>
              <AppText variant="bodyStrong">Controlar {component.title.toLowerCase()}</AppText>
              <AppText variant="caption" tone="secondary">
                Aparecerá en el estado de tu carro y te avisaremos cuando se acerque.
              </AppText>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ true: colors.brand.primary, false: colors.border }}
              thumbColor={colors.brand.onPrimary}
              accessibilityLabel={`Controlar ${component.title}`}
            />
          </View>
        </Card>
      )}

      {enabled && (
        <>
          <Field
            label="¿Cuándo fue el último cambio?"
            hint={`Escribe el km, la fecha o ambos. Tu kilometraje registrado es ${formatKm(currentKm)}.`}
            error={errors.lastKm}>
            {!lastUnknown && (timeFirst ? [lastDateField, lastKmField] : [lastKmField, lastDateField])}
            <View style={styles.chips}>
              <Chip label="No lo sé" selected={lastUnknown} onPress={() => setLastUnknown((v) => !v)} />
            </View>
            {lastUnknown && (
              <AppText variant="caption" tone="secondary">
                Sin este dato mostraremos “Sin datos” hasta que registres el próximo cambio.
              </AppText>
            )}
          </Field>

          {manufacturerInterval && (
            <Card>
              <AppText variant="bodyStrong">
                {intervalText(manufacturerInterval.km, manufacturerInterval.months)}
                {manufacturerInterval.condition ? ` · ${manufacturerInterval.condition}` : ''}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {intervalOriginText(manufacturerInterval)}
              </AppText>
            </Card>
          )}

          <View style={styles.intervalGroup}>
            <AppText variant="bodyStrong">¿Cada cuánto te avisamos?</AppText>
            <AppText variant="caption" tone="secondary">
              {manufacturerInterval
                ? 'Si escribes un valor, se usará el tuyo en lugar del de la fuente.'
                : `${NO_INTERVAL_MESSAGE} Puedes poner km, meses o ambos: con los dos te avisamos con lo que llegue primero.`}
            </AppText>
            {timeFirst ? [monthsField, kmField] : [kmField, monthsField]}
          </View>

          <View style={styles.disclaimer}>
            <Icon name="info" size={18} color={colors.text.secondary} />
            <AppText variant="caption" tone="secondary" style={styles.disclaimerText}>
              Quedará como “Configurado por ti”. RODEXA Carro no propone intervalos: el que
              corresponde a tu carro está en su manual o te lo indica el fabricante.
            </AppText>
          </View>
        </>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchTexts: {
    flex: 1,
    gap: 2,
  },
  intervalGroup: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  disclaimerText: {
    flex: 1,
  },
}));
