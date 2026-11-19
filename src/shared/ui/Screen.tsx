import { useCallback, useRef, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useScrollToTopOnTab } from '@/shared/navigation/useScrollToTopOnTab';
import { createStyles, sizes, spacing } from '@/shared/theme';

type ScreenProps = {
  children: ReactNode;
  /** Permite desplazar el contenido verticalmente. */
  scroll?: boolean;
  /** Aplica el margen lateral estándar (16). */
  padded?: boolean;
  /**
   * Bordes donde se respeta la zona segura. Por defecto solo arriba:
   * abajo la barra de pestañas ya se encarga de la barra de gestos.
   */
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Solo pantallas de la barra de abajo (con `scroll`): al llegar desde la barra empieza
   * arriba y al tocar la pestaña actual sube con animación (ver useScrollToTopOnTab).
   */
  scrollToTopOnTab?: boolean;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  scrollToTopOnTab = false,
}: ScreenProps) {
  const styles = useStyles();
  const scrollRef = useRef<ScrollView>(null);
  const scrollToTop = useCallback((animated: boolean) => scrollRef.current?.scrollTo({ y: 0, animated }), []);
  useScrollToTopOnTab(scroll && scrollToTopOnTab, scrollToTop);
  const content = [padded && styles.padded, contentStyle];

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, content]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  padded: {
    paddingHorizontal: sizes.screenPadding,
  },
}));
