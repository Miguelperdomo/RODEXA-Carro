import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isGettingStartedOpen } from '@/features/dashboard/gettingStarted';
import { hidesFuel } from '@/features/tranqui/style';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon, useToast } from '@/shared/ui';

import { contactKind, quickCall, shortName, telUrl, type CarContact } from '../rules';
import { reduceMotionNow } from '@/shared/hooks/useReduceMotion';

/**
 * Inicio · "Llamar rápido": hasta 4 círculos que abren el marcador con un toque. Si hay
 * grúa o aseguradora, el primero es "Varada". Sin contactos, una invitación de una línea
 * (que se puede cerrar). Nada sale del celular: solo se abre el marcador con el número.
 */
export function QuickCallSection() {
  const styles = useStyles();
  const { contacts } = useSession();
  const data = useAppData();
  const { settings, update } = useSettings();
  const [sheetOpen, setSheetOpen] = useState(false);
  const call = useCall();

  if (contacts.length === 0) {
    // La invitación no compite con "Primeros pasos" y se puede cerrar para siempre.
    if (settings.quickCallInviteDismissed || isGettingStartedOpen(settings.showGettingStarted, data, hidesFuel(settings), settings.roadKit !== '')) return null;
    return <QuickCallInvite onDismiss={() => update({ quickCallInviteDismissed: true })} />;
  }

  const { emergency, circles } = quickCall(contacts);
  return (
    <View>
      <QuickCallHeader />
      <View style={styles.circles}>
        {emergency.length > 0 && <EmergencyCircle onPress={() => setSheetOpen(true)} />}
        {circles.map((contact) => (
          <ContactCircle key={contact.id} contact={contact} onPress={() => call(contact)} />
        ))}
      </View>
      <EmergencySheet visible={sheetOpen} contacts={emergency} onClose={() => setSheetOpen(false)} onCall={call} />
    </View>
  );
}

/** Abre el marcador del teléfono con el número (no llama solo ni pide permisos). */
function useCall() {
  const toast = useToast();
  return (contact: CarContact) =>
    Linking.openURL(telUrl(contact.phone)).catch(() => toast.show('No se pudo abrir el marcador del teléfono.'));
}

function QuickCallHeader() {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <AppText variant="bodyStrong" style={styles.flex}>
        Llamar rápido
      </AppText>
      <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push('/mi-carro/contactos')}>
        <AppText variant="captionStrong" tone="brand">
          Ver todos ›
        </AppText>
      </Pressable>
    </View>
  );
}

function ContactCircle({ contact, onPress }: { contact: CarContact; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const kind = contactKind(contact.kind);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Llamar a ${contact.name} (${kind.label})`}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={[styles.circle, { backgroundColor: colors.brand.soft }]}>
        <Icon name={kind.icon} color={colors.brand.accent} />
      </View>
      <AppText variant="caption" align="center" numberOfLines={1} style={styles.label}>
        {shortName(contact.name)}
      </AppText>
    </Pressable>
  );
}

function EmergencyCircle({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Emergencia: grúa y asistencia de la aseguradora"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={[styles.circle, { backgroundColor: colors.status.due.color }]}>
        <Icon name="emergency" color={colors.surface} />
      </View>
      <AppText variant="captionStrong" align="center" color={colors.status.due.color} style={styles.label}>
        Emergencia
      </AppText>
    </Pressable>
  );
}

function QuickCallInvite({ onDismiss }: { onDismiss: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.invite}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/mi-carro/contacto')}
        style={({ pressed }) => [styles.inviteMain, pressed && styles.pressed]}>
        <Icon name="phone" size={20} color={colors.brand.accent} />
        <AppText variant="caption" tone="secondary" style={styles.flex} numberOfLines={2}>
          Guarda el número de tu mecánico y de la grúa ·{' '}
          <AppText variant="captionStrong" tone="brand">
            Agregar
          </AppText>
        </AppText>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="No volver a mostrar" hitSlop={12} onPress={onDismiss}>
        <Icon name="close" size={20} color={colors.text.muted} />
      </Pressable>
    </View>
  );
}

type EmergencySheetProps = {
  visible: boolean;
  contacts: CarContact[];
  onClose: () => void;
  onCall: (contact: CarContact) => void;
};

/** Hoja "Varada": la grúa y la asistencia de la aseguradora, con su nota (p. ej. la póliza). */
function EmergencySheet({ visible, contacts, onClose, onCall }: EmergencySheetProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType={reduceMotionNow() ? 'none' : 'slide'} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: colors.status.due.background }]}>
              <Icon name="emergency" color={colors.status.due.color} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading">Emergencia en la vía</AppText>
              <AppText variant="caption" tone="secondary">
                Llama a tu grúa o a la asistencia de tu aseguradora.
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeButton}>
              <Icon name="close" color={colors.text.primary} />
            </Pressable>
          </View>

          {contacts.map((contact, i) => (
            <Fragment key={contact.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.sheetRow}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{contact.name}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {contactKind(contact.kind).label} · {contact.phone}
                  </AppText>
                  {contact.note && (
                    <AppText variant="caption" tone="primary">
                      {contact.note}
                    </AppText>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Llamar a ${contact.name}`}
                  onPress={() => onCall(contact)}
                  style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
                  <Icon name="phone" color={colors.brand.onPrimary} />
                  <AppText variant="captionStrong" color={colors.brand.onPrimary}>
                    Llamar
                  </AppText>
                </Pressable>
              </View>
            </Fragment>
          ))}

          <AppText variant="caption" tone="muted" style={styles.sheetFoot}>
            Si estás en la vía, ponte en un lugar seguro y señaliza antes de llamar.
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const CIRCLE = 56;

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  circles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    maxWidth: '25%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.8,
  },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: sizes.touchMin,
  },
  inviteMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchMin,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  sheetFoot: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
}));
