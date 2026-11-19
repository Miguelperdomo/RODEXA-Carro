import { router } from 'expo-router';

import { findCity } from '@/features/catalogs/repository';
import { useAppData } from '@/features/session/SessionProvider';
import { useT } from '@/i18n';
import { AppText, Button, Card, FormScreen, InfoRow } from '@/shared/ui';

export default function ProfileScreen() {
  const t = useT();
  const { user } = useAppData();
  const city = findCity(user.cityId);

  return (
    <FormScreen
      title={t('profile.title')}
      closeIcon="back"
      footer={
        <Button
          label={t('profile.edit')}
          icon="note"
          fullWidth
          onPress={() => router.push('/configuracion/editar-perfil')}
        />
      }>
      <Card>
        <InfoRow label={t('profile.name')} value={user.name} />
        <InfoRow
          label={t('profile.city')}
          value={city ? (city.name === city.department ? city.name : `${city.name} · ${city.department}`) : user.city}
          divider
        />
      </Card>
      <AppText variant="caption" tone="muted">
        {t('profile.noAccount')}
      </AppText>
    </FormScreen>
  );
}
