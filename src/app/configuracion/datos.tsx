import { useState } from 'react';
import { View } from 'react-native';

import { backupFileName } from '@/features/data/backupFile';
import { lastSaveProblem, saveBackupFile, saveInFolder, saveInSavedFolder, type SaveResult } from '@/features/data/backupIO';
import { RestoreBackup } from '@/features/data/components/RestoreBackup';
import { backupFileContent } from '@/features/pro/backup';
import { useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, InfoRow, SectionHeader, useToast } from '@/shared/ui';
import { formatDate, parseISODate, toISODate, today } from '@/shared/utils/date';
import { appAlert } from '@/shared/ui/AppDialog';

/**
 * Copia de seguridad (GRATIS): un ARCHIVO (.rodexa) con todo lo registrado, sin cuenta, sin
 * servidor y sin nube. La persona lo guarda donde quiera (Descargas, Drive) y lo usa en su
 * celular nuevo. Recuperar REEMPLAZA lo actual, siempre con confirmación.
 */
export default function DataScreen() {
  const styles = useStyles();
  const toast = useToast();
  const { storedData } = useSession();
  const { settings, update } = useSettings();
  const [saving, setSaving] = useState(false);
  const profile = storedData.onboarding ? { ...storedData.onboarding.profile, ...storedData.profileEdits } : undefined;

  /** Si no se pudo: el motivo en palabras simples y el detalle técnico para soporte. */
  const showProblem = (message: string) => {
    const detail = lastSaveProblem();
    appAlert(
      'No se pudo guardar la copia',
      detail ? `${message}\n\nSi vuelve a pasar, envíanos una captura de esto:\n${detail}` : message,
      [{ text: 'Entendido' }],
    );
  };

  /** Nombre y contenido de la copia de ahora (con la hora: dos copias del mismo día no chocan). */
  const prepare = () => {
    const now = new Date();
    const iso = toISODate(today());
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    return { iso, name: backupFileName(iso, time), content: backupFileContent(storedData, now) };
  };

  /** Elegir carpeta: se recuerda y las próximas copias se guardan ahí solas. */
  const pickAndSave = async (name: string, content: string, iso: string) => {
    const { result, folder } = await saveInFolder(name, content);
    if (result === 'saved' && folder) {
      update({ lastBackupAt: iso, backupFolderUri: folder.uri, backupFolderName: folder.name });
      toast.show(`Copia guardada y comprobada en «${folder.name}». Las próximas se guardan ahí solas`);
    } else if (result === 'error') {
      showProblem('No se pudo guardar en esa carpeta. Intenta con otra, por ejemplo dentro de Descargas.');
    }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { iso, name, content } = prepare();

      // 1) La carpeta que ya elegiste: sin preguntar nada.
      if (settings.backupFolderUri) {
        if ((await saveInSavedFolder(settings.backupFolderUri, name, content)) === 'saved') {
          update({ lastBackupAt: iso });
          toast.show(`Copia guardada y comprobada en «${settings.backupFolderName || 'tu carpeta'}»`);
          return;
        }
        // La carpeta ya no existe o se quitó el permiso: se olvida y se sigue normal.
        update({ backupFolderUri: '', backupFolderName: '' });
      }

      // 2) "Guardar en…" de Android.
      const result: SaveResult = await saveBackupFile(name, content);
      if (result === 'saved') {
        // Solo después de COMPROBAR el archivo.
        update({ lastBackupAt: iso });
        toast.show('Copia guardada y comprobada');
      } else if (result === 'error') {
        showProblem('Intenta de nuevo.');
      } else if (result === 'pickFolder') {
        // 3) Elegir una carpeta una sola vez (Android no deja usar la raíz de Descargas).
        appAlert(
          'Elige una carpeta',
          'Elige o crea una carpeta para tus copias, por ejemplo «RODEXA» dentro de Descargas. Solo te lo preguntamos esta vez: las próximas copias se guardan ahí solas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Elegir carpeta', onPress: () => void pickAndSave(name, content, iso) },
          ],
        );
      }
    } catch {
      // Falló antes de guardar (armando la copia): se avisa en vez de quedarse callado.
      showProblem('Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const changeFolder = async () => {
    const { iso, name, content } = prepare();
    await pickAndSave(name, content, iso);
  };

  return (
    <FormScreen title="Copia de seguridad" closeIcon="back">
      <AppText tone="secondary">
        Tu información es tuya. Guarda una copia en tu celular y llévala a tu celular nuevo. RODEXA Carro no la envía a
        ningún servidor.
      </AppText>

      <View>
        <SectionHeader title="Guardar copia" />
        <Card>
          <InfoRow label="Carro" value={profile ? `${profile.brandName} ${profile.model}`.trim() : 'Sin registrar'} />
          <InfoRow label="Registros" value={String(storedData.records.length)} divider />
          <InfoRow
            label="Última copia"
            value={settings.lastBackupAt ? formatDate(parseISODate(settings.lastBackupAt)) : 'Nunca'}
            divider
          />
          {settings.backupFolderUri !== '' && (
            <InfoRow label="Se guarda en" value={`Carpeta «${settings.backupFolderName || 'tu carpeta'}»`} divider />
          )}
        </Card>
        <View style={styles.actions}>
          <Button label={saving ? 'Guardando…' : 'Guardar copia en el celular'} icon="exportData" fullWidth onPress={save} />
          {settings.backupFolderUri !== '' && (
            <Button label="Guardar en otra carpeta" variant="ghost" fullWidth onPress={() => void changeFolder()} />
          )}
        </View>
        <AppText variant="caption" tone="muted" style={styles.note}>
          Se guarda un archivo «RODEXA-Carro-copia-fecha-hora.rodexa». Elige Descargas o Google Drive. Para el celular
          nuevo, pásalo por Drive, cable o Quick Share.
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.note}>
          Cualquiera que tenga el archivo puede recuperar tus datos: guárdalo en un lugar seguro. No incluye las fotos
          ni las preferencias de la app.
        </AppText>
      </View>

      <View>
        <SectionHeader title="Recuperar copia" />
        <RestoreBackup />
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  note: {
    marginTop: spacing.sm,
  },
}));
