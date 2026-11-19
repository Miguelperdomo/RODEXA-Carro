import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { canRecord } from '@/features/cars/energy';
import { estimatedEnergy } from '@/features/energy/compute';
import {
  amountsIssues,
  buildEnergyRecord,
  defaultChargeMode,
  defaultFuelUnit,
  energyActionTitle,
  FULL_QUESTION,
  lastRegisteredPrice,
  resolveEnergyAmounts,
  stateFromRecord,
  unitName,
  unitPlural,
  unitShort,
  type ChargeMode,
} from '@/features/energy/form';
import { ENERGY_META, FUEL_UNIT_LABELS } from '@/features/energy/meta';
import { CHARGE_TYPE_OPTIONS } from '@/features/energy/presentation';
import { validateEnergyRecord } from '@/features/energy/validation';
import type { ChargeType, EnergyKind, EnergyRecord, FuelUnit, HistoryEntry } from '@/features/history/types';
import { RecordKmField } from '@/features/odometer/components/RecordKmField';
import { INFO_FULL } from '@/shared/help/infoTexts';
import { energyPlausibility } from '@/features/plausibility/rules';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { isEditableEntry } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  Chip,
  DateField,
  DecimalField,
  EmptyState,
  Field,
  FormScreen,
  Icon,
  NumberField,
  TextField,
  useToast,
} from '@/shared/ui';
import { daysBetween, formatLongDate, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatCop, formatDecimal, formatKm } from '@/shared/utils/format';
import { hasErrors } from '@/shared/utils/validation';

const KINDS: EnergyKind[] = ['fuel', 'cng', 'charge'];
/** Id temporal del registro que aún no se guarda (solo para revisarlo). */
const DRAFT_ID = '__draft__';
const isEnergy = (e: HistoryEntry | undefined): e is EnergyRecord =>
  e !== undefined && (e.kind === 'fuel' || e.kind === 'cng' || e.kind === 'charge');

/**
 * Registrar (o corregir con ?id=) un tanqueo, carga de GNC o carga eléctrica.
 * ?tipo= fuel | cng | charge. Qué tipos puede registrar el carro lo decide la regla
 * central (cars/energy); esta pantalla no pregunta "si es eléctrico".
 * Flujo: lo que pagaste + el precio → RODEXA calcula la cantidad (ver energy/form).
 */
export default function RegisterEnergyScreen() {
  const { tipo, id } = useLocalSearchParams<{ tipo?: string; id?: string }>();
  const { history, profile } = useAppData();
  const [editing] = useState(() => {
    const found = id ? history.find((e) => e.id === id) : undefined;
    return isEnergy(found) && isEditableEntry(found.id) ? found : undefined;
  });
  const kind: EnergyKind = editing?.kind ?? (KINDS.find((k) => k === tipo) ?? 'fuel');

  // Un registro que ya existe siempre se puede corregir; uno nuevo solo si el carro lo permite.
  if (!editing && !canRecord(profile, kind)) {
    return (
      <FormScreen title={`Registrar ${energyActionTitle(kind, profile.energySource).toLowerCase()}`} closeIcon="back">
        <EmptyState
          icon="info"
          title="Este registro no aplica a tu carro"
          message="Según el combustible o la energía que indicaste, tu carro no usa este tipo de abastecimiento. Si no es así, corrígelo en Mi carro."
          action={<Button label="Revisar mi carro" onPress={() => router.replace('/mi-carro/editar')} />}
        />
      </FormScreen>
    );
  }

  return <EnergyForm kind={kind} editing={editing} />;
}

function EnergyForm({ kind, editing }: { kind: EnergyKind; editing?: EnergyRecord }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { odometer, history, profile } = useAppData();
  const { addEnergyRecord, editEntry } = useSession();
  const persist = usePersist();
  const meta = ENERGY_META[kind];
  const title = energyActionTitle(kind, profile.energySource);

  const [initial] = useState(() => (editing ? stateFromRecord(editing) : undefined));
  // Sugerencia: el último precio que REGISTRÓ el usuario (nunca un precio actual de una estación).
  const [suggestion] = useState(() => (editing ? undefined : lastRegisteredPrice(history, kind)));

  const [mode, setMode] = useState<ChargeMode>(initial?.mode ?? defaultChargeMode(history));
  const [unit, setUnit] = useState<FuelUnit>(initial?.unit ?? suggestion?.unit ?? defaultFuelUnit(history));
  const [costCop, setCostCop] = useState<number | null>(initial?.costCop ?? null);
  const [unitPriceCop, setUnitPriceCop] = useState<number | null>(
    initial ? initial.unitPriceCop : (suggestion?.unitPriceCop ?? null),
  );
  const [exactQuantity, setExactQuantity] = useState<number | null>(initial?.exactQuantity ?? null);
  const [full, setFull] = useState(initial?.full ?? true);
  const [startPercent, setStartPercent] = useState<number | null>(initial?.startPercent ?? null);
  const [endPercent, setEndPercent] = useState<number | null>(initial?.endPercent ?? null);
  const [chargeType, setChargeType] = useState<ChargeType | undefined>(initial?.chargeType);
  const [place, setPlace] = useState(initial?.place ?? '');
  const [km, setKm] = useState<number | null>(initial?.km ?? null);
  const [kmUnknown, setKmUnknown] = useState(initial?.kmUnknown ?? false);
  const [date, setDate] = useState(() => (initial ? parseISODate(initial.date) : today()));
  const [note, setNote] = useState(initial?.note ?? '');
  // Al editar se abre con todo a la vista (incluida la cantidad que tiene el registro).
  const [moreOpen, setMoreOpen] = useState(!!editing);
  const [submitted, setSubmitted] = useState(false);
  const [confirmedWarnings, setConfirmedWarnings] = useState(false);

  const isHome = kind === 'charge' && mode === 'home';
  const name = unitName(kind, unit);
  const short = unitShort(kind, unit);
  // Sin cambios del usuario, el precio sugerido nunca se usa para inventar un costo.
  const priceIsSuggestion =
    suggestion !== undefined &&
    unitPriceCop === suggestion.unitPriceCop &&
    (kind !== 'fuel' || suggestion.unit === unit);

  const draft = { costCop, unitPriceCop, exactQuantity, priceIsSuggestion };
  const amounts = resolveEnergyAmounts(draft);
  const issues = amountsIssues(kind, mode, draft, amounts, unit);
  const validation = validateEnergyRecord(
    {
      kind,
      date,
      km,
      kmUnknown,
      quantity: amounts.quantity ?? null,
      unit,
      unitPriceCop: amounts.unitPriceCop ?? null,
      costCop: amounts.costCop ?? null,
      startPercent,
      endPercent,
    },
    {
      // Al corregir no se compara con el último km (podría ser este mismo registro).
      lastKm: editing ? 0 : odometer.registeredKm,
      daysSinceLast: editing ? Number.MAX_SAFE_INTEGER : daysBetween(parseISODate(odometer.lastReadingDate), date),
      tankCapacityLiters: profile.tankCapacityLiters,
    },
  );
  // Lo pagado, el precio y la cantidad los revisa energy/form (mensajes del nuevo orden).
  const { quantity: _q, costCop: _c, unitPriceCop: _p, ...otherErrors } = validation.errors;
  const errors = submitted ? otherErrors : {};
  const warnings = submitted ? validation.warnings : {};
  const shown = submitted ? issues : {};
  const hasWarnings = hasErrors(validation.warnings) || !!issues.warning;
  const estimate =
    kind === 'charge'
      ? estimatedEnergy(profile.batteryCapacityKwh, endPercent ?? undefined, startPercent ?? undefined)
      : undefined;

  // El registro tal como quedaría (también para revisar si algún dato parece mal escrito).
  const record = buildEnergyRecord(
    {
      kind,
      mode,
      unit,
      costCop,
      unitPriceCop,
      exactQuantity,
      full,
      startPercent,
      endPercent,
      chargeType,
      place,
      km,
      kmUnknown,
      date: toISODate(date),
      note,
    },
    amounts,
  );
  // "¿Está bien este dato?": se compara con los propios tanqueos del usuario.
  const plausibility = record
    ? energyPlausibility(history, { ...record, id: editing?.id ?? DRAFT_ID } as EnergyRecord, editing?.id)
    : [];
  const hasAnyWarning = hasWarnings || plausibility.length > 0;

  // Cualquier cambio vuelve a pedir confirmación de las advertencias.
  const change = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setConfirmedWarnings(false);
  };

  const changeUnit = (next: FuelUnit) => {
    // La sugerencia era por la otra unidad: se quita para no mezclar precios por L y por galón.
    if (suggestion && unitPriceCop === suggestion.unitPriceCop && suggestion.unit !== next) setUnitPriceCop(null);
    change(setUnit)(next);
  };

  const save = async () => {
    setSubmitted(true);
    if (hasErrors(otherErrors) || issues.error || issues.exactError || !record) {
      if (issues.exactError) setMoreOpen(true);
      return;
    }
    if (hasAnyWarning && !confirmedWarnings) {
      setConfirmedWarnings(true);
      return;
    }
    // Éxito solo cuando quedó guardado en el teléfono; si falla, sigue en el formulario.
    if (editing) {
      if (!(await persist(() => editEntry(editing.id, { ...record, id: editing.id } as EnergyRecord)))) return;
      toast.show('Cambios guardados');
    } else {
      if (!(await persist(() => addEnergyRecord(record)))) return;
      toast.show(meta.saved);
    }
    router.back();
  };

  const costField = (optional: boolean) => (
    <Field
      label="¿Cuánto pagaste?"
      optional={optional}
      hint={
        optional
          ? 'Si no lo sabes, déjalo vacío: queda como costo desconocido. Escribe 0 si fue gratis.'
          : 'El total que pagaste. ¿No lo sabes? Escribe la cantidad exacta en “Más datos”.'
      }
      error={isHome ? undefined : shown.error}>
      <NumberField
        value={costCop}
        onChange={change(setCostCop)}
        prefix="$"
        invalid={!isHome && !!shown.error}
        accessibilityLabel="Cuánto pagaste"
      />
    </Field>
  );

  const priceField = (optional: boolean) => (
    <Field label={`Precio por ${name}`} optional={optional} hint={priceIsSuggestion ? undefined : 'El que aparece en el surtidor o el cargador.'}>
      <NumberField
        value={unitPriceCop}
        onChange={change(setUnitPriceCop)}
        prefix="$"
        suffix={`/ ${short}`}
        size="md"
        accessibilityLabel={`Precio por ${name}`}
      />
      {priceIsSuggestion && suggestion && (
        <View style={styles.suggestion}>
          <Icon name="history" size={20} color={colors.text.secondary} />
          <View style={styles.flex}>
            <AppText variant="captionStrong" numeric>
              Último precio registrado: {formatCop(suggestion.unitPriceCop)}/{short}
            </AppText>
            <AppText variant="caption" tone="secondary">
              Registrado por ti el {formatLongDate(parseISODate(suggestion.date))}. RODEXA no consulta precios de
              estaciones: cámbialo si pagaste otro.
            </AppText>
          </View>
        </View>
      )}
    </Field>
  );

  const exactField = (
    <Field
      label={kind === 'charge' ? 'Sé los kWh exactos' : 'Sé la cantidad exacta'}
      optional
      hint="Si el surtidor o el cargador marca la cantidad, escríbela: reemplaza la calculada."
      error={shown.exactError}>
      <DecimalField
        value={exactQuantity}
        onChange={change(setExactQuantity)}
        suffix={short}
        placeholder="0"
        invalid={!!shown.exactError}
        accessibilityLabel={`Cantidad exacta en ${unitPlural(kind, unit)}`}
      />
    </Field>
  );

  return (
    <FormScreen
      title={editing ? `Editar ${title.toLowerCase()}` : `Registrar ${title.toLowerCase()}`}
      footer={
        <Button
          label={confirmedWarnings && hasAnyWarning ? 'Sí, guardar' : editing ? 'Guardar cambios' : 'Guardar'}
          fullWidth
          onPress={save}
        />
      }>
      {kind === 'charge' && (
        <View style={styles.chips}>
          <Chip label="Pagué en una estación" selected={mode === 'station'} onPress={() => change(setMode)('station')} />
          <Chip label="Cargué en casa o no sé el costo" selected={mode === 'home'} onPress={() => change(setMode)('home')} />
        </View>
      )}

      {isHome ? (
        <>
          <Field label="¿Cuántos kWh cargaste?" hint="Los que marca el cargador o su app." error={shown.error}>
            <DecimalField
              value={exactQuantity}
              onChange={change(setExactQuantity)}
              suffix="kWh"
              placeholder="0"
              invalid={!!shown.error}
              accessibilityLabel="kWh cargados"
            />
          </Field>
          <View style={styles.suggestion}>
            <Icon name="expense" size={20} color={colors.text.secondary} />
            <AppText variant="caption" tone="secondary" style={styles.flex} numeric>
              {amounts.costCop !== undefined
                ? `Costo: ${formatCop(amounts.costCop)}${amounts.costSource === 'calculated' ? ' (calculado)' : ''}`
                : 'Costo desconocido. Si lo sabes, agrégalo en “Más datos”.'}
            </AppText>
          </View>
        </>
      ) : (
        <>
          {costField(false)}
          {priceField(false)}
          <QuantityResult kind={kind} unit={unit} amounts={amounts} onCorrect={() => setMoreOpen(true)} />
        </>
      )}
      {warnings.quantity && <WarningText text={warnings.quantity} />}
      {shown.warning && <WarningText text={shown.warning} />}

      <RecordKmField
        value={km}
        onChange={change(setKm)}
        unknown={kmUnknown}
        onUnknownChange={change(setKmUnknown)}
        hint={`Tu último registro: ${formatKm(odometer.registeredKm)}. Míralo en el tablero.`}
        error={errors.km}
        warning={warnings.km}
        size="md"
        accessibilityLabel="Kilometraje"
      />

      {FULL_QUESTION[kind] && (
        <Field label={FULL_QUESTION[kind]!.label} hint={FULL_QUESTION[kind]!.hint} info={INFO_FULL[kind]}>
          <View style={styles.chips}>
            <Chip label="Sí" selected={full} onPress={() => change(setFull)(true)} />
            <Chip label="No, fue parcial" selected={!full} onPress={() => change(setFull)(false)} />
          </View>
        </Field>
      )}

      {/* "¿Está bien este dato?" (comparado con tus propios tanqueos). */}
      {submitted && plausibility.map((text) => <WarningText key={text} text={text} />)}

      {kind === 'charge' && (
        <Field
          label="¿Hasta qué % cargaste?"
          optional
          hint="Para calcular el consumo, RODEXA compara cargas que terminan en el mismo % (por ejemplo, siempre hasta 80 %)."
          error={errors.endPercent}>
          <NumberField
            value={endPercent}
            onChange={change(setEndPercent)}
            suffix="%"
            size="md"
            maxDigits={3}
            grouping={false}
            invalid={!!errors.endPercent}
            accessibilityLabel="Porcentaje de batería al terminar"
          />
        </Field>
      )}

      {/* Más datos */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: moreOpen }}
        onPress={() => setMoreOpen(!moreOpen)}
        style={({ pressed }) => [styles.moreToggle, pressed && styles.pressed]}>
        <AppText variant="bodyStrong" tone="brand" style={styles.flex}>
          Más datos
        </AppText>
        <Icon name={moreOpen ? 'expandLess' : 'expandMore'} color={colors.brand.accent} />
      </Pressable>

      {moreOpen && (
        <View style={styles.more}>
          <Field label="Fecha" error={errors.date}>
            <DateField value={date} onChange={change(setDate)} />
          </Field>

          {kind === 'fuel' && (
            <Field label="Unidad" hint="En Colombia el combustible se vende por galón.">
              <View style={styles.chips}>
                {(Object.keys(FUEL_UNIT_LABELS) as FuelUnit[]).map((u) => (
                  <Chip key={u} label={FUEL_UNIT_LABELS[u].plural} selected={unit === u} onPress={() => changeUnit(u)} />
                ))}
              </View>
            </Field>
          )}

          {isHome ? (
            <>
              {costField(true)}
              {priceField(true)}
            </>
          ) : (
            exactField
          )}

          {kind === 'charge' && (
            <>
              <Field label="Batería al empezar" optional error={errors.startPercent}>
                <NumberField
                  value={startPercent}
                  onChange={change(setStartPercent)}
                  suffix="%"
                  size="md"
                  maxDigits={3}
                  grouping={false}
                  invalid={!!errors.startPercent}
                  accessibilityLabel="Porcentaje de batería al empezar"
                />
              </Field>
              {estimate && (
                <Card>
                  <AppText variant="bodyStrong">≈ {formatDecimal(estimate.kwh, 1)} kWh estimados</AppText>
                  <AppText variant="caption" tone="secondary">
                    Estimado con la capacidad de batería que registraste y los %. Es solo una referencia: no
                    reemplaza los kWh que marca el cargador.
                  </AppText>
                </Card>
              )}
              <Field label="Tipo de carga" optional>
                <View style={styles.chips}>
                  {CHARGE_TYPE_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      label={o.label}
                      selected={chargeType === o.value}
                      onPress={() => setChargeType(chargeType === o.value ? undefined : o.value)}
                    />
                  ))}
                </View>
              </Field>
            </>
          )}

          <Field label={kind === 'charge' ? 'Lugar de carga' : 'Estación'} optional>
            <TextField
              value={place}
              onChange={setPlace}
              placeholder={kind === 'charge' ? 'Casa, trabajo, electrolinera…' : 'Nombre de la estación'}
              autoCapitalize="words"
              accessibilityLabel={kind === 'charge' ? 'Lugar de carga' : 'Estación'}
            />
          </Field>

          <Field label="Nota" optional>
            <TextField value={note} onChange={setNote} multiline placeholder="Cualquier detalle" accessibilityLabel="Nota" />
          </Field>
        </View>
      )}
    </FormScreen>
  );
}

type QuantityResultProps = {
  kind: EnergyKind;
  unit: FuelUnit;
  amounts: ReturnType<typeof resolveEnergyAmounts>;
  onCorrect: () => void;
};

/** La cantidad: bien visible, porque es la base del consumo y de las estadísticas. */
function QuantityResult({ kind, unit, amounts, onCorrect }: QuantityResultProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const plural = unitPlural(kind, unit);
  const name = unitName(kind, unit);
  const icon = ENERGY_META[kind].icon;

  if (amounts.quantity === undefined) {
    return (
      <View style={[styles.result, styles.resultEmpty]}>
        <Icon name={icon} color={colors.text.muted} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          Escribe lo que pagaste y el precio: RODEXA calcula cuántos {plural} cargaste.
        </AppText>
      </View>
    );
  }

  const exact = amounts.quantitySource === 'exact';
  return (
    <View style={styles.result} accessible accessibilityLabel={`${exact ? '' : 'Aproximadamente '}${formatDecimal(amounts.quantity, 2)} ${plural}`}>
      <View style={styles.resultHeader}>
        <Icon name={icon} color={colors.brand.accent} />
        <AppText variant="captionStrong" tone="brand">
          {exact ? 'CANTIDAD EXACTA QUE ESCRIBISTE' : 'RODEXA CALCULÓ'}
        </AppText>
      </View>
      <View style={styles.resultValue}>
        <AppText variant="display" numeric>
          {exact ? '' : '≈ '}
          {formatDecimal(amounts.quantity, 2)}
        </AppText>
        <AppText variant="heading">{plural}</AppText>
      </View>
      {!exact && amounts.costCop !== undefined && amounts.unitPriceCop !== undefined && (
        <AppText variant="caption" tone="secondary" numeric>
          {formatCop(amounts.costCop)} ÷ {formatCop(amounts.unitPriceCop)} por {name}
        </AppText>
      )}
      {exact && amounts.priceSource === 'calculated' && amounts.unitPriceCop !== undefined && (
        <AppText variant="caption" tone="secondary" numeric>
          Precio pagado: {formatCop(amounts.unitPriceCop)} por {name} (calculado)
        </AppText>
      )}
      {exact && amounts.costSource === 'calculated' && amounts.costCop !== undefined && (
        <AppText variant="caption" tone="secondary" numeric>
          Total: {formatCop(amounts.costCop)} (calculado con la cantidad y el precio)
        </AppText>
      )}
      {exact && amounts.costCop === undefined && (
        <AppText variant="caption" tone="secondary">
          Costo desconocido (no se cuenta como $0).
        </AppText>
      )}
      <AppText variant="caption" tone="secondary">
        Esta cantidad se usa para calcular tu consumo y tus estadísticas.
      </AppText>
      {!exact && (
        <Pressable accessibilityRole="button" onPress={onCorrect} hitSlop={8}>
          <AppText variant="captionStrong" tone="brand">
            ¿Sabes la cantidad exacta? Corrígela en “Más datos”
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

function WarningText({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.suggestion}>
      <Icon name="warning" size={20} color={colors.status.soon.color} />
      <AppText variant="caption" color={colors.status.soon.color} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  result: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.brand.accent,
    backgroundColor: colors.brand.soft,
  },
  resultEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.brand.soft,
  },
  more: {
    gap: spacing.lg,
  },
}));
