import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CityPicker } from '@/features/catalogs/components/CityPicker';
import {
  BUSINESS_AUTHORIZATION,
  BUSINESS_KINDS,
  businessDraft,
  EMPTY_BUSINESS,
  hasAddress,
  PAYMENT_OPTIONS,
  servicesFor,
  validateBusiness,
  VEHICLE_TYPES,
  type BusinessInput,
  type BusinessKind,
} from '@/features/help/business';
import { openEmailDraft } from '@/features/help/email';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Chip, Field, FormScreen, Icon, TextField, useToast } from '@/shared/ui';

/**
 * "¿Ofreces un servicio para carros?": formulario para inscribir un taller físico o un servicio
 * a domicilio. Al final abre la app de correo con todo listo; la persona lo revisa y lo envía.
 */
export default function RegisterBusinessScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [form, setForm] = useState<BusinessInput>(EMPTY_BUSINESS);
  const [submitted, setSubmitted] = useState(false);
  const errors = validateBusiness(form);
  const shown = submitted ? errors : {};
  const workshop = form.kind === 'workshop';
  const cda = form.kind === 'cda';

  const set = (changes: Partial<BusinessInput>) => setForm((f) => ({ ...f, ...changes }));
  const toggle = (key: 'services' | 'vehicles' | 'payments', value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
  const chooseKind = (kind: BusinessKind) => set({ kind });

  const send = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      toast.show('Revisa los campos marcados');
      return;
    }
    if (await openEmailDraft(businessDraft(form), () => toast.show('Correo copiado'))) router.back();
  };

  return (
    <FormScreen
      title="Inscribe tu servicio"
      closeIcon="back"
      footer={<Button label="Preparar correo" icon="contact" fullWidth onPress={send} />}>
      <AppText tone="secondary">
        Llena los datos y se abre tu correo con todo listo para enviarlo. Revisamos cada inscripción antes de publicarla.
      </AppText>

      <Field label="¿Qué ofreces?">
        <View style={styles.kinds} accessibilityRole="radiogroup">
          {BUSINESS_KINDS.map((k) => {
            const selected = k.value === form.kind;
            return (
              <Pressable
                key={k.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${k.label}: ${k.description}`}
                onPress={() => chooseKind(k.value)}
                style={({ pressed }) => [styles.kind, selected && styles.kindSelected, pressed && styles.pressed]}>
                <Icon
                  name={k.value === 'workshop' ? 'workshop' : k.value === 'cda' ? 'inspection' : 'location'}
                  color={selected ? colors.brand.accent : colors.text.secondary}
                />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{k.label}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {k.description}
                  </AppText>
                </View>
                <Icon name={selected ? 'checked' : 'unchecked'} color={selected ? colors.brand.accent : colors.text.muted} />
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label={workshop ? 'Nombre del taller' : cda ? 'Nombre del CDA' : 'Tu nombre o el de tu servicio'} error={shown.name}>
        <TextField
          value={form.name}
          onChange={(name) => set({ name })}
          placeholder={workshop ? 'Ej.: Taller de don Jorge' : cda ? 'Ej.: CDA del Centro' : 'Ej.: Jorge Pérez, mecánico a domicilio'}
          maxLength={80}
          accessibilityLabel="Nombre"
        />
      </Field>

      <CityPicker value={form.cityId} onChange={(cityId) => set({ cityId })} optional={false} cityHint="Donde está el negocio o desde donde prestas el servicio." />
      {shown.city && (
        <AppText variant="caption" color={colors.status.due.color}>
          {shown.city}
        </AppText>
      )}

      {hasAddress(form.kind) ? (
        <Field label={cda ? 'Dirección del CDA' : 'Dirección del taller'} error={shown.address}>
          <TextField value={form.address} onChange={(address) => set({ address })} placeholder="Ej.: Calle 10 # 5-20, barrio Centro" maxLength={120} accessibilityLabel="Dirección" />
        </Field>
      ) : (
        <Field label="Zonas que cubres" error={shown.coverage} hint="Barrios, sectores o municipios cercanos a los que vas.">
          <TextField value={form.coverage} onChange={(coverage) => set({ coverage })} placeholder="Ej.: Toda la ciudad y municipios cercanos" maxLength={160} accessibilityLabel="Zonas que cubres" />
        </Field>
      )}

      <Field label="Teléfono o WhatsApp" error={shown.phone}>
        <TextField value={form.phone} onChange={(phone) => set({ phone })} placeholder="Ej.: 300 123 4567" keyboardType="phone-pad" maxLength={20} accessibilityLabel="Teléfono o WhatsApp" />
      </Field>

      <Field label="Servicios" error={shown.services}>
        <View style={styles.chips}>
          {servicesFor(form.kind).map((s) => (
            <Chip key={s} label={s} selected={form.services.includes(s)} onPress={() => toggle('services', s)} />
          ))}
        </View>
      </Field>

      <Field label="Tipos de carro que atiendes" optional>
        <View style={styles.chips}>
          {VEHICLE_TYPES.map((v) => (
            <Chip key={v} label={v} selected={form.vehicles.includes(v)} onPress={() => toggle('vehicles', v)} />
          ))}
        </View>
      </Field>

      <Field label="Medios de pago" optional>
        <View style={styles.chips}>
          {PAYMENT_OPTIONS.map((p) => (
            <Chip key={p} label={p} selected={form.payments.includes(p)} onPress={() => toggle('payments', p)} />
          ))}
        </View>
      </Field>

      <Field label="Persona de contacto" optional>
        <TextField value={form.contactPerson} onChange={(contactPerson) => set({ contactPerson })} maxLength={80} accessibilityLabel="Persona de contacto" />
      </Field>
      <Field label="Correo" optional>
        <TextField value={form.email} onChange={(email) => set({ email })} placeholder="Ej.: taller@correo.com" maxLength={100} accessibilityLabel="Correo" />
      </Field>
      <Field label="Horario de atención" optional>
        <TextField value={form.schedule} onChange={(schedule) => set({ schedule })} placeholder="Ej.: Lunes a sábado, 8 a. m. a 6 p. m." maxLength={100} accessibilityLabel="Horario" />
      </Field>
      <Field label="Página web o redes sociales" optional>
        <TextField value={form.social} onChange={(social) => set({ social })} maxLength={120} accessibilityLabel="Página web o redes sociales" />
      </Field>
      <Field label="Comentarios" optional>
        <TextField value={form.comments} onChange={(comments) => set({ comments })} multiline maxLength={500} accessibilityLabel="Comentarios" />
      </Field>

      <View style={styles.hint}>
        <Icon name="info" size={18} color={colors.brand.accent} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          Estos datos no se guardan en la app: solo van en el correo que tú envías. Al final del correo va esta
          autorización: «{BUSINESS_AUTHORIZATION}»
        </AppText>
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  kinds: {
    gap: spacing.sm,
  },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  kindSelected: {
    borderColor: colors.brand.accent,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
  },
}));
