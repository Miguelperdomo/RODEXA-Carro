import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarView } from '@/features/calendar/components/CalendarView';
import { energyRecordKinds } from '@/features/cars/energy';
import { ENERGY_META, energyTitle } from '@/features/energy/meta';
import { HistoryRow } from '@/features/history/components/HistoryRow';
import { describeEntry, entryCost, groupByMonth } from '@/features/history/presentation';
import { historyTotals, matchesQuery } from '@/features/history/search';
import { categoryLabel, categoryOf } from '@/features/stats/compute';
import type { EnergyKind, HistoryEntry, HistoryKind } from '@/features/history/types';
import { useAppData } from '@/features/session/SessionProvider';
import { SettingsButton } from '@/features/settings/components/SettingsButton';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useScrollToTopOnTab } from '@/shared/navigation/useScrollToTopOnTab';
import { createStyles, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Button, Chip, EmptyState, SectionHeader, SegmentedControl, TextField } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';

type Filter = 'all' | HistoryKind;

const ENERGY_KINDS: EnergyKind[] = ['fuel', 'cng', 'charge'];
const isEnergyKind = (kind: Filter): kind is EnergyKind => ENERGY_KINDS.includes(kind as EnergyKind);

const OTHER_FILTERS: { value: Filter; label: string }[] = [
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'expense', label: 'Gastos' },
  { value: 'odometer', label: 'Kilometraje' },
  { value: 'document', label: 'Documentos' },
];

type Section = { key: string; title: string; caption?: string; data: HistoryEntry[] };

/**
 * Historial por mes, con filtros, buscador y totales. Es una lista VIRTUALIZADA: solo se
 * dibujan los registros que se ven en pantalla (con miles de registros sigue fluido).
 */
export default function HistoryScreen() {
  const styles = useStyles();
  const { settings, update } = useSettings();
  const { vista, categoria } = useLocalSearchParams<{ vista?: string; categoria?: string }>();
  // Se recuerda el filtro y la vista que dejó elegidos.
  const [filter, setFilterState] = useState<Filter>((settings.historyFilter as Filter) || 'all');
  const setFilter = (next: Filter) => {
    setFilterState(next);
    update({ historyFilter: next === 'all' ? '' : next });
  };
  const [view, setViewState] = useState<'list' | 'calendar'>(
    vista === 'calendario' || settings.historyView === 'calendar' ? 'calendar' : 'list',
  );
  const setView = (next: 'list' | 'calendar') => {
    setViewState(next);
    update({ historyView: next });
  };
  // "Calendario" desde Mi carro o el buscador abre esa vista (también si la pestaña ya estaba abierta).
  const [seenVista, setSeenVista] = useState(vista);
  if (vista !== seenVista) {
    setSeenVista(vista);
    if (vista === 'calendario') setViewState('calendar');
  }
  // Desde Estadísticas: "ver los gastos de esta categoría" (se quita con la X).
  const [category, setCategory] = useState<string | undefined>(categoria);
  const [seenCategoria, setSeenCategoria] = useState(categoria);
  if (categoria !== seenCategoria) {
    setSeenCategoria(categoria);
    setCategory(categoria);
    if (categoria) setViewState('list');
  }
  const [query, setQuery] = useState('');
  // Llegar desde la barra de abajo → arriba; tocar Historial estando aquí → sube con animación.
  const listRef = useRef<SectionList<HistoryEntry, Section>>(null);
  const scrollToTop = useCallback(
    (animated: boolean) => listRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated }),
    [],
  );
  useScrollToTopOnTab(true, scrollToTop);

  const { history, profile } = useAppData();
  // Filtros de energía: lo que el carro puede registrar + lo que ya tiene registrado (nunca se esconden datos).
  const allowed = energyRecordKinds(profile);
  const energyFilters = ENERGY_KINDS.filter((k) => allowed.includes(k) || history.some((e) => e.kind === k)).map(
    (k) => ({ value: k as Filter, label: energyTitle(k, profile.energySource) }),
  );
  const filters = [{ value: 'all' as Filter, label: 'Todo' }, ...energyFilters, ...OTHER_FILTERS];
  // Un filtro guardado que ya no existe (p. ej. cambió la energía del carro) vuelve a "Todo".
  if (!filters.some((f) => f.value === filter) && filter !== 'all') setFilterState('all');
  const entries = (filter === 'all' ? history : history.filter((e) => e.kind === filter))
    .filter((e) => !category || (entryCost(e) > 0 && categoryOf(e) === category))
    .filter((e) => matchesQuery(e, query, profile.energySource));
  const totals = historyTotals(entries);
  const filterLabel = filters.find((f) => f.value === filter)?.label ?? 'Todo';
  const searching = query.trim() !== '';
  const showTotals = filter === 'all' || filter === 'expense' || filter === 'maintenance' || isEnergyKind(filter);
  const carName = [profile.brandName, profile.model].filter(Boolean).join(' ') || 'Mi carro';

  const sections: Section[] = groupByMonth(entries).map((group) => ({
    key: group.key,
    title: group.label,
    caption: showTotals && group.totalCop > 0 ? formatCop(group.totalCop) : undefined,
    data: group.entries,
  }));

  const open = (entry: HistoryEntry) =>
    router.push(
      isEnergyKind(entry.kind)
        ? { pathname: '/energia/[id]', params: { id: entry.id } }
        : { pathname: '/registro/[id]', params: { id: entry.id } },
    );

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <View style={[styles.header, styles.flex]}>
          <AppText variant="title">Historial</AppText>
          <AppText tone="secondary">{carName}</AppText>
        </View>
        <SettingsButton />
      </View>

      <View style={styles.viewSwitch}>
        <SegmentedControl
          options={[
            { value: 'list', label: 'Lista' },
            { value: 'calendar', label: 'Calendario' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersBar}
        contentContainerStyle={styles.filters}
        keyboardShouldPersistTaps="handled">
        {filters.map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      {category && (
        <View style={styles.search}>
          <Chip label={`${categoryLabel(category)}  ✕`} selected onPress={() => setCategory(undefined)} />
        </View>
      )}

      <View style={styles.search}>
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="Buscar: aceite, Terpel, SOAT…"
          maxLength={60}
          accessibilityLabel="Buscar en el historial"
        />
        {(searching || filter !== 'all') && entries.length > 0 && (
          <AppText variant="caption" tone="secondary" numeric>
            {filterLabel}
            {searching ? ` con “${query.trim()}”` : ''}: {totals.count} {totals.count === 1 ? 'registro' : 'registros'}
            {showTotals && totals.totalCop > 0 ? ` · ${formatCop(totals.totalCop)}` : ''}
          </AppText>
        )}
      </View>
    </View>
  );

  const empty =
    isEnergyKind(filter) && allowed.includes(filter) && !searching ? (
      <EmptyState
        icon={ENERGY_META[filter].icon}
        title={ENERGY_META[filter].emptyTitle}
        message="Con tus registros, RODEXA podrá calcular cuánto gastas y cuánto consume tu carro."
        action={
          <Button
            label={`Registrar ${ENERGY_META[filter].action.toLowerCase()}`}
            icon={ENERGY_META[filter].icon}
            onPress={() => router.push({ pathname: '/registrar/energia', params: { tipo: filter } })}
          />
        }
      />
    ) : searching ? (
      <EmptyState icon="search" title="Sin resultados" message={`No encontramos registros con “${query.trim()}”.`} />
    ) : filter === 'all' ? (
      <EmptyState
        icon="history"
        title="Aún no hay registros"
        message="Tus cargas de combustible o energía, mantenimientos, gastos y documentos aparecerán aquí."
        action={<Button label="Registrar algo" icon="add" onPress={() => router.push('/nuevo')} />}
      />
    ) : (
      <EmptyState icon="history" title="Sin registros" message="Aún no hay registros de este tipo." />
    );

  if (view === 'calendar') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBlock}>
            <View style={styles.titleRow}>
              <View style={[styles.header, styles.flex]}>
                <AppText variant="title">Historial</AppText>
                <AppText tone="secondary">{carName}</AppText>
              </View>
              <SettingsButton />
            </View>
            <View style={styles.viewSwitch}>
              <SegmentedControl
                options={[
                  { value: 'list', label: 'Lista' },
                  { value: 'calendar', label: 'Calendario' },
                ]}
                value={view}
                onChange={setView}
              />
            </View>
            <View style={styles.viewSwitch}>
              <CalendarView />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(entry) => entry.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.emptyBox}>{empty}</View>}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <SectionHeader title={section.title} caption={section.caption} />
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            // Cada registro abre su detalle (editar/eliminar); los tanqueos, el suyo con el consumo.
            <Pressable
              accessibilityRole="button"
              onPress={() => open(item)}
              style={({ pressed }) => [
                styles.item,
                first && styles.itemFirst,
                last && styles.itemLast,
                !first && styles.itemDivider,
                pressed && styles.pressed,
              ]}>
              <HistoryRow view={describeEntry(item, profile.energySource)} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerBlock: {
    gap: spacing.lg,
  },
  viewSwitch: {
    paddingHorizontal: sizes.screenPadding,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: spacing.lg,
  },
  // La fila de filtros no debe crecer: sin esto el ScrollView horizontal ocupa todo el alto
  // disponible y estira los botones.
  filtersBar: {
    flexGrow: 0,
  },
  filters: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: sizes.screenPadding,
  },
  search: {
    gap: spacing.xs,
    paddingHorizontal: sizes.screenPadding,
  },
  sectionHeader: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: spacing.xl,
  },
  emptyBox: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: spacing.xl,
  },
  // Cada fila forma parte de la "tarjeta" del mes: bordes laterales y esquinas en la primera y la última.
  item: {
    marginHorizontal: sizes.screenPadding,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  itemFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  itemLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
}));
