import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { sheetGroupsFor, type SheetKey } from '@/features/cars/sheet';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import type { CarSheet } from '@/features/session/types';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Button, Field, FormScreen, SectionHeader, TextField, useToast } from '@/shared/ui';

/** Editar los datos que el usuario anota en la ficha (se guardan en el celular). */
export default function EditCarSheetScreen() {
  const styles = useStyles();
  const { profile } = useAppData();
  const { carSheet, updateCarSheet } = useSession();
  const persist = usePersist();
  const toast = useToast();
  const [sheet, setSheet] = useState<CarSheet>(carSheet);
  // Mismos campos que la vista (sin los que no aplican a este vehículo).
  const [groups] = useState(() => sheetGroupsFor(profile, carSheet));

  const set = (key: SheetKey) => (value: string) => setSheet((s) => ({ ...s, [key]: value }));

  const save = async () => {
    if (!(await persist(() => updateCarSheet(sheet)))) return;
    toast.show('Ficha guardada');
    router.back();
  };

  return (
    <FormScreen title="Mis datos del carro" closeIcon="back" footer={<Button label="Guardar" fullWidth onPress={save} />}>
      <AppText tone="secondary">Todo es opcional y lo escribes tú. RODEXA no completa ni verifica estos datos.</AppText>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <SectionHeader title={group.title} />
          {group.fields.map((field) => (
            <Field key={field.key} label={field.label} optional>
              <TextField
                value={sheet[field.key] ?? ''}
                onChange={set(field.key)}
                placeholder={field.placeholder}
                multiline={field.multiline}
                autoCapitalize={field.uppercase ? 'characters' : 'sentences'}
                accessibilityLabel={field.label}
              />
            </Field>
          ))}
        </View>
      ))}
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  group: {
    gap: spacing.md,
  },
}));
