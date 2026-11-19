import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, sizes, spacing } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';
import { reduceMotionNow } from '@/shared/hooks/useReduceMotion';

type Props = {
  visible: boolean;
  uri: string;
  onClose: () => void;
  /** "Cambiar o quitar foto": abre el menú de la foto. */
  onChange: () => void;
};

/** Colores fijos oscuros a propósito: es un visor de foto (igual en tema claro u oscuro). */
const WHITE = '#FFFFFF';
const SHADE = 'rgba(255,255,255,0.16)';

/** La foto del carro en grande, sobre fondo negro, con X para cerrar (también el botón atrás). */
export function CarPhotoViewer({ visible, uri, onClose, onChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType={reduceMotionNow() ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="Foto de tu carro" />

        <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
            <Icon name="close" color={WHITE} />
          </Pressable>
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable accessibilityRole="button" onPress={onChange} style={({ pressed }) => [styles.change, pressed && styles.pressed]}>
            <Icon name="camera" size={20} color={WHITE} />
            <AppText variant="bodyStrong" color={WHITE}>
              Cambiar o quitar foto
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  top: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingRight: spacing.lg,
  },
  round: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    borderRadius: radius.pill,
    backgroundColor: SHADE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchMin,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: SHADE,
  },
  pressed: {
    opacity: 0.7,
  },
});
