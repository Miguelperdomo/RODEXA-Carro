import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { findCity } from '@/features/catalogs/repository';
import { MAX_CONTACTS, telUrl } from '@/features/contacts/rules';
import {
  contactKindFor,
  filterProviders,
  getProviders,
  KIND_LABEL,
  mapsUrl,
  openState,
  paymentsText,
  whatsappMessage,
  whatsappUrl,
  type ProviderFilter,
} from '@/features/providers/providers';
import type { Provider } from '@/features/providers/types';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { newId } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Chip, EmptyState, FormScreen, Icon, TextField, useToast } from '@/shared/ui';

const FILTERS: { value: ProviderFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'workshop', label: KIND_LABEL.workshop.plural },
  { value: 'mobile', label: KIND_LABEL.mobile.plural },
  { value: 'cda', label: KIND_LABEL.cda.plural },
];

/**
 * Talleres y servicios: talleres, servicios a domicilio y CDA inscritos y verificados, en la
 * ciudad del perfil (sin GPS). Llamar, WhatsApp con el mensaje listo y "Cómo llegar". Lo
 * patrocinado va siempre marcado. Si no hay en la ciudad, se dice con amabilidad.
 */
export default function ProvidersScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const { user, profile } = useAppData();
  const [kind, setKind] = useState<ProviderFilter>(FILTERS.some((f) => f.value === tipo) ? (tipo as ProviderFilter) : 'all');
  const [query, setQuery] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [allCities, setAllCities] = useState(false);
  const city = findCity(user.cityId);
  const now = new Date();
  const list = filterProviders(getProviders(), {
    kind,
    cityId: allCities || !city ? undefined : city.id,
    query,
    openNow: openNow ? now : undefined,
  });
  const car = [profile.brandName, profile.model].filter(Boolean).join(' ');

  return (
    <FormScreen title="Talleres y servicios" closeIcon="back">
      <View style={styles.cityRow}>
        <Icon name="location" size={18} color={colors.text.secondary} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          {allCities || !city ? 'Todas las ciudades' : `En ${city.name} (tu ciudad del perfil)`}
        </AppText>
        {city && (
          <AppText variant="captionStrong" tone="brand" accessibilityRole="button" onPress={() => setAllCities((v) => !v)}>
            {allCities ? `Solo ${city.name}` : 'Ver todas'}
          </AppText>
        )}
      </View>

      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} selected={kind === f.value} onPress={() => setKind(f.value)} />
        ))}
        <Chip label="Abierto ahora" icon="calendar" selected={openNow} onPress={() => setOpenNow((v) => !v)} />
      </View>

      <TextField value={query} onChange={setQuery} placeholder="Buscar: frenos, eléctrico, grúa…" accessibilityLabel="Buscar talleres y servicios" />

      {list.length === 0 ? (
        <EmptyState
          icon="workshop"
          title={city && !allCities ? `Aún no hay negocios inscritos en ${city.name}` : 'Aún no hay negocios inscritos'}
          message="Estamos verificando talleres, servicios a domicilio y CDA. Pronto los verás aquí."
          action={<Button label="¿Ofreces un servicio? Inscríbelo" variant="secondary" onPress={() => router.push('/inscribir')} />}
        />
      ) : (
        list.map((p) => <ProviderCard key={p.id} provider={p} car={car} now={now} />)
      )}

      <AppText variant="caption" tone="muted">
        Cada negocio da sus datos y RODEXA hace una verificación básica antes de publicarlo. RODEXA no presta estos
        servicios ni garantiza su precio o resultado. Lo patrocinado siempre dice «Patrocinado».
      </AppText>
    </FormScreen>
  );
}

function ProviderCard({ provider: p, car, now }: { provider: Provider; car: string; now: Date }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { contacts, setContacts } = useSession();
  const open = openState(p.hours, now);
  const cityName = findCity(p.cityId)?.name ?? '';
  const maps = mapsUrl(p, cityName);
  const payments = paymentsText(p.payments);
  const saved = contacts.some((c) => c.phone.replace(/\D/g, '') === p.phone.replace(/\D/g, ''));

  const openUrl = (url: string, error: string) => void Linking.openURL(url).catch(() => toast.show(error));

  const save = async () => {
    if (saved) return;
    if (contacts.length >= MAX_CONTACTS) {
      toast.show(`Ya tienes ${MAX_CONTACTS} contactos guardados`);
      return;
    }
    const contact = { id: newId('contact'), kind: contactKindFor(p), name: p.name, phone: p.phone };
    if (await persist(() => setContacts([...contacts, contact]))) toast.show('Guardado en los contactos de tu carro');
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name={KIND_LABEL[p.kind].icon} size={20} color={colors.brand.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{p.name}</AppText>
          <AppText variant="caption" tone="secondary">
            {[KIND_LABEL[p.kind].label, cityName].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        {p.sponsored && (
          <View style={styles.sponsored}>
            <AppText variant="captionStrong" tone="secondary">
              Patrocinado
            </AppText>
          </View>
        )}
      </View>

      <AppText variant="caption" style={styles.line}>
        {p.services.join(' · ')}
      </AppText>
      {(p.address || p.zones) && (
        <AppText variant="caption" tone="secondary" style={styles.line}>
          {p.address ?? `Cubre: ${p.zones}`}
        </AppText>
      )}
      {open ? (
        <AppText variant="captionStrong" color={open.open ? colors.status.ok.color : colors.text.muted} style={styles.line}>
          {open.text}
        </AppText>
      ) : p.schedule ? (
        <AppText variant="caption" tone="secondary" style={styles.line}>
          {p.schedule}
        </AppText>
      ) : null}
      {payments.length > 0 && (
        <AppText variant="caption" tone="secondary" style={styles.line}>
          Pagos: {payments.join(', ')}
        </AppText>
      )}

      <View style={styles.actions}>
        <Button label="Llamar" icon="phone" onPress={() => openUrl(telUrl(p.phone), 'No se pudo abrir el marcador del teléfono.')} />
        {p.whatsapp && (
          <Button
            label="WhatsApp"
            icon="contact"
            variant="secondary"
            onPress={() => openUrl(whatsappUrl(p.whatsapp!, whatsappMessage(p, car)), 'No se pudo abrir WhatsApp.')}
          />
        )}
        {maps && <Button label="Cómo llegar" icon="location" variant="secondary" onPress={() => openUrl(maps, 'No se pudo abrir el mapa.')} />}
        <Button label={saved ? 'En tus contactos' : 'Guardar contacto'} variant="ghost" onPress={() => void save()} />
      </View>
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsored: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
