import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, radius, sizes, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Chip, Icon, InfoButton } from '@/shared/ui';

import type { ApplicableCategory, ApplicableItem } from '../applicability';
import { maintenanceHintsText, OTHER_MAINTENANCE, type MaintenanceCategoryCode, type MaintenanceItemCode } from '../catalog';

type MaintenancePickerProps = {
  /** Catálogo ya filtrado para el vehículo (applicableCategories): lo que no aplica no llega aquí. */
  categories: ApplicableCategory[];
  selected: MaintenanceItemCode[];
  onToggle: (code: MaintenanceItemCode) => void;
  /** Categorías que no existen en este carro (p. ej. refrigeración). */
  notApplicable: MaintenanceCategoryCode[];
  onToggleNotApplicable: (category: MaintenanceCategoryCode) => void;
  /** Categoría abierta al entrar (p. ej. al venir desde "Llantas"). */
  initialExpanded?: MaintenanceCategoryCode;
};

/**
 * Selector de mantenimientos en acordeón: categorías cerradas y solo una abierta a
 * la vez, para no mostrar todas las opciones de golpe. "Otro" va al final.
 * Lo que "depende de tu carro" se muestra aparte y rotulado, nunca como obligatorio.
 */
export function MaintenancePicker({
  categories,
  selected,
  onToggle,
  notApplicable,
  onToggleNotApplicable,
  initialExpanded,
}: MaintenancePickerProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [expanded, setExpanded] = useState<MaintenanceCategoryCode | null>(initialExpanded ?? null);
  const otherSelected = selected.includes(OTHER_MAINTENANCE.code);

  return (
    <Card flush>
      {categories.map((category, index) => {
        const isOpen = expanded === category.code;
        const isNotApplicable = notApplicable.includes(category.code);
        const count = category.items.filter(({ item }) => selected.includes(item.code)).length;
        const sure = category.items.filter((entry) => entry.applicability === 'applies');
        const maybe = category.items.filter((entry) => entry.applicability === 'maybe');
        // ⓘ "¿Qué es cada uno?": solo con la categoría abierta, si aplica y tiene explicaciones.
        const hints = isOpen && !isNotApplicable ? maintenanceHintsText(category.items.map(({ item }) => item)) : undefined;
        const renderChips = (entries: ApplicableItem[]) => (
          <View style={styles.chips}>
            {entries.map(({ item }) => {
              const isSelected = selected.includes(item.code);
              return (
                <Chip
                  key={item.code}
                  label={item.label}
                  icon={isSelected ? 'check' : undefined}
                  selected={isSelected}
                  onPress={() => onToggle(item.code)}
                />
              );
            })}
          </View>
        );

        return (
          <Fragment key={category.code}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${category.label}${count ? `, ${count} seleccionados` : ''}`}
              onPress={() => setExpanded(isOpen ? null : category.code)}
              style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
              <View style={[styles.headerIcon, isNotApplicable && styles.headerIconMuted]}>
                <Icon
                  name={category.icon}
                  size={sizes.iconMd}
                  color={isNotApplicable ? colors.text.muted : colors.brand.accent}
                />
              </View>
              <View style={styles.headerTexts}>
                <AppText variant="bodyStrong" tone={isNotApplicable ? 'muted' : 'primary'}>
                  {category.label}
                </AppText>
                {isNotApplicable && (
                  <AppText variant="caption" tone="muted">
                    No aplica a tu carro
                  </AppText>
                )}
              </View>
              {count > 0 && (
                <View style={styles.countBadge}>
                  <AppText variant="captionStrong" tone="inverse">
                    {count}
                  </AppText>
                </View>
              )}
              {hints && <InfoButton title="¿Qué es cada uno?" message={hints} />}
              <Icon name={isOpen ? 'expandLess' : 'expandMore'} color={colors.text.muted} />
            </Pressable>

            {isOpen && (
              <View style={styles.body}>
                {isNotApplicable ? (
                  <View style={styles.notApplicable}>
                    <AppText variant="caption" tone="secondary">
                      Marcaste que tu carro no tiene este sistema.
                    </AppText>
                    <Button
                      label="Sí aplica a mi carro"
                      variant="secondary"
                      onPress={() => onToggleNotApplicable(category.code)}
                    />
                  </View>
                ) : (
                  <>
                    {sure.length > 0 && renderChips(sure)}
                    {maybe.length > 0 && (
                      <>
                        <AppText variant="caption" tone="secondary">
                          Depende de tu carro (puede que no lo tenga):
                        </AppText>
                        {renderChips(maybe)}
                      </>
                    )}
                    {category.canBeNotApplicable && (
                      <Button
                        label="Mi carro no tiene este sistema"
                        variant="ghost"
                        onPress={() => onToggleNotApplicable(category.code)}
                      />
                    )}
                  </>
                )}
              </View>
            )}
          </Fragment>
        );
      })}

      <View style={styles.divider} />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: otherSelected }}
        onPress={() => onToggle(OTHER_MAINTENANCE.code)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
        <View style={styles.headerIcon}>
          <Icon name="more" size={sizes.iconMd} color={colors.brand.accent} />
        </View>
        <View style={styles.headerTexts}>
          <AppText variant="bodyStrong">{OTHER_MAINTENANCE.label}</AppText>
          <AppText variant="caption" tone="secondary">
            Algo que no está en la lista
          </AppText>
        </View>
        <Icon
          name={otherSelected ? 'checkboxOn' : 'checkboxOff'}
          color={otherSelected ? colors.brand.accent : colors.text.muted}
        />
      </Pressable>
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerPressed: {
    backgroundColor: colors.background,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconMuted: {
    backgroundColor: colors.background,
  },
  headerTexts: {
    flex: 1,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notApplicable: {
    gap: spacing.md,
    alignItems: 'flex-start',
  },
}));
