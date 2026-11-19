import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openEmailDraft, reportDraft } from '@/features/help/email';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Icon } from '@/shared/ui';
import type { UserDataReadFailure } from '@/storage/userDataStore';

const TEXTS: Record<UserDataReadFailure, { title: string; message: string }> = {
  'read-error': {
    title: 'No pudimos leer tus datos',
    message:
      'El celular no dejó leer el almacenamiento de RODEXA. Tus datos no se borraron: no vamos a guardar nada hasta poder leerlos. Toca Reintentar, o cierra la app y vuelve a abrirla.',
  },
  'newer-version': {
    title: 'Tus datos son de una versión más nueva',
    message:
      'Estos datos los guardó una versión más reciente de RODEXA Carro. Actualiza la app desde Google Play para verlos. No los modificamos.',
  },
  'backup-failed': {
    title: 'No pudimos proteger tus datos',
    message:
      'Encontramos datos con problemas y no pudimos guardar una copia antes de continuar. Para no arriesgarlos, no seguimos. Libera espacio en el celular y toca Reintentar.',
  },
};

/**
 * Se muestra cuando los datos guardados no se pudieron cargar. La app no arranca vacía
 * (eso podría sobrescribirlos): no se escribe nada hasta que se puedan leer.
 */
export function DataLoadErrorView({ reason, onRetry }: { reason: UserDataReadFailure; onRetry: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const text = TEXTS[reason];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Icon name="warning" size={36} color={colors.status.soon.color} />
        </View>
        <AppText variant="title" align="center">
          {text.title}
        </AppText>
        <AppText tone="secondary" align="center">
          {text.message}
        </AppText>
        <View style={styles.actions}>
          <Button label="Reintentar" icon="reset" fullWidth onPress={onRetry} />
          <Button
            label="Reportar el problema"
            variant="ghost"
            fullWidth
            onPress={() => openEmailDraft(reportDraft(`${text.title} (${reason}).`, 'Al abrir la aplicación.'))}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.status.soon.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
}));
