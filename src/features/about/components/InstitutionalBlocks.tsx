import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Card, Icon, SectionHeader, type IconName } from '@/shared/ui';

const LOGO = require('../../../../assets/images/providentia-logo.png');
/** Proporción (ancho / alto) de providentia-logo.png. */
const LOGO_RATIO = 742 / 565;

/** Logo de Providentia Tech sobre una placa blanca (se lee igual en tema claro y oscuro). */
export function ProvidentiaLogo({ height = 150 }: { height?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.logoPlate} accessible accessibilityRole="image" accessibilityLabel="Logo de Providentia Tech">
      <Image source={LOGO} style={{ height, width: height * LOGO_RATIO }} contentFit="contain" />
    </View>
  );
}

/** Sección con título y párrafos. */
export function TextSection({ title, icon, paragraphs }: { title: string; icon?: IconName; paragraphs: readonly string[] }) {
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title={title} icon={icon} />
      <Card style={styles.paragraphs}>
        {paragraphs.map((text) => (
          <AppText key={text} tone="secondary">
            {text}
          </AppText>
        ))}
      </Card>
    </View>
  );
}

/** Aviso destacado (p. ej. Transparencia). */
export function NoticeCard({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Card tone="highlight" style={styles.paragraphs}>
      <View style={styles.noticeHeader}>
        <Icon name={icon} color={colors.brand.accent} />
        <AppText variant="bodyStrong" style={styles.flex}>
          {title}
        </AppText>
      </View>
      {children}
    </Card>
  );
}

/** Pastilla de estado ("Proyecto tecnológico en construcción"). */
export function StatusPill({ label }: { label: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      <Icon name="statusSoon" size={16} color={colors.brand.accent} />
      <AppText variant="captionStrong" tone="brand">
        {label}
      </AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  logoPlate: {
    alignSelf: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
  },
  paragraphs: {
    gap: spacing.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.soft,
  },
}));
