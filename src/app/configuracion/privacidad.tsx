import { router } from 'expo-router';

import { useSession } from '@/features/session/SessionProvider';
import { testRecordsSummary } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { backupUserData } from '@/storage/userDataStore';
import { useT } from '@/i18n';
import { FormScreen, SettingsRow, SettingsSection, useToast } from '@/shared/ui';
import { appAlert } from '@/shared/ui/AppDialog';

/**
 * Privacidad y datos. "Eliminar todos los datos" es DISTINTO de "Restablecer
 * preferencias": pide confirmación y borra del teléfono el carro y sus registros
 * (las preferencias se conservan). Luego la app vuelve al primer ingreso.
 */
export default function PrivacyScreen() {
  const t = useT();
  const toast = useToast();
  const persist = usePersist();
  const { deleteAllData, clearTestRecords, storedData } = useSession();
  const summary = testRecordsSummary(storedData.records);

  // "Borrar mis registros de prueba": antes se guarda una copia interna de todo.
  const confirmClearTests = () => {
    if (summary.total === 0) {
      toast.show('No tienes registros para borrar');
      return;
    }
    const parts = [
      [summary.energy, 'carga de combustible o energía', 'cargas de combustible o energía'],
      [summary.expenses, 'gasto', 'gastos'],
      [summary.maintenance, 'mantenimiento', 'mantenimientos'],
      [summary.odometer, 'lectura de km', 'lecturas de km'],
    ]
      .filter(([n]) => (n as number) > 0)
      .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
    appAlert(
      '¿Borrar tus registros de prueba?',
      `Se borrarán ${parts.join(', ')}.

Se conservan tu carro, lo que registraste en el primer ingreso, tus documentos y tus configuraciones (pico y placa, presupuesto, gastos que se repiten, recordatorios, contactos y ficha).

Si quieres guardarlos, primero haz una copia en Tus datos.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Borrar registros',
          style: 'destructive',
          onPress: async () => {
            if (!(await backupUserData(storedData))) {
              toast.show('No se pudo hacer la copia de seguridad. No se borró nada.');
              return;
            }
            if (await persist(clearTestRecords)) toast.show('Registros borrados. Tu carro y tus configuraciones siguen igual.');
          },
        },
      ],
    );
  };

  const confirmDelete = () =>
    appAlert(t('confirm.delete.title'), t('confirm.delete.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('confirm.delete.action'),
        style: 'destructive',
        onPress: async () => {
          await deleteAllData();
          toast.show(t('toast.dataDeleted'));
          // Se cierran todas las pantallas y se vuelve a la bienvenida, como recién instalada.
          // El setTimeout deja que la navegación vea primero que el primer ingreso volvió a estar
          // disponible (las pantallas protegidas ya no lo están).
          setTimeout(() => {
            if (router.canDismiss()) router.dismissAll();
            router.replace('/bienvenida');
          }, 0);
        },
      },
    ]);

  return (
    <FormScreen title={t('privacy.title')} closeIcon="back">
      <SettingsSection footnote={t('privacy.note')}>
        <SettingsRow
          icon="policy"
          label={t('privacy.policy')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/politica-privacidad')}
        />
        <SettingsRow
          icon="storage"
          label={t('privacy.stored')}
          description={t('privacy.stored.description')}
          accessory={{ type: 'value', value: 'Local' }}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow
          icon="exportData"
          label={t('settings.data')}
          description={t('settings.data.description')}
          accessory={{ type: 'chevron' }}
          onPress={() => router.push('/configuracion/datos')}
        />
      </SettingsSection>

      <SettingsSection footnote="Para empezar de cero sin volver a registrar tu carro: borra las cargas de combustible o energía, los gastos, los mantenimientos y los km. Conserva el carro, los documentos y tus configuraciones.">
        <SettingsRow
          icon="reset"
          label="Borrar mis registros de prueba"
          description={summary.total > 0 ? `${summary.total} ${summary.total === 1 ? 'registro' : 'registros'}` : 'No tienes registros'}
          accessory={{ type: 'chevron' }}
          onPress={confirmClearTests}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow
          icon="delete"
          label={t('privacy.delete')}
          description={t('privacy.delete.description')}
          accessory={{ type: 'chevron' }}
          onPress={confirmDelete}
          destructive
        />
      </SettingsSection>
    </FormScreen>
  );
}
