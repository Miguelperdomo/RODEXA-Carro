import { StyleSheet, View } from 'react-native';

import { BRAND } from '@/config/brand';
import { spacing } from '@/shared/theme';

import { AppText } from './AppText';

/**
 * Pie de página institucional, discreto (gris, pequeño).
 * Los datos legales/de contacto solo aparecen cuando existan en `BRAND.legal`.
 */
export function BrandFooter() {
  const { legal } = BRAND;
  const legalLines = [
    legal.nit && `NIT ${legal.nit}`,
    legal.address,
    legal.phone,
    legal.email,
    legal.website,
  ].filter(Boolean) as string[];

  return (
    <View style={styles.footer} accessibilityRole="text">
      <AppText variant="captionStrong" tone="muted" align="center">
        {BRAND.productName}
      </AppText>
      <AppText variant="caption" tone="muted" align="center">
        {BRAND.madeBy}
      </AppText>
      <AppText variant="caption" tone="muted" align="center">
        © {BRAND.copyrightYear} {BRAND.company}
      </AppText>
      <AppText variant="caption" tone="muted" align="center">
        {BRAND.footerDescription}
      </AppText>
      {legalLines.map((line) => (
        <AppText key={line} variant="caption" tone="muted" align="center">
          {line}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 2,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
