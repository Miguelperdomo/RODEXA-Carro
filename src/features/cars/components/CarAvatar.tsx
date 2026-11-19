import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  /** La foto válida (de useCarPhoto) o undefined. */
  photo: string | undefined;
  size: number;
  radius: number;
  /** Lo que se ve SIN foto: el ícono de siempre. */
  fallback: ReactNode;
};

/** La foto del carro si la pusieron; si no, el ícono de siempre (la foto es opcional). */
export function CarAvatar({ photo, size, radius, fallback }: Props) {
  if (!photo) return <>{fallback}</>;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <Image source={{ uri: photo }} style={{ width: size, height: size }} contentFit="cover" accessibilityLabel="Foto de tu carro" />
    </View>
  );
}
