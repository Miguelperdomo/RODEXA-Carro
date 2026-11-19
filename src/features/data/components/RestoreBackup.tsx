import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { View } from 'react-native';

import { backupFailure, parseBackup, type ParseBackupResult } from '@/features/pro/backup';
import { useSession } from '@/features/session/SessionProvider';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Icon, InfoRow, useToast } from '@/shared/ui';
import { formatDate } from '@/shared/utils/date';
import { wrap } from '@/storage/envelope';
import { keyValueStore, STORAGE_KEYS } from '@/storage/keyValueStore';
import { USER_SCHEMA_VERSION } from '@/storage/migrations/userData';

import { pickBackupFile } from '../backupIO';
import { appAlert } from '@/shared/ui/AppDialog';

type Props = {
  /** Al terminar de recuperar (p. ej. entrar a la app desde la bienvenida). */
  onRestored?: () => void;
};

type Ready = Extract<ParseBackupResult, { ok: true }>;

/**
 * Recuperar una copia: se elige el ARCHIVO (.rodexa) o se pega una copia vieja en texto. El
 * contenido nunca se muestra: solo el resumen de lo que trae. Si ya hay datos, se pide
 * confirmar y antes se guarda intacto lo que había (nunca se pierde solo).
 */
export function RestoreBackup({ onRestored }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { storedData, replaceAllData } = useSession();
  const [parsed, setParsed] = useState<ParseBackupResult | null>(null);
  const [busy, setBusy] = useState(false);
  /** Detalle técnico corto si el celular no dejó leer el archivo (para soporte). */
  const [detail, setDetail] = useState<string | null>(null);
  /** En la bienvenida no hay datos que reemplazar: no se pide confirmar. */
  const hasData = storedData.onboarding !== null;

  const fromFile = async () => {
    setDetail(null);
    try {
      const picked = await pickBackupFile();
      if (picked.kind === 'text') setParsed(parseBackup(picked.text));
      else if (picked.kind === 'too-big') setParsed(backupFailure('too-big'));
      else if (picked.kind === 'unreadable') {
        setParsed(backupFailure('unreadable'));
        setDetail(picked.detail);
      }
    } catch (e) {
      setParsed(backupFailure('unreadable'));
      setDetail(e instanceof Error ? e.message.slice(0, 120) : null);
    }
  };

  const fromClipboard = async () => {
    setDetail(null);
    try {
      setParsed(parseBackup(await Clipboard.getStringAsync()));
    } catch {
      toast.show('No se pudo leer el portapapeles.');
    }
  };

  const doImport = async (backup: Ready) => {
    setBusy(true);
    try {
      // Seguridad: antes de reemplazar, se guarda intacto lo que había.
      if (hasData) await keyValueStore.set(STORAGE_KEYS.backup(STORAGE_KEYS.user), wrap(storedData, USER_SCHEMA_VERSION));
      if (!(await replaceAllData(backup.data))) {
        toast.show('No se pudo guardar la copia. Tus datos no cambiaron.');
        return;
      }
      toast.show('Datos recuperados');
      setParsed(null);
      onRestored?.();
    } catch {
      toast.show('No se pudo guardar la copia. Tus datos no cambiaron.');
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = (backup: Ready) =>
    hasData
      ? appAlert(
          '¿Reemplazar tus datos?',
          'Los datos de RODEXA Carro en este celular se reemplazarán por los de la copia. Antes se guarda una copia interna de tus datos actuales.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reemplazar', style: 'destructive', onPress: () => void doImport(backup) },
          ],
        )
      : void doImport(backup);

  return (
    <View style={styles.container}>
      <Button label="Elegir archivo de copia" icon="importData" fullWidth onPress={() => void fromFile()} />
      <Button label="Pegar una copia en texto" variant="ghost" fullWidth onPress={() => void fromClipboard()} />

      {parsed && !parsed.ok && (
        <Card tone="highlight">
          <View style={styles.row}>
            <Icon name="warning" size={20} color={colors.status.due.color} />
            <AppText variant="bodyStrong" style={styles.flex}>
              No se puede recuperar
            </AppText>
          </View>
          <AppText tone="secondary">{parsed.message}</AppText>
          {detail && (
            <AppText variant="caption" tone="muted">
              Detalle: {detail}
            </AppText>
          )}
        </Card>
      )}

      {parsed?.ok && (
        <View style={styles.container}>
          <Card>
            <InfoRow label="Carro" value={parsed.summary.carName} />
            <InfoRow label="Registros" value={String(parsed.summary.records)} divider />
            <InfoRow
              label="Copia del"
              value={parsed.summary.exportedAt ? formatDate(new Date(parsed.summary.exportedAt)) : 'Fecha desconocida'}
              divider
            />
            {parsed.summary.unrecognized > 0 && (
              <InfoRow label="No reconocidos" value={`${parsed.summary.unrecognized} (se conservan aparte)`} divider />
            )}
          </Card>
          <Button
            label={busy ? 'Recuperando…' : hasData ? 'Reemplazar mis datos con esta copia' : 'Recuperar mis datos'}
            fullWidth
            onPress={() => !busy && confirmImport(parsed)}
          />
          <Button label="Cancelar" variant="ghost" fullWidth onPress={() => setParsed(null)} />
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles(() => ({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
