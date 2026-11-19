import { router } from 'expo-router';
import { Fragment } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { contactKind, QUICK_CALL_MAX, telUrl, togglePinned, type CarContact } from '@/features/contacts/rules';
import { useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, EmptyState, FormScreen, Icon, useToast } from '@/shared/ui';

/** Mis contactos del carro: mecánico, aseguradora, grúa… para llamar con un toque. */
export default function ContactsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const persist = usePersist();
  const { contacts, setContacts } = useSession();
  const pinnedCount = contacts.filter((c) => c.pinned).length;

  // ⭐ Fijar en "Llamar rápido" de Inicio.
  const pin = async (contact: CarContact) => {
    if (!(await persist(() => setContacts(togglePinned(contacts, contact.id))))) return;
    toast.show(contact.pinned ? 'Quitado de Inicio' : 'Fijado en Inicio');
  };

  const call = (contact: CarContact) =>
    Linking.openURL(telUrl(contact.phone)).catch(() => toast.show('No se pudo abrir el marcador del teléfono.'));

  return (
    <FormScreen
      title="Mis contactos del carro"
      closeIcon="back"
      footer={<Button label="Agregar contacto" icon="add" fullWidth onPress={() => router.push('/mi-carro/contacto')} />}>
      <AppText tone="secondary">
        Tu mecánico, la asistencia de tu aseguradora, la grúa… Guárdalos aquí y llámalos con un toque, por ejemplo si el
        carro se vara. Los números los escribes tú y se quedan en tu celular.
      </AppText>

      {contacts.length === 0 ? (
        <EmptyState
          icon="contact"
          title="Aún no tienes contactos"
          message="Empieza por la asistencia de tu aseguradora: suele estar en la póliza o en el carné del seguro."
        />
      ) : (
        <Card flush>
          {contacts.map((contact, i) => {
            const kind = contactKind(contact.kind);
            return (
              <Fragment key={contact.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${contact.name}`}
                    onPress={() => router.push({ pathname: '/mi-carro/contacto', params: { id: contact.id } })}
                    style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
                    <View style={styles.icon}>
                      <Icon name={kind.icon} size={20} color={colors.brand.accent} />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong">{contact.name}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {kind.label} · {contact.phone}
                      </AppText>
                      {contact.note && (
                        <AppText variant="caption" tone="muted">
                          {contact.note}
                        </AppText>
                      )}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={contact.pinned ? `Quitar a ${contact.name} de Inicio` : `Fijar a ${contact.name} en Inicio`}
                    accessibilityState={{ selected: !!contact.pinned }}
                    hitSlop={6}
                    onPress={() => pin(contact)}
                    style={({ pressed }) => [styles.starButton, pressed && styles.pressed]}>
                    <Icon
                      name={contact.pinned ? 'star' : 'starOutline'}
                      color={contact.pinned ? colors.status.soon.color : colors.text.muted}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Llamar a ${contact.name}`}
                    onPress={() => call(contact)}
                    style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
                    <Icon name="phone" color={colors.brand.onPrimary} />
                  </Pressable>
                </View>
              </Fragment>
            );
          })}
        </Card>
      )}

      {contacts.length > 0 && (
        <AppText variant="caption" tone="secondary">
          {pinnedCount > 0
            ? `⭐ Fijados en Inicio: ${pinnedCount}. En "Llamar rápido" caben ${QUICK_CALL_MAX} círculos (uno es "Emergencia" si tienes grúa o aseguradora).`
            : `Toca la ⭐ para elegir quién aparece en "Llamar rápido" de Inicio. Si no fijas a nadie, salen tu mecánico, la aseguradora, la grúa y un familiar.`}
        </AppText>
      )}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: sizes.touchMin / 2,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
}));
