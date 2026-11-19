import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { hasPlace, levelLabel, sinceLabel, type ParkingInput } from '@/features/parking/parking';
import { parkHere, pickedUp, useParking, validParkingPhoto } from '@/features/parking/useParking';
import { takePhoto } from '@/features/photos/pick';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Chip, Field, FormScreen, Icon, TextField, useToast } from '@/shared/ui';

/** Atajos comunes: en Colombia los parqueaderos usan sótanos, pisos y letras. */
const LEVELS = ['Sótano 2', 'Sótano 1', '1', '2', '3', '4'];
const ZONES = ['A', 'B', 'C', 'D', 'E'];

/**
 * "¿Dónde lo parqueé?": anotas el piso, la zona y el puesto (y si quieres, una foto del lugar)
 * al dejar el carro y al volver lo ves de una. Sin GPS. "Ya lo recogí" lo borra.
 */
export default function ParkingScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const saved = useParking();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ParkingInput>({});
  const [saving, setSaving] = useState(false);
  // Foto del lugar: undefined = se deja la que había, null = se quita, texto = una nueva.
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const savedPhoto = validParkingPhoto(saved?.photoUri);

  const showForm = editing || !saved;
  const set = (changes: Partial<ParkingInput>) => setForm((f) => ({ ...f, ...changes }));
  const toggle = (key: 'level' | 'zone', value: string) => set({ [key]: form[key] === value ? undefined : value });

  const startEdit = () => {
    setForm(saved ? { level: saved.level, zone: saved.zone, spot: saved.spot, note: saved.note } : {});
    setPhoto(undefined);
    setEditing(true);
  };

  const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  const input: ParkingInput = {
    level: clean(form.level),
    zone: clean(form.zone)?.toUpperCase(),
    spot: clean(form.spot),
    note: clean(form.note),
  };
  // La foto que se ve en el formulario: la nueva, o la que ya estaba (al cambiar el lugar).
  const formPhoto = photo === undefined ? (editing ? savedPhoto : undefined) : (photo ?? undefined);
  const canSave = hasPlace(input) || !!formPhoto;

  const addPhoto = async () => {
    const uri = await takePhoto('Para tomarle una foto al lugar,', { quality: 0.6 });
    if (uri) setPhoto(uri);
  };

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // undefined deja la foto de antes; null la quita; una ruta guarda la nueva.
      if (!(await parkHere(input, photo))) throw new Error('no guardado');
      setEditing(false);
      setPhoto(undefined);
      toast.show('Guardamos dónde dejaste tu carro');
    } catch {
      toast.show('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const collected = () => {
    void pickedUp();
    setEditing(false);
    setForm({});
    setPhoto(undefined);
    toast.show('Lugar borrado. Buen viaje.');
  };

  return (
    <FormScreen
      title="¿Dónde lo parqueé?"
      closeIcon="back"
      footer={
        showForm ? (
          <Button label={saving ? 'Guardando…' : 'Guardar dónde lo dejé'} fullWidth onPress={save} />
        ) : (
          <View style={styles.footer}>
            <Button label="Ya lo recogí" icon="check" fullWidth onPress={collected} />
            <Button label="Cambiar el lugar" variant="ghost" fullWidth onPress={startEdit} />
          </View>
        )
      }>
      {saved && !editing ? (
        <Card tone="highlight">
          <AppText variant="captionStrong" tone="brand">
            TU CARRO ESTÁ EN
          </AppText>
          <View style={styles.big}>
            {saved.level && <BigTile label="Piso" value={levelLabel(saved.level).replace(/^Piso /, '')} />}
            {saved.zone && <BigTile label="Zona" value={saved.zone} />}
            {saved.spot && <BigTile label="Puesto" value={saved.spot} />}
          </View>
          {saved.note && (
            <View style={styles.noteRow}>
              <Icon name="location" size={18} color={colors.brand.accent} />
              <AppText variant="bodyStrong" style={styles.flex}>
                {saved.note}
              </AppText>
            </View>
          )}
          {savedPhoto && (
            <Image source={{ uri: savedPhoto }} style={styles.photo} contentFit="cover" accessibilityLabel="Foto del lugar donde dejaste el carro" />
          )}
          <AppText variant="caption" tone="secondary">
            Lo dejaste {sinceLabel(saved.at, new Date())}.
          </AppText>
        </Card>
      ) : (
        <>
          <AppText tone="secondary">
            Anótalo al dejar el carro y al volver lo ves de una. Llena solo lo que te sirva. No usamos tu ubicación.
          </AppText>

          <Field label="Piso o nivel" optional>
            <View style={styles.chips}>
              {LEVELS.map((l) => (
                <Chip key={l} label={levelLabel(l)} selected={form.level === l} onPress={() => toggle('level', l)} />
              ))}
            </View>
            <TextField
              value={form.level && !LEVELS.includes(form.level) ? form.level : ''}
              onChange={(v) => set({ level: v })}
              placeholder="Otro: 5, Sótano 3, Nivel -1…"
              maxLength={20}
              accessibilityLabel="Otro piso o nivel"
            />
          </Field>

          <Field label="Zona o letra" optional>
            <View style={styles.chips}>
              {ZONES.map((z) => (
                <Chip key={z} label={z} selected={form.zone === z} onPress={() => toggle('zone', z)} />
              ))}
            </View>
          </Field>

          <Field label="Número del puesto" optional>
            <TextField
              value={form.spot ?? ''}
              onChange={(v) => set({ spot: v.replace(/[^0-9A-Za-z-]/g, '') })}
              placeholder="Ej.: 45"
              maxLength={6}
              accessibilityLabel="Número del puesto"
            />
          </Field>

          <Field label="Nota" optional>
            <TextField
              value={form.note ?? ''}
              onChange={(v) => set({ note: v })}
              placeholder="Ej.: Unicentro, entrada norte, al lado del ascensor"
              maxLength={120}
              accessibilityLabel="Nota del lugar"
            />
          </Field>

          <Field label="Foto del lugar" optional hint="Del letrero del piso o de la columna. Se guarda solo en tu celular.">
            {formPhoto ? (
              <View style={styles.photoRow}>
                <Image source={{ uri: formPhoto }} style={styles.thumb} contentFit="cover" accessibilityLabel="Foto del lugar" />
                <Button label="Quitar" variant="ghost" onPress={() => setPhoto(null)} />
              </View>
            ) : (
              <Button label="Tomar foto" icon="camera" variant="secondary" onPress={() => void addPhoto()} />
            )}
          </Field>

          {!canSave && (
            <View style={styles.hint}>
              <Icon name="info" size={18} color={colors.text.muted} />
              <AppText variant="caption" tone="muted" style={styles.flex}>
                Llena al menos una cosa: piso, zona, puesto, nota o foto.
              </AppText>
            </View>
          )}
        </>
      )}
    </FormScreen>
  );
}

function BigTile({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.tile}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      <AppText variant="display" numeric>
        {value}
      </AppText>
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
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
  },
  big: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  tile: {
    flexGrow: 1,
    minWidth: 90,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
}));
