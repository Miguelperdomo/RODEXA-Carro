import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';

type SettingsSectionProps = {
  /** Título pequeño en mayúsculas ("APARIENCIA"). */
  title?: string;
  children: ReactNode;
  /** Nota pequeña debajo de la tarjeta. */
  footnote?: string;
};

/** Sección de Configuración: título + tarjeta con divisores automáticos entre filas. */
export function SettingsSection({ title, children, footnote }: SettingsSectionProps) {
  const styles = useStyles();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View>
      {title && (
        <AppText variant="captionStrong" tone="secondary" style={styles.title}>
          {title.toUpperCase()}
        </AppText>
      )}
      <Card flush>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            {row}
          </Fragment>
        ))}
      </Card>
      {footnote && (
        <AppText variant="caption" tone="muted" style={styles.footnote}>
          {footnote}
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  title: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  footnote: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
  },
}));
