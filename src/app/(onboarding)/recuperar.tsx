import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RestoreBackup } from '@/features/data/components/RestoreBackup';
import { FaqButton } from '@/features/help/components/FaqButton';
import { spacing } from '@/shared/theme';
import { AppText, FormScreen } from '@/shared/ui';

/**
 * "Ya tenía RODEXA": en un celular nuevo se recupera la copia (.rodexa) y se salta el
 * registro. Al recuperarla, la app entra directo con el carro y sus registros.
 */
export default function RestoreScreen() {
  return (
    <FormScreen title="Recuperar mis datos" closeIcon="back" headerAction={<FaqButton />}>
      <View style={styles.heading}>
        <AppText variant="title">¿Ya usabas RODEXA Carro?</AppText>
        <AppText tone="secondary">
          Elige el archivo de copia que guardaste en tu otro celular (RODEXA-Carro-copia-fecha.rodexa). Recuperas tu
          carro y tus registros, y entras directo, sin llenar nada.
        </AppText>
      </View>
      <RestoreBackup
        onRestored={() =>
          // Deja que la navegación vea primero que ya hay datos (las pantallas de la app se habilitan).
          setTimeout(() => {
            if (router.canDismiss()) router.dismissAll();
            router.replace('/');
          }, 0)
        }
      />
      <AppText variant="caption" tone="muted">
        ¿No tienes la copia? En tu otro celular abre RODEXA Carro → Configuración → Copia de seguridad → «Guardar copia
        en el celular» y pásala a este celular por Drive, cable o Quick Share. Las fotos y las preferencias no van en la
        copia.
      </AppText>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.xs,
  },
});
