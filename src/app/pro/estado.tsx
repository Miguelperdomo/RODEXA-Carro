import { View } from 'react-native';

import { StateList } from '@/features/pro/components/StateList';
import { ProGate } from '@/features/pro/components/ProGate';
import { PRO_FEATURES } from '@/features/pro/config';
import { analyzeState, STATE_GROUP_TITLES, type StateGroup } from '@/features/pro/stateAnalysis';
import { useAppData } from '@/features/session/SessionProvider';
import { StatTile } from '@/features/stats/components/StatTile';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, EmptyState, FormScreen, SectionHeader } from '@/shared/ui';
import { today } from '@/shared/utils/date';

const FEATURE = PRO_FEATURES.find((f) => f.key === 'state')!;
const GROUP_ORDER: StateGroup[] = ['maintenance', 'documents', 'odometer', 'missing', 'insufficient', 'trend'];

/** Análisis del estado (RODEXA Pro): solo con tus registros y las reglas de la app. */
export default function ProStateScreen() {
  return (
    <FormScreen title="Análisis del estado" closeIcon="back">
      <ProGate feature={FEATURE}>
        <StateContent />
      </ProGate>
    </FormScreen>
  );
}

function StateContent() {
  const styles = useStyles();
  const data = useAppData();
  const { items, counts } = analyzeState(data, today());

  return (
    <View style={styles.content}>
      <View style={styles.tileRow}>
        <StatTile icon="statusDue" label="Atrasado o vencido" value={String(counts.due)} />
        <StatTile icon="statusSoon" label="Próximo" value={String(counts.soon)} />
        <StatTile icon="statusNoData" label="Faltan datos" value={String(counts.nodata)} />
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="statusOk"
          title="Nada pendiente según tus registros"
          message="No hay mantenimientos atrasados ni documentos por vencer con lo que registraste."
        />
      ) : (
        GROUP_ORDER.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (groupItems.length === 0) return null;
          return (
            <View key={group}>
              <SectionHeader title={STATE_GROUP_TITLES[group]} />
              <StateList items={groupItems} />
            </View>
          );
        })
      )}

      <AppText variant="caption" tone="muted">
        RODEXA no revisa el carro ni diagnostica fallas: este análisis compara tus registros con los intervalos y
        fechas que configuraste. Ante cualquier duda, consulta a tu mecánico.
      </AppText>
    </View>
  );
}

const useStyles = createStyles(() => ({
  content: {
    gap: spacing.xl,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
}));
