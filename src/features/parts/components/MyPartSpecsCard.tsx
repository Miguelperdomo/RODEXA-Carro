import { useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Field, Icon, InfoRow, TextField, useToast } from '@/shared/ui';

import { FICHA_FIELD_FOR_PART, partSpecs } from '../userSpecs';

/**
 * "Lo que usa mi carro" para un repuesto: el usuario anota sus datos (con ejemplos de
 * formato) y quedan guardados en la ficha del carro, en el celular.
 */
export function MyPartSpecsCard({ code }: { code: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { carSheet, updateCarSheet } = useSession();
  const specs = partSpecs(code, carSheet);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const filled = specs.filter((s) => s.value).length;
  const ficha = FICHA_FIELD_FOR_PART[code];
  const fichaValue = ficha ? carSheet[ficha.key] : undefined;

  const startEditing = () => {
    setDraft(Object.fromEntries(specs.map((s) => [s.key, s.value ?? ''])));
    setEditing(true);
  };

  const save = async () => {
    // updateCarSheet descarta los vacíos: borrar un dato lo quita de la ficha.
    if (!(await persist(() => updateCarSheet({ ...carSheet, ...draft })))) return;
    toast.show('Guardado en la ficha de tu carro');
    setEditing(false);
  };

  return (
    <Card style={styles.card}>
      {editing ? (
        <>
          {specs.map((s) => (
            <Field key={s.key} label={s.field} optional>
              <TextField
                value={draft[s.key] ?? ''}
                onChange={(text) => setDraft({ ...draft, [s.key]: text })}
                placeholder={s.placeholder}
                maxLength={80}
                accessibilityLabel={s.field}
              />
            </Field>
          ))}
          <AppText variant="caption" tone="muted">
            Los ejemplos son solo guía de formato. Escribe lo que dice tu manual, la pieza o tu mecánico.
          </AppText>
          <View style={styles.actions}>
            <Button label="Guardar" fullWidth onPress={save} />
            <Button label="Cancelar" variant="ghost" fullWidth onPress={() => setEditing(false)} />
          </View>
        </>
      ) : (
        <>
          {specs.map((s, i) => (
            <InfoRow key={s.key} label={s.field} value={s.value} divider={i > 0} />
          ))}
          {fichaValue && (
            <View style={styles.ficha}>
              <Icon name="note" size={18} color={colors.text.secondary} />
              <AppText variant="caption" tone="secondary" style={styles.flex}>
                En tu ficha anotaste ({ficha!.label.toLowerCase()}): {fichaValue}
              </AppText>
            </View>
          )}
          <Button
            label={filled > 0 ? 'Editar lo que usa mi carro' : 'Anotar lo que usa mi carro'}
            icon="note"
            variant="secondary"
            fullWidth
            onPress={startEditing}
          />
        </>
      )}
    </Card>
  );
}

const useStyles = createStyles(() => ({
  card: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  ficha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flex: {
    flex: 1,
  },
}));
