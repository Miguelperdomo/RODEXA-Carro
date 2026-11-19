import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CarSelector } from '@/features/catalogs/components/CarSelector';
import { CityPicker } from '@/features/catalogs/components/CityPicker';
import { profileToSelection, selectionToProfile } from '@/features/catalogs/selection';
import type { BodyType, DrivetrainType, TimingSystem, TransmissionType, UsageType } from '@/features/cars/types';
import { USAGE_OPTIONS } from '@/features/cars/usage';
import { validateProfile, validateVehicleDetails } from '@/features/cars/validation';
import {
  BODY_OPTIONS,
  DRIVETRAIN_OPTIONS,
  profileFieldApplies,
  TIMING_OPTIONS,
  TRANSMISSION_OPTIONS,
  type VehicleOption,
} from '@/features/cars/vehicleOptions';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { useT } from '@/i18n';
import { spacing } from '@/shared/theme';
import { Button, Chip, DecimalField, Field, FormScreen, TextField, useToast } from '@/shared/ui';
import { hasErrors } from '@/shared/utils/validation';

/** Opciones en chips; tocar la elegida otra vez la quita (todos estos datos son opcionales). */
function OptionChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: VehicleOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(value === option.value ? undefined : option.value)}
        />
      ))}
    </View>
  );
}

export default function EditCarScreen() {
  const { profile } = useAppData();
  const [car, setCar] = useState(() => profileToSelection(profile));
  const [variantName, setVariantName] = useState(profile.variantName ?? '');
  const [bodyType, setBodyType] = useState<BodyType | undefined>(profile.bodyType);
  const [transmission, setTransmission] = useState<TransmissionType | undefined>(profile.transmission);
  const [drivetrain, setDrivetrain] = useState<DrivetrainType | undefined>(profile.drivetrain);
  const [timingSystem, setTimingSystem] = useState<TimingSystem | undefined>(profile.timingSystem);
  const [tankCapacity, setTankCapacity] = useState<number | null>(profile.tankCapacityLiters ?? null);
  const [batteryCapacity, setBatteryCapacity] = useState<number | null>(profile.batteryCapacityKwh ?? null);
  const [plate, setPlate] = useState(profile.plate ?? '');
  const [plateCityId, setPlateCityId] = useState<string | null>(profile.plateCityId ?? null);
  const [serviceType, setServiceType] = useState<'private' | 'public'>(profile.serviceType ?? 'private');
  const [nickname, setNickname] = useState(profile.nickname ?? '');
  const [usageType, setUsageType] = useState<UsageType | undefined>(profile.usageType);
  const [submitted, setSubmitted] = useState(false);
  const { updateCar } = useSession();
  const persist = usePersist();
  const toast = useToast();
  const t = useT();

  // Qué preguntas aplican sale de las reglas del vehículo, no de condiciones en la pantalla.
  const energy = { energySource: car.energySource ?? undefined };
  const applies = {
    transmission: profileFieldApplies('transmission', energy),
    timingSystem: profileFieldApplies('timingSystem', energy),
    tankCapacityLiters: profileFieldApplies('tankCapacityLiters', energy),
    batteryCapacityKwh: profileFieldApplies('batteryCapacityKwh', energy),
  };

  const validation = {
    ...validateProfile(car, plate),
    ...validateVehicleDetails({
      tankCapacityLiters: applies.tankCapacityLiters ? tankCapacity : null,
      batteryCapacityKwh: applies.batteryCapacityKwh ? batteryCapacity : null,
    }),
  };
  const errors = submitted ? validation : {};

  // Guarda en el teléfono; el mensaje de éxito solo aparece si la escritura terminó bien.
  // Lo que no aplica al combustible elegido se borra (p. ej. la caja de un eléctrico).
  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors(validation)) return;
    const changes = {
      ...selectionToProfile(car),
      variantName: variantName.trim() || undefined,
      bodyType,
      transmission: applies.transmission ? transmission : undefined,
      drivetrain,
      timingSystem: applies.timingSystem ? timingSystem : undefined,
      tankCapacityLiters: applies.tankCapacityLiters ? (tankCapacity ?? undefined) : undefined,
      batteryCapacityKwh: applies.batteryCapacityKwh ? (batteryCapacity ?? undefined) : undefined,
      plate: plate || undefined,
      plateCityId: plate && plateCityId ? plateCityId : undefined,
      serviceType: serviceType === 'public' ? ('public' as const) : undefined,
      nickname: nickname.trim() || undefined,
      usageType,
    };
    if (!(await persist(() => updateCar(changes)))) return;
    toast.show(t('toast.carUpdated'));
    router.back();
  };

  return (
    <FormScreen
      title="Editar mi carro"
      footer={<Button label="Guardar cambios" fullWidth onPress={handleSave} />}>
      <Field label="Apodo de tu carro" optional hint="Como le dices a tu carro. Aparece en Inicio.">
        <TextField
          value={nickname}
          onChange={setNickname}
          placeholder="Ej.: La Negra, El Rayo"
          maxLength={30}
          autoCapitalize="words"
          accessibilityLabel="Apodo de tu carro"
        />
      </Field>

      <CarSelector value={car} onChange={setCar} errors={errors} />

      <Field label="Versión" optional hint="Como aparece en tus documentos o en el carro (p. ej. LTZ, 1.6 AT).">
        <TextField
          value={variantName}
          onChange={setVariantName}
          placeholder="Versión o línea"
          accessibilityLabel="Versión"
        />
      </Field>

      <Field label="Tipo de carro" optional>
        <OptionChips options={BODY_OPTIONS} value={bodyType} onChange={setBodyType} />
      </Field>

      {applies.transmission && (
        <Field label="Transmisión" optional>
          <OptionChips options={TRANSMISSION_OPTIONS} value={transmission} onChange={setTransmission} />
        </Field>
      )}

      <Field label="Tracción" optional>
        <OptionChips options={DRIVETRAIN_OPTIONS} value={drivetrain} onChange={setDrivetrain} />
      </Field>

      {applies.timingSystem && (
        <Field
          label="Distribución del motor"
          optional
          hint="Lo indica el manual de tu carro. Si no lo sabes, elige “No sé”.">
          <OptionChips options={TIMING_OPTIONS} value={timingSystem} onChange={setTimingSystem} />
        </Field>
      )}

      {applies.tankCapacityLiters && (
        <Field
          label="Capacidad del tanque"
          optional
          hint="Según el manual de tu carro. Nos ayuda a detectar errores al registrar una carga de combustible."
          error={errors.tankCapacityLiters}>
          <DecimalField
            value={tankCapacity}
            onChange={setTankCapacity}
            suffix="L"
            placeholder="Sin registrar"
            decimals={1}
            invalid={!!errors.tankCapacityLiters}
            accessibilityLabel="Capacidad del tanque en litros"
          />
        </Field>
      )}

      {applies.batteryCapacityKwh && (
        <Field
          label="Capacidad de la batería"
          optional
          hint="Capacidad útil en kWh según el manual o la ficha técnica de tu carro."
          error={errors.batteryCapacityKwh}>
          <DecimalField
            value={batteryCapacity}
            onChange={setBatteryCapacity}
            suffix="kWh"
            placeholder="Sin registrar"
            decimals={1}
            invalid={!!errors.batteryCapacityKwh}
            accessibilityLabel="Capacidad de la batería en kWh"
          />
        </Field>
      )}

      <Field
        label="Placa"
        optional
        hint="Solo para identificar tu carro. RODEXA Carro no consulta el RUNT."
        error={errors.plate}>
        <TextField
          value={plate}
          onChange={(text) => setPlate(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="ABC123"
          autoCapitalize="characters"
          maxLength={6}
          invalid={!!errors.plate}
          accessibilityLabel="Placa"
        />
      </Field>

      <Field label="Servicio" hint="Define el color de la placa: amarilla si es particular, blanca si es de servicio público.">
        <View style={styles.chips}>
          <Chip label="Particular" selected={serviceType === 'private'} onPress={() => setServiceType('private')} />
          <Chip label="Servicio público" selected={serviceType === 'public'} onPress={() => setServiceType('public')} />
        </View>
      </Field>

      {/* La ciudad de matrícula va debajo de la placa en Inicio (sin ella, la de tu perfil). */}
      {plate !== '' && (
        <CityPicker
          value={plateCityId}
          onChange={setPlateCityId}
          departmentLabel="Departamento de la placa"
          cityLabel="Ciudad de la placa"
          cityHint="Donde está matriculado tu carro. Si no la eliges, usamos la ciudad de tu perfil."
        />
      )}

      <Field label="Uso principal" optional>
        <View style={styles.chips}>
          {USAGE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={usageType === option.value}
              onPress={() => setUsageType(option.value)}
            />
          ))}
        </View>
      </Field>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
