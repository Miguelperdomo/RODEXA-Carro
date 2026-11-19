import { router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { DOCUMENT_DEFINITIONS } from '@/features/documents/catalog';
import {
  documentDetailRows,
  documentRecordSubtitle,
  documentRecordTitle,
  documentStatusText,
} from '@/features/documents/presentation';
import { documentRecords } from '@/features/documents/summary';
import { editHref, useEntryActions } from '@/features/history/useEntryActions';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon, InfoRow, SectionHeader } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';
import { DocumentFacts } from '@/features/law/components/DocumentFacts';

/**
 * Detalle de un documento (aquí llegan las notificaciones): estado, datos del
 * registro vigente, renovaciones anteriores, y acciones para renovar o editar.
 */
export default function DocumentDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { documents, history } = useAppData();
  const doc = documents.find((d) => d.key === key);
  const records = documentRecords(history, key ?? '');
  const current = records.find((r) => r.id === doc?.latestRecordId) ?? records[0];
  // Eliminar el registro vigente (con confirmación); la renovación anterior pasa a mandar.
  const { editable, remove } = useEntryActions(current);

  if (!doc || records.length === 0) {
    return (
      <FormScreen title="Documento" closeIcon="back">
        <EmptyState
          icon="document"
          title="Aún no hay registros de este documento"
          action={
            doc ? (
              <Button
                label="Registrar"
                onPress={() => router.replace({ pathname: '/registrar/documento', params: { tipo: doc.type } })}
              />
            ) : undefined
          }
        />
      </FormScreen>
    );
  }

  const definition = DOCUMENT_DEFINITIONS[doc.type];
  const style = colors.status[doc.status];
  const renew = () =>
    router.push({
      pathname: '/registrar/documento',
      params: definition.multiple ? { tipo: doc.type, serie: current.seriesId ?? current.id } : { tipo: doc.type },
    });

  return (
    <FormScreen
      title={doc.title}
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <Button
            label={definition.hasTaxFields ? 'Registrar otro año' : 'Registrar renovación'}
            icon="add"
            fullWidth
            onPress={renew}
          />
          {/* Para renovar la tecnomecánica: los CDA inscritos en la ciudad. */}
          {doc.type === 'rtm' && (
            <Button
              label="Ver CDA para hacer la tecnomecánica"
              icon="inspection"
              variant="secondary"
              fullWidth
              onPress={() => router.push({ pathname: '/talleres', params: { tipo: 'cda' } })}
            />
          )}
          {editable && (
            <>
              <Button label="Editar" icon="note" variant="ghost" fullWidth onPress={() => router.push(editHref(current))} />
              <Button label="Eliminar este registro" icon="delete" variant="ghost" fullWidth onPress={remove} />
            </>
          )}
        </View>
      }>
      <Card>
        <View style={styles.statusRow}>
          <View style={[styles.statusIcon, { backgroundColor: style.background }]}>
            <Icon name={definition.icon} size={28} color={style.color} />
          </View>
          <View style={styles.flex}>
            <View style={[styles.pill, { backgroundColor: style.background }]}>
              <AppText variant="captionStrong" color={style.color}>
                {documentStatusText(doc)}
              </AppText>
            </View>
            <AppText variant="bodyStrong">{doc.detail}</AppText>
            {doc.alertDate && (
              <AppText variant="caption" tone="muted">
                Según la fecha que registraste.
              </AppText>
            )}
          </View>
        </View>
      </Card>

      {/* SOAT y tecnomecánica: multa si están vencidos y tarifa de referencia (aproximadas). */}
      <DocumentFacts type={doc.type} />

      <View>
        <SectionHeader title="Registro vigente" />
        <Card>
          {documentDetailRows(current)
            .filter((row) => row.value !== undefined)
            .map((row, index) => (
              <InfoRow key={row.label} label={row.label} value={row.value} divider={index > 0} />
            ))}
        </Card>
      </View>

      {records.length > 1 && (
        <View>
          <SectionHeader title={definition.hasTaxFields ? 'Años anteriores' : 'Renovaciones anteriores'} />
          <Card flush>
            {records
              .filter((r) => r.id !== current.id)
              .map((record, index) => (
                <Fragment key={record.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/registro/[id]', params: { id: record.id } })}
                    style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}>
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong">{documentRecordTitle(record)}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {documentRecordSubtitle(record)}
                      </AppText>
                    </View>
                    {record.costCop !== undefined && definition.expenseCategory && (
                      <AppText variant="bodyStrong" numeric>
                        {formatCop(record.costCop)}
                      </AppText>
                    )}
                  </Pressable>
                </Fragment>
              ))}
          </Card>
        </View>
      )}

      <AppText variant="caption" tone="muted">
        RODEXA organiza la información que registras; no consulta entidades oficiales.
      </AppText>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  footer: {
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
}));
