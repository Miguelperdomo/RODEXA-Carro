import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { partSearchUrl, partTitle, partWhatsappText, partWhatsappUrl, sortParts, type MyPart } from '@/features/parts/myParts';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, spacing } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, useToast } from '@/shared/ui';
import { formatDate, parseISODate } from '@/shared/utils/date';
import { formatCop } from '@/shared/utils/format';

/**
 * Repuestos de mi carro: marca, referencia y última compra de lo que le sirve a TU carro (lo
 * anotas tú o tu mecánico). "Pedir por WhatsApp" y "Buscar en Google" con un toque.
 */
export default function MyPartsScreen() {
  const { myParts } = useSession();
  const { profile } = useAppData();
  const car = [profile.brandName, profile.model, profile.year].filter(Boolean).join(' ');
  const parts = sortParts(myParts);

  return (
    <FormScreen
      title="Repuestos de mi carro"
      closeIcon="back"
      footer={<Button label="Anotar un repuesto" icon="add" fullWidth onPress={() => router.push('/mis-repuestos/editar')} />}>
      {parts.length === 0 ? (
        <EmptyState
          icon="parts"
          title="Anota los repuestos de tu carro"
          message="Marca, referencia y dónde lo compraste. Así la próxima vez lo pides por WhatsApp o lo buscas con un toque."
        />
      ) : (
        parts.map((part) => <PartCard key={part.id} part={part} car={car} />)
      )}
      <AppText variant="caption" tone="muted">
        RODEXA no tiene un catálogo de repuestos: guarda lo que tú anotas. Confirma la referencia con tu mecánico.
      </AppText>
    </FormScreen>
  );
}

function PartCard({ part, car }: { part: MyPart; car: string }) {
  const styles = useStyles();
  const toast = useToast();
  const purchase = part.lastPurchase;
  const open = (url: string, error: string) => void Linking.openURL(url).catch(() => toast.show(error));

  return (
    <Card onPress={() => router.push({ pathname: '/mis-repuestos/editar', params: { id: part.id } })}>
      <AppText variant="bodyStrong">{partTitle(part)}</AppText>
      <AppText tone="secondary">{[part.type === 'other' ? undefined : part.name, part.reference].filter(Boolean).join(' · ')}</AppText>
      {purchase && (
        <AppText variant="caption" tone="secondary" style={styles.line}>
          Última compra: {[formatDate(parseISODate(purchase.date)), purchase.priceCop ? formatCop(purchase.priceCop) : undefined, purchase.store]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      )}
      <View style={styles.actions}>
        <Button
          label="Pedir por WhatsApp"
          icon="contact"
          variant="secondary"
          onPress={() => open(partWhatsappUrl(partWhatsappText(part, car)), 'No se pudo abrir WhatsApp.')}
        />
        <Button label="Buscar en Google" icon="search" variant="ghost" onPress={() => open(partSearchUrl(part, car), 'No se pudo abrir el navegador.')} />
      </View>
    </Card>
  );
}

const useStyles = createStyles(() => ({
  line: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
}));
