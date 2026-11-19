import { router } from 'expo-router';
import { Fragment, useDeferredValue, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import { searchDestinations } from '../destinations';

/**
 * "¿Qué quieres hacer?": escribes "crédito", "varado" o "pico y placa" y aparece la pantalla
 * para abrirla con un toque. Funciona sin internet.
 */
export function AppSearch() {
  const { colors, textScale } = useTheme();
  const styles = useStyles();
  const [text, setText] = useState('');
  const query = useDeferredValue(text);
  const results = searchDestinations(query);
  const typing = query.trim().length >= 2;

  const go = (r: (typeof results)[number]) => {
    setText('');
    router.push(r.href);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <Icon name="search" size={20} color={colors.text.muted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="¿Qué quieres hacer? Ej.: crédito, varado"
          placeholderTextColor={colors.text.muted}
          style={[styles.input, { fontSize: 16 * textScale }]}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar en RODEXA"
          onSubmitEditing={() => results[0] && go(results[0])}
        />
        {text !== '' && (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10} onPress={() => setText('')}>
            <Icon name="close" size={20} color={colors.text.muted} />
          </Pressable>
        )}
      </View>

      {typing && (
        <View style={styles.results}>
          {results.length === 0 ? (
            <AppText variant="caption" tone="secondary" style={styles.empty}>
              No encontramos «{query.trim()}». Prueba con otra palabra.
            </AppText>
          ) : (
            results.map((r, index) => (
              <Fragment key={r.key}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}. ${r.description}`}
                  onPress={() => go(r)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <Icon name={r.icon} size={22} color={colors.brand.accent} />
                  <View style={styles.texts}>
                    <AppText variant="bodyStrong">{r.title}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {r.description}
                    </AppText>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.text.muted} />
                </Pressable>
              </Fragment>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  wrap: {
    gap: spacing.sm,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: colors.highContrast ? 56 : 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: colors.highContrast ? 2 : 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  results: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
  empty: {
    padding: spacing.lg,
  },
}));
