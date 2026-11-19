import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keyboardLift, useKeyboardHeight } from '@/shared/hooks/useKeyboardHeight';
import { createStyles, radius, sizes, spacing, typography, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { reduceMotionNow } from '@/shared/hooks/useReduceMotion';

export type SelectOption = {
  value: string;
  label: string;
  /** Texto secundario, p. ej. el departamento de una ciudad. */
  description?: string;
  /** Opción visible pero no seleccionable (p. ej. "Próximamente"). */
  disabled?: boolean;
};

type OptionSheetProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  value: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  emptyText?: string;
  /** Se muestra buscador si hay más opciones que esto. */
  searchThreshold?: number;
  cancelLabel?: string;
};

/** Quita tildes y mayúsculas para buscar ("bogota" encuentra "Bogotá"). */
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Hoja de selección desde abajo (Modal de RN, sin librerías): buscador opcional,
 * opción actual marcada y botón Cancelar. La usan SelectField y las filas de Configuración.
 */
export function OptionSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  emptyText = 'Información no disponible',
  searchThreshold = 8,
  cancelLabel = 'Cancelar',
}: OptionSheetProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  // Teclado: se MIDE el área del Modal (algunos Android ya la achican, otros no) y la hoja
  // sube solo lo que falta para que el teclado no la tape.
  const keyboard = useKeyboardHeight();
  const [areaHeight, setAreaHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const onAreaLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setAreaHeight(height);
    setFullHeight((h) => Math.max(h, height));
  };
  const lift = keyboardLift(keyboard, fullHeight, areaHeight);
  const [query, setQuery] = useState('');
  const showSearch = options.length > searchThreshold;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter(
      (o) => normalize(o.label).includes(q) || normalize(o.description ?? '').includes(q),
    );
  }, [options, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const pick = (option: SelectOption) => {
    if (option.disabled) return;
    setQuery('');
    onSelect(option.value);
  };

  return (
    <Modal visible={visible} transparent animationType={reduceMotionNow() ? 'none' : 'slide'} onRequestClose={close}>
      <View style={styles.overlay} onLayout={onAreaLayout}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={cancelLabel} />
        <View
          style={[
            styles.sheet,
            keyboard > 0
              ? {
                  marginBottom: lift,
                  maxHeight: Math.max(0, (areaHeight || 600) - lift - insets.top) * 0.85,
                  paddingBottom: spacing.sm,
                }
              : { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <AppText variant="heading" style={styles.flex}>
              {title}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={close}
              style={styles.closeButton}>
              <Icon name="close" color={colors.text.primary} />
            </Pressable>
          </View>

          {showSearch && (
            <View style={styles.search}>
              <Icon name="search" size={20} color={colors.text.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar"
                placeholderTextColor={colors.text.muted}
                style={styles.searchInput}
                autoCorrect={false}
                accessibilityLabel="Buscar"
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            ListEmptyComponent={
              <AppText tone="muted" align="center" style={styles.empty}>
                {query ? 'No encontramos resultados' : emptyText}
              </AppText>
            }
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: item.disabled }}
                  disabled={item.disabled}
                  onPress={() => pick(item)}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}>
                  <View style={styles.flex}>
                    <AppText
                      variant={isSelected ? 'bodyStrong' : 'body'}
                      tone={item.disabled ? 'muted' : isSelected ? 'brand' : 'primary'}>
                      {item.label}
                    </AppText>
                    {item.description && (
                      <AppText variant="caption" tone="secondary">
                        {item.description}
                      </AppText>
                    )}
                  </View>
                  {isSelected && <Icon name="check" color={colors.brand.accent} />}
                </Pressable>
              );
            }}
          />

          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}>
            <AppText variant="bodyStrong" tone="brand">
              {cancelLabel}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  closeButton: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  list: {
    // Se achica cuando el teclado deja menos espacio (el buscador y Cancelar siguen visibles).
    flexGrow: 0,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.brand.soft,
  },
  optionPressed: {
    backgroundColor: colors.background,
  },
  empty: {
    padding: spacing.xl,
  },
  cancel: {
    minHeight: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
