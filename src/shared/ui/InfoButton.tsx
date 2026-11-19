import { Pressable } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon } from './Icon';
import { appAlert } from '@/shared/ui/AppDialog';

export type InfoText = { title: string; message: string };

/**
 * ⓘ pequeño junto a un título: solo al tocarlo sale una ventana con la explicación y
 * "Entendido". Para palabras o números que no todos entienden; no en campos obvios.
 */
export function InfoButton({ title, message }: InfoText) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Qué significa: ${title}`}
      hitSlop={10}
      onPress={() => appAlert(title, message, [{ text: 'Entendido' }])}>
      <Icon name="info" size={18} color={colors.brand.accent} />
    </Pressable>
  );
}
