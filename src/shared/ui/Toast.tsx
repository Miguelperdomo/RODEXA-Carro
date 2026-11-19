import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reduceMotionNow } from '@/shared/hooks/useReduceMotion';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

/** Acción opcional del aviso (p. ej. "Deshacer"). */
export type ToastAction = { label: string; onPress: () => void };

type ToastValue = { show: (message: string, action?: ToastAction) => void };

const ToastContext = createContext<ToastValue>({ show: () => {} });

const VISIBLE_MS = 2000;
/** Con "Deshacer" se deja más tiempo para alcanzar a tocarlo. */
const VISIBLE_WITH_ACTION_MS = 5000;

/** Aviso breve de confirmación ("Perfil actualizado"). Uno a la vez, sin librerías. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastAction | null>(null);
  const opacity = useState(() => new Animated.Value(0))[0];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, next?: ToastAction) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      setAction(next ?? null);
      // Sin animaciones si el celular las apaga.
      const still = reduceMotionNow();
      if (still) opacity.setValue(1);
      else Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(
        () => {
          const hide = () => {
            setMessage(null);
            setAction(null);
          };
          if (still) hide();
          else Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(hide);
        },
        next ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS,
      );
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <View pointerEvents={action ? 'box-none' : 'none'} style={[styles.wrapper, { bottom: insets.bottom + 96 }]}>
          <Animated.View
            style={[styles.toast, { opacity }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert">
            <Icon name="check" size={18} color={colors.status.ok.color} />
            <AppText variant="captionStrong" style={styles.text}>
              {message}
            </AppText>
            {action && (
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => {
                  if (timer.current) clearTimeout(timer.current);
                  setMessage(null);
                  setAction(null);
                  action.onPress();
                }}>
                <AppText variant="captionStrong" tone="brand">
                  {action.label}
                </AppText>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  return useContext(ToastContext);
}

const useStyles = createStyles((colors) => ({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    flexShrink: 1,
  },
}));
