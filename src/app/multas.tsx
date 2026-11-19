import { router } from 'expo-router';
import { View } from 'react-native';

import { openOfficialSite } from '@/features/emergency/officialLinks';
import { discountState, discountText, FINE_KIND_LABEL, type FineRecord } from '@/features/law/fines';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, useToast } from '@/shared/ui';
import { formatDate, parseISODate, toISODate, today } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

/**
 * "¿Me multaron?": anotas el comparendo y RODEXA cuenta los días HÁBILES que te quedan para el
 * descuento (sin fines de semana ni festivos). Te avisa el día antes. No se conecta con el SIMIT:
 * para consultar o pagar se abre la página oficial.
 */
export default function FinesScreen() {
  const toast = useToast();
  const { fines } = useSession();
  const { profile } = useAppData();
  const list = [...fines].sort((a, b) => Number(!!a.paidAt) - Number(!!b.paidAt) || (a.date < b.date ? 1 : -1));

  const simit = async () => toast.show((await openOfficialSite('simit', profile.plate)) ?? 'No se pudo abrir la página. Intenta de nuevo.');

  return (
    <FormScreen
      title="¿Me multaron?"
      closeIcon="back"
      footer={<Button label="Anotar un comparendo" icon="add" fullWidth onPress={() => router.push('/multas/editar')} />}>
      <AppText tone="secondary">
        Anota el comparendo y te decimos cuántos días hábiles te quedan para pagarlo con descuento (haciendo el curso de
        normas de tránsito). Las multas por alcohol no tienen descuento.
      </AppText>
      <Button label="Consultar en el SIMIT" icon="fine" variant="secondary" fullWidth onPress={() => void simit()} />

      {list.length === 0 ? (
        <EmptyState icon="fine" title="No tienes comparendos anotados" message="Si te ponen uno, anótalo aquí el mismo día para no perder el descuento." />
      ) : (
        list.map((fine) => <FineCard key={fine.id} fine={fine} />)
      )}

      <AppText variant="caption" tone="muted">
        Plazos según el artículo 136 del Código Nacional de Tránsito (Ley 769 de 2002, modificado por la Ley 1383 de 2010).
        Confirma el valor y los plazos de tu comparendo en el SIMIT o con la autoridad de tránsito.
      </AppText>
    </FormScreen>
  );
}

function FineCard({ fine }: { fine: FineRecord }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { fines, setFines } = useSession();
  const state = discountState(fine, today());
  const urgent = state.stage === 'full' || state.stage === 'partial' ? state.daysLeft <= 1 : false;

  const markPaid = async () => {
    const next = fines.map((f) => (f.id === fine.id ? { ...f, paidAt: toISODate(today()) } : f));
    if (await persist(() => setFines(next))) toast.show('Comparendo marcado como pagado');
  };

  return (
    <Card tone={urgent ? 'highlight' : 'default'} onPress={() => router.push({ pathname: '/multas/editar', params: { id: fine.id } })}>
      <AppText variant="bodyStrong">{fine.number ? `Comparendo ${fine.number}` : 'Comparendo'}</AppText>
      <AppText variant="caption" tone="secondary">
        {[FINE_KIND_LABEL[fine.kind], formatDate(parseISODate(fine.date)), fine.amountCop ? formatCop(fine.amountCop) : undefined]
          .filter(Boolean)
          .join(' · ')}
      </AppText>
      <AppText
        variant="bodyStrong"
        color={state.stage === 'paid' ? colors.status.ok.color : urgent ? colors.status.due.color : colors.brand.accent}
        style={styles.state}>
        {discountText(state)}
      </AppText>
      {(state.stage === 'full' || state.stage === 'partial') && (
        <AppText variant="caption" tone="secondary">
          Último día: {formatDate(parseISODate(state.deadline))}
          {fine.amountCop ? ` · pagarías unos ${formatCop(Math.round((fine.amountCop * (100 - state.percent)) / 100))}` : ''}
        </AppText>
      )}
      {!fine.paidAt && (
        <View style={styles.actions}>
          <Button label="Ya la pagué" icon="check" variant="secondary" onPress={() => void markPaid()} />
        </View>
      )}
    </Card>
  );
}

const useStyles = createStyles(() => ({
  state: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
}));
