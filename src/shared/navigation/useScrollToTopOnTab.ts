import { useNavigation } from 'expo-router';
import { useEffect } from 'react';

/**
 * Las pestañas se quedan montadas en segundo plano y conservan su posición: al volver por la
 * barra de abajo aparecían a mitad de pantalla. Con este hook:
 * - llegar a la pestaña desde la barra → empieza ARRIBA, sin animación;
 * - tocar la pestaña en la que ya estás → sube al inicio con animación;
 * - volver de un detalle con la flecha atrás → conserva la posición (no se usa "blur").
 *
 * Escucha 'tabPress', que la barra (TabBar) emite ANTES de cambiar de pestaña; por eso
 * `isFocused()` dice si ya estaba en esta pestaña. Solo para pantallas de la barra de abajo.
 */
export function useScrollToTopOnTab(enabled: boolean, scrollToTop: (animated: boolean) => void) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!enabled) return;
    return navigation.addListener('tabPress' as never, () => scrollToTop(navigation.isFocused()));
  }, [enabled, navigation, scrollToTop]);
}
