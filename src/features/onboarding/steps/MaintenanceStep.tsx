import { View } from 'react-native';

import { RecordKmField } from '@/features/odometer/components/RecordKmField';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import {
  AppText,
  Card,
  Chip,
  DateField,
  Field,
  Icon,
  NumberField,
  OptionGrid,
  TextField,
} from '@/shared/ui';
import { today } from '@/shared/utils/date';

import { recentOptionsFor, type RecentEntry, type RecentOption, type TireChoice } from '../form';
import type { StepProps } from './types';

const TIRE_CHOICES: { value: TireChoice; label: string }[] = [
  { value: 'front', label: 'Delanteras' },
  { value: 'rear', label: 'Traseras' },
  { value: 'both', label: 'Las cuatro' },
];

/** Paso 4 — Mantenimientos recientes. Todo es opcional. */
export function MaintenanceStep({ form, update, errors }: StepProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  // Solo lo que aplica al vehículo elegido en el paso anterior.
  const options = recentOptionsFor(form.car);
  const selected = Object.keys(form.recent) as RecentOption[];

  const toggle = (option: RecentOption) => {
    const next = { ...form.recent };
    if (next[option]) {
      delete next[option];
    } else {
      next[option] = { date: today(), km: form.km, kmUnknown: false, cost: null, tires: null, description: '' };
    }
    update({ recent: next });
  };

  const updateEntry = (option: RecentOption, changes: Partial<RecentEntry>) => {
    const current = form.recent[option];
    if (!current) return;
    update({ recent: { ...form.recent, [option]: { ...current, ...changes } } });
  };

  return (
    <>
      <Field label="Elige lo que le hiciste" hint="Es opcional. Puedes elegir varios o seguir sin elegir.">
        <OptionGrid options={options} selected={selected} onToggle={toggle} columns={3} />
      </Field>

      {options.filter((o) => form.recent[o.value]).map((option) => {
        const entry = form.recent[option.value]!;
        return (
          <Card key={option.value}>
            <View style={styles.header}>
              <View style={styles.icon}>
                <Icon name={option.icon} size={sizes.iconMd} color={colors.brand.accent} />
              </View>
              <AppText variant="bodyStrong">{option.label}</AppText>
            </View>

            <View style={styles.fields}>
              {option.value === 'tires' && (
                <Field label="¿Cuál llanta?" error={errors['tires.tires']}>
                  <View style={styles.chips}>
                    {TIRE_CHOICES.map((choice) => (
                      <Chip
                        key={choice.value}
                        label={choice.label}
                        selected={entry.tires === choice.value}
                        onPress={() => updateEntry('tires', { tires: choice.value })}
                      />
                    ))}
                  </View>
                </Field>
              )}

              {option.value === 'other' && (
                <Field label="¿Qué se hizo?" error={errors['other.description']}>
                  <TextField
                    value={entry.description}
                    onChange={(description) => updateEntry('other', { description })}
                    placeholder="Ej.: cambio de bombillo"
                    accessibilityLabel="Descripción"
                  />
                </Field>
              )}

              <Field label="Fecha">
                <DateField value={entry.date} onChange={(date) => updateEntry(option.value, { date })} />
              </Field>

              <RecordKmField
                value={entry.km}
                onChange={(km) => updateEntry(option.value, { km })}
                unknown={entry.kmUnknown}
                onUnknownChange={(kmUnknown) => updateEntry(option.value, { kmUnknown })}
                error={errors[`${option.value}.km`]}
                size="md"
                accessibilityLabel={`Kilometraje de ${option.label}`}
              />

              <Field label="Costo" optional>
                <NumberField
                  value={entry.cost}
                  onChange={(cost) => updateEntry(option.value, { cost })}
                  prefix="$"
                  size="md"
                  accessibilityLabel={`Costo de ${option.label}`}
                />
              </Field>
            </View>
          </Card>
        );
      })}
    </>
  );
}

const useStyles = createStyles((colors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
}));
