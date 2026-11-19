import { router } from 'expo-router';
import { useState } from 'react';

import { CityPicker } from '@/features/catalogs/components/CityPicker';
import { findCity } from '@/features/catalogs/repository';
import { OTHER_CITY_ID } from '@/features/catalogs/types';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { useT } from '@/i18n';
import { Button, Field, FormScreen, TextField, useToast } from '@/shared/ui';

/** Editar nombre y ciudad (ciudad desde el catálogo existente, nunca texto libre). */
export default function EditProfileScreen() {
  const t = useT();
  const toast = useToast();
  const { user } = useAppData();
  const { updateUser } = useSession();
  const persist = usePersist();
  const [name, setName] = useState(user.name ?? '');
  const [cityId, setCityId] = useState<string | null>(user.cityId ?? null);
  const [submitted, setSubmitted] = useState(false);

  const nameError = name.trim() === '' ? t('profile.nameRequired') : undefined;

  const save = async () => {
    setSubmitted(true);
    if (nameError) return;
    const changes = {
      name: name.trim(),
      cityId: cityId ?? undefined,
      city: cityId === OTHER_CITY_ID ? 'Otro municipio' : findCity(cityId)?.name,
    };
    // Éxito solo cuando quedó guardado en el teléfono.
    if (!(await persist(() => updateUser(changes)))) return;
    toast.show(t('toast.profileUpdated'));
    router.back();
  };

  return (
    <FormScreen
      title={t('profile.edit')}
      footer={<Button label={t('common.save')} fullWidth onPress={save} />}>
      <Field label={t('profile.name')} error={submitted ? nameError : undefined}>
        <TextField
          value={name}
          onChange={setName}
          placeholder={t('profile.name')}
          autoCapitalize="words"
          maxLength={40}
          invalid={submitted && !!nameError}
          accessibilityLabel={t('profile.name')}
        />
      </Field>
      <CityPicker value={cityId} onChange={setCityId} />
    </FormScreen>
  );
}
