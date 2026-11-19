import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { contactKind, telUrl, type CarContact, type ContactKind } from '@/features/contacts/rules';
import { ACCIDENT_STEPS, accidentDataText, callEmergency, EMERGENCY_NUMBER } from '@/features/emergency/officialLinks';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, InfoRow, useToast } from '@/shared/ui';

/** Primero a quién se llama en un accidente: familia, grúa y aseguradora; luego el mecánico. */
const CALL_ORDER: ContactKind[] = ['family', 'tow', 'insurance', 'mechanic'];

/**
 * "Tuve un accidente": lo que se necesita en ese momento, a un toque. Llamar al 123, los
 * datos del SOAT (de lo que registró la persona) y llamar a su familia, la grúa o la
 * aseguradora. RODEXA no llama sola: abre el marcador.
 */
export default function EmergencyScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { profile, documents, user } = useAppData();
  const { contacts } = useSession();
  const soat = documents.find((d) => d.type === 'soat');
  const hasSoat = !!soat && soat.records > 0;
  const toCall = contacts
    .filter((c) => CALL_ORDER.includes(c.kind))
    .sort((a, b) => CALL_ORDER.indexOf(a.kind) - CALL_ORDER.indexOf(b.kind));

  const call123 = async () => {
    if (!(await callEmergency())) toast.show(`No se pudo abrir el marcador. Marca el ${EMERGENCY_NUMBER}.`);
  };

  const call = (contact: CarContact) =>
    Linking.openURL(telUrl(contact.phone)).catch(() => toast.show('No se pudo abrir el marcador del teléfono.'));

  /** Los datos que piden en un accidente (al otro conductor o a las autoridades). */
  const copyData = async () => {
    try {
      await Clipboard.setStringAsync(accidentDataText(user.name, profile, soat));
      toast.show('Tus datos quedaron copiados: pégalos donde los necesites');
    } catch {
      toast.show('No se pudieron copiar tus datos.');
    }
  };

  return (
    <FormScreen title="Tuve un accidente" closeIcon="back">
      {/* 1. Llamar al 123 */}
      <View style={[styles.sos, { backgroundColor: colors.status.due.background }]}>
        <AppText variant="title" align="center">
          ¿Estás bien?
        </AppText>
        <AppText align="center" tone="secondary">
          Si hay heridos o peligro, llama ya. El {EMERGENCY_NUMBER} es la línea de emergencias de Colombia.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Llamar al ${EMERGENCY_NUMBER}`}
          onPress={() => void call123()}
          style={({ pressed }) => [styles.call, { backgroundColor: colors.status.due.color }, pressed && styles.pressed]}>
          <Icon name="phone" color="#FFFFFF" size={sizes.iconMd} />
          <AppText variant="heading" color="#FFFFFF">
            Llamar al {EMERGENCY_NUMBER}
          </AppText>
        </Pressable>
      </View>

      {/* 2. Pasos */}
      <Card>
        <AppText variant="captionStrong" tone="secondary">
          QUÉ HACER
        </AppText>
        {ACCIDENT_STEPS.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNumber}>
              <AppText variant="captionStrong" tone="brand">
                {i + 1}
              </AppText>
            </View>
            <AppText style={styles.flex}>{step}</AppText>
          </View>
        ))}
      </Card>

      {/* 3. Tu SOAT */}
      <Card>
        <AppText variant="captionStrong" tone="secondary">
          TU SOAT
        </AppText>
        {hasSoat ? (
          <>
            <InfoRow label="Placa" value={profile.plate ? profile.plate.toUpperCase() : 'Sin registrar'} />
            <InfoRow label="Aseguradora" value={soat?.issuer ?? 'Sin registrar'} divider />
            <InfoRow label="Número de póliza" value={soat?.number ?? 'Sin registrar'} divider />
            <InfoRow label="Estado" value={soat?.detail ?? '—'} divider />
            {soat?.status === 'due' && (
              <View style={[styles.alert, { backgroundColor: colors.status.due.background }]}>
                <Icon name="warning" color={colors.status.due.color} />
                <AppText variant="caption" style={styles.flex}>
                  Según tus registros, tu SOAT está vencido.
                </AppText>
              </View>
            )}
            <AppText variant="caption" tone="muted" style={styles.top}>
              El SOAT cubre la atención médica de las personas heridas en un accidente de tránsito.
            </AppText>
          </>
        ) : (
          <>
            <AppText tone="secondary" style={styles.top}>
              No tienes registrado tu SOAT en RODEXA. Regístralo para tenerlo a mano en un momento así.
            </AppText>
            <View style={styles.top}>
              <Button label="Registrar mi SOAT" variant="secondary" onPress={() => router.push('/registrar/documento')} />
            </View>
          </>
        )}
        <View style={styles.top}>
          <Button label="Copiar mis datos" icon="note" variant="ghost" onPress={() => void copyData()} />
        </View>
      </Card>

      {/* 4. Llamar a */}
      <Card>
        <AppText variant="captionStrong" tone="secondary">
          LLAMAR A
        </AppText>
        {toCall.length > 0 ? (
          toCall.map((c, i) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Llamar a ${c.name}, ${contactKind(c.kind).label}`}
              onPress={() => void call(c)}
              style={({ pressed }) => [styles.contact, i > 0 && styles.divider, pressed && styles.pressed]}>
              <View style={styles.contactIcon}>
                <Icon name={contactKind(c.kind).icon} color={colors.brand.accent} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{c.name}</AppText>
                <AppText variant="caption" tone="secondary">
                  {contactKind(c.kind).label} · {c.phone}
                </AppText>
              </View>
              <Icon name="phone" color={colors.brand.accent} />
            </Pressable>
          ))
        ) : (
          <>
            <AppText tone="secondary" style={styles.top}>
              Guarda el número de un familiar, la grúa o tu aseguradora para llamarlos desde aquí.
            </AppText>
            <View style={styles.top}>
              <Button label="Guardar contactos" variant="secondary" onPress={() => router.push('/mi-carro/contactos')} />
            </View>
          </>
        )}
      </Card>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  top: {
    marginTop: spacing.sm,
  },
  sos: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 64,
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
