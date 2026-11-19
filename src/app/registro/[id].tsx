import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { documentDetailRows } from '@/features/documents/presentation';
import { energyDetailRows } from '@/features/energy/presentation';
import { EXPENSE_CATEGORIES } from '@/features/expenses/catalog';
import { describeEntry } from '@/features/history/presentation';
import type { HistoryEntry } from '@/features/history/types';
import { useEntryActions } from '@/features/history/useEntryActions';
import { maintenanceLabel } from '@/features/maintenance/catalog';
import { formatRecordKm } from '@/features/odometer/recordKm';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, InfoRow } from '@/shared/ui';
import { formatDateWithRelative, parseISODate } from '@/shared/utils/date';
import { formatCop, formatKm } from '@/shared/utils/format';

/** Filas de datos de un registro (solo lo que existe; nada se inventa). */
function detailRows(entry: HistoryEntry): { label: string; value?: string }[] {
  const date = formatDateWithRelative(parseISODate(entry.date));
  switch (entry.kind) {
    case 'odometer':
      return [
        { label: 'Fecha', value: date },
        { label: 'Kilometraje', value: formatKm(entry.km) },
      ];
    case 'maintenance':
      return [
        { label: 'Qué se hizo', value: entry.types.map(maintenanceLabel).join(', ') },
        { label: 'Fecha', value: date },
        { label: 'Kilometraje', value: formatRecordKm(entry.km) },
        { label: 'Costo', value: entry.costCop !== undefined ? formatCop(entry.costCop) : undefined },
        { label: 'Nota', value: entry.note },
      ];
    case 'expense':
      return [
        { label: 'Categoría', value: EXPENSE_CATEGORIES.find((c) => c.code === entry.category)?.label },
        { label: 'Valor', value: formatCop(entry.amountCop) },
        { label: 'Fecha', value: date },
        { label: 'Nota', value: entry.note },
      ];
    case 'document':
      return documentDetailRows(entry);
    case 'fuel':
    case 'cng':
    case 'charge':
      return energyDetailRows(entry);
  }
}

/** Detalle de un registro del historial, con Editar y Eliminar. */
export default function EntryDetailScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useAppData();
  const entry = history.find((e) => e.id === id);
  const { editable, deletable, edit, remove } = useEntryActions(entry);

  if (!entry) {
    return (
      <FormScreen title="Registro" closeIcon="back">
        <EmptyState icon="history" title="No encontramos este registro" />
      </FormScreen>
    );
  }

  const rows = detailRows(entry).filter((r) => r.value);

  return (
    <FormScreen
      title={describeEntry(entry).title}
      closeIcon="back"
      footer={
        editable ? (
          <View style={styles.footer}>
            <Button label="Editar" icon="note" fullWidth onPress={edit} />
            {deletable && <Button label="Eliminar" icon="delete" variant="ghost" fullWidth onPress={remove} />}
          </View>
        ) : entry.kind === 'document' ? (
          <Button
            label="Actualizar documento"
            icon="document"
            fullWidth
            onPress={() => router.push({ pathname: '/registrar/documento', params: { tipo: entry.docType } })}
          />
        ) : undefined
      }>
      <Card>
        {rows.map((row, index) => (
          <InfoRow key={row.label} label={row.label} value={row.value} divider={index > 0} />
        ))}
      </Card>
      {!editable && (
        <AppText variant="caption" tone="muted">
          {entry.kind === 'document'
            ? 'Registrado en el primer ingreso. Para cambiarlo, registra el documento de nuevo.'
            : 'Kilometraje del primer ingreso: es la base de los cálculos, por eso no se edita ni se borra. Registra un kilometraje nuevo cuando cambie.'}
        </AppText>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles(() => ({
  footer: {
    gap: spacing.xs,
  },
}));
