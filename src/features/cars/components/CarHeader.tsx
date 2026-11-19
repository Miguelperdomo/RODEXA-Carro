import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import type { CarProfile } from '../types';
import { useCarPhoto } from '../useCarPhoto';
import { CarAvatar } from './CarAvatar';

type CarHeaderProps = {
  profile: CarProfile;
  /** Botón arriba a la derecha (⚙️ Configuración). */
  action?: ReactNode;
};

/** Encabezado de "Mi carro": la foto del carro (opcional) o su ícono, marca/modelo y datos cortos. */
export function CarHeader({ profile, action }: CarHeaderProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const carPhoto = useCarPhoto();
  const details = [
    profile.year ? String(profile.year) : undefined,
    profile.displacementCc ? `${profile.displacementCc} cc` : undefined,
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      {/* La foto del carro (opcional): con foto se ve en grande; sin foto, el menú para ponerla. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={carPhoto.photo ? 'Ver la foto de tu carro' : 'Ponerle foto a tu carro (opcional)'}
        onPress={carPhoto.onPhotoPress}>
        <CarAvatar
          photo={carPhoto.photo}
          size={88}
          radius={radius.lg}
          fallback={
            <View style={styles.avatar}>
              <Icon name="car" size={48} color={colors.brand.accent} />
              <View style={styles.cameraBadge}>
                <Icon name="camera" size={14} color={colors.brand.onPrimary} />
              </View>
            </View>
          }
        />
      </Pressable>
      {carPhoto.sheet}
      <View style={styles.texts}>
        {profile.nickname && (
          <AppText variant="captionStrong" tone="brand">
            “{profile.nickname}”
          </AppText>
        )}
        <AppText variant="title">
          {profile.brandName} {profile.model}
        </AppText>
        {details.length > 0 && <AppText tone="secondary">{details.join(' · ')}</AppText>}
        <View style={styles.plate}>
          <AppText variant="captionStrong" tone={profile.plate ? 'primary' : 'muted'}>
            {profile.plate ? `Placa ${profile.plate}` : 'Placa sin registrar'}
          </AppText>
        </View>
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  action: {
    alignSelf: 'flex-start',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  plate: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
