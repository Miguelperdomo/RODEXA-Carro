import { Image } from 'expo-image';
import { View } from 'react-native';

import { BRAND } from '@/config/brand';
import { createStyles, radius, useTheme } from '@/shared/theme';

import { AppText } from './AppText';

const LOGO_FULL = require('../../../assets/images/logo-full.png');
const LOGO_SYMBOL = require('../../../assets/images/logo-symbol.png');

/** Proporción (ancho / alto) de cada imagen del logo. */
const FULL_RATIO = 875 / 870;
const SYMBOL_RATIO = 646 / 607;

type BrandMarkProps = {
  /** "sm" encabezado de Inicio (en línea) · "lg" splash y pantallas de marca (apilado). */
  size?: 'sm' | 'lg';
  /** "light" sobre fondo claro · "onBrand" sobre fondo de color de marca. */
  tone?: 'light' | 'onBrand';
  /** Muestra solo el escudo, sin el nombre. */
  iconOnly?: boolean;
};

/**
 * Logo de RODEXA Carro. "lg": logo completo (escudo + "RODEXA Carro"); "sm": escudo con el
 * nombre al lado. El logo es azul sobre blanco: en tema oscuro o sobre color de marca va
 * sobre una placa blanca para que se lea.
 */
export function BrandMark({ size = 'sm', tone = 'light', iconOnly = false }: BrandMarkProps) {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const onPlate = isDark || tone === 'onBrand';

  if (size === 'lg') {
    const height = iconOnly ? 110 : 170;
    return (
      <View
        style={[styles.plateLarge, onPlate && styles.plate]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={BRAND.productName}>
        <Image
          source={iconOnly ? LOGO_SYMBOL : LOGO_FULL}
          style={{ height, width: height * (iconOnly ? SYMBOL_RATIO : FULL_RATIO) }}
          contentFit="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.row} accessible accessibilityLabel={BRAND.productName}>
      <View style={[styles.plateSmall, onPlate && styles.plate]}>
        <Image source={LOGO_SYMBOL} style={styles.symbolSmall} contentFit="contain" />
      </View>
      {!iconOnly && (
        <AppText
          variant="title"
          tone={tone === 'onBrand' ? 'inverse' : 'primary'}
          style={styles.master}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {BRAND.masterBrand}
          <AppText variant="title" color={tone === 'onBrand' ? colors.brand.onPrimaryMuted : colors.brand.accent}>
            {' '}
            {BRAND.productLine}
          </AppText>
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  plate: {
    backgroundColor: '#FFFFFF',
  },
  plateLarge: {
    alignSelf: 'center',
    borderRadius: 28,
    padding: 12,
  },
  plateSmall: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolSmall: {
    width: 32,
    height: 32 / SYMBOL_RATIO,
  },
  // En el encabezado cede espacio a los botones si la pantalla es angosta.
  master: {
    letterSpacing: 1,
    flexShrink: 1,
  },
}));
