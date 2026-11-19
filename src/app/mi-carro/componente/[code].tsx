import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { buildComponentDetail, type Tracking } from '@/features/cars/componentDetail';
import { PARTS_FOR_COMPONENT } from '@/features/parts/catalog';
import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, maintenanceStatusLabels, radius, spacing, useTheme } from '@/shared/theme';
import {
  ActionRow,
  AppText,
  Button,
  Card,
  EmptyState,
  FormScreen,
  Icon,
  InfoRow,
  SectionHeader,
} from '@/shared/ui';
import { today } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';

const TRACKING_TEXT: Record<Tracking, string> = {
  km: 'Se controla por kilometraje',
  time: 'Se controla por tiempo (meses)',
  both: 'Se controla por kilometraje y tiempo: lo que llegue primero',
};
const PLAN_TITLE: Record<Tracking, string> = {
  km: 'Plan por kilometraje',
  time: 'Plan por tiempo',
  both: 'Plan por kilometraje y tiempo',
};

export default function ComponentDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { components, history, odometer } = useAppData();
  const component = components.find((c) => c.code === code);

  if (!component) {
    return (
      <FormScreen title="Componente" closeIcon="back">
        <EmptyState icon="statusNoData" title="No encontramos este componente" />
      </FormScreen>
    );
  }

  // Datos ficticios; con SQLite saldrán de service_plans + maintenance_records.
  const detail = buildComponentDetail(component, history, odometer.registeredKm, today());
  const style = colors.status[component.status];
  const statusLabel = component.enabled ? maintenanceStatusLabels[component.status] : 'Sin activar';
  const isTires = component.code === 'tires';

  const goConfigure = () =>
    router.push({ pathname: '/mi-carro/configurar/[code]', params: { code: component.code } });
  const goRegister = () =>
    router.push({ pathname: '/registrar/mantenimiento', params: { tipo: component.code } });

  // Repuestos relacionados: uno solo → directo a su pantalla; varios → lista filtrada.
  const relatedParts = PARTS_FOR_COMPONENT[component.code];
  const goParts = () => {
    if (!relatedParts) return;
    if (relatedParts.length === 1) {
      router.push({ pathname: '/repuestos/[code]', params: { code: relatedParts[0] } });
    } else {
      router.push({ pathname: '/repuestos', params: { componente: component.code } });
    }
  };

  return (
    <FormScreen
      title={component.title}
      closeIcon="back"
      footer={
        !component.enabled ? (
          <Button label="Activar y configurar" icon="add" fullWidth onPress={goConfigure} />
        ) : detail.ready ? (
          <View style={styles.footer}>
            <Button label="Registrar mantenimiento" icon="maintenance" fullWidth onPress={goRegister} />
            <Button label="Configurar intervalo" variant="ghost" fullWidth onPress={goConfigure} />
          </View>
        ) : (
          <View style={styles.footer}>
            <Button label="Completar datos" icon="note" fullWidth onPress={goConfigure} />
            <Button label="Registrar mantenimiento" variant="ghost" fullWidth onPress={goRegister} />
          </View>
        )
      }>
      {/* Estado */}
      <Card>
        <View style={styles.statusRow}>
          <View style={[styles.statusIcon, { backgroundColor: style.background }]}>
            <Icon name={component.icon} size={32} color={style.color} />
          </View>
          <View style={styles.statusTexts}>
            <View style={[styles.pill, { backgroundColor: style.background }]}>
              <AppText variant="captionStrong" color={style.color}>
                {statusLabel}
              </AppText>
            </View>
            <AppText variant="bodyStrong" numeric>
              {!component.enabled
                ? 'Sin activar'
                : detail.ready
                  ? detail.remaining
                  : 'Faltan datos para calcular el estado'}
            </AppText>
            <AppText variant="caption" tone="muted">
              {TRACKING_TEXT[detail.tracking]}
              {detail.tracking !== 'time' ? ` · registrado: ${formatKm(odometer.registeredKm)}` : ''}
            </AppText>
          </View>
        </View>
      </Card>

      {!component.enabled ? (
        <Card tone="highlight">
          <AppText variant="bodyStrong">Aún no controlas este componente</AppText>
          <AppText tone="secondary" style={styles.paragraph}>
            {component.applicability === 'maybe'
              ? 'Puede que no aplique a tu carro: depende del modelo o de datos que aún no confirmaste. Actívalo solo si tu carro lo tiene.'
              : 'Actívalo para verlo en el estado de tu carro y recibir avisos cuando se acerque su mantenimiento.'}
          </AppText>
        </Card>
      ) : (
        <>
          {/* Último mantenimiento */}
          <View>
            <SectionHeader title="Último mantenimiento" />
            <Card>
              {detail.lastService ? (
                <>
                  <InfoRow label="Qué se hizo" value={detail.lastService.title} />
                  <InfoRow label="Fecha" value={detail.lastService.date} divider />
                  <InfoRow label="Kilometraje" value={detail.lastService.km} divider />
                  {detail.lastService.kmSince !== undefined && (
                    <InfoRow
                      label={isTires ? 'Km con estas llantas' : 'Km desde entonces'}
                      value={formatKm(detail.lastService.kmSince)}
                      divider
                    />
                  )}
                  {detail.lastService.cost && (
                    <InfoRow label="Costo" value={detail.lastService.cost} divider />
                  )}
                  {detail.lastService.note && (
                    <AppText variant="caption" tone="muted" style={styles.note}>
                      {detail.lastService.note}
                    </AppText>
                  )}
                </>
              ) : (
                <AppText tone="secondary">Aún no hay un mantenimiento registrado.</AppText>
              )}
            </Card>
          </View>

          {/* Plan / intervalo */}
          <View>
            <SectionHeader title={PLAN_TITLE[detail.tracking]} />
            <Card>
              <InfoRow label="Intervalo" value={detail.interval} />
              {detail.intervalOrigin && <InfoRow label="Origen" value={detail.intervalOrigin} divider />}
              {detail.ready && (
                <>
                  <InfoRow label="Próximo" value={detail.next} divider />
                  <InfoRow label="Te avisamos" value={detail.warn} divider />
                </>
              )}
              {detail.partialNote && (
                <AppText variant="caption" tone="secondary" style={styles.note}>
                  {detail.partialNote}
                </AppText>
              )}
              {detail.intervalHint && (
                <AppText variant="caption" tone="secondary" style={styles.note}>
                  {detail.intervalHint}
                </AppText>
              )}
            </Card>
          </View>

          {/* Qué falta registrar */}
          {!detail.ready && (
            <Card tone="highlight">
              <AppText variant="bodyStrong">Para calcular el estado, RODEXA Carro necesita:</AppText>
              <View style={styles.requirements}>
                {detail.requirements.map((req) => (
                  <View key={req.label} style={styles.requirement}>
                    <Icon
                      name={req.done ? 'checkboxOn' : 'checkboxOff'}
                      size={20}
                      color={req.done ? colors.brand.accent : colors.text.muted}
                    />
                    <AppText tone={req.done ? 'secondary' : 'primary'} style={styles.flex}>
                      {req.label}
                    </AppText>
                  </View>
                ))}
              </View>
              <AppText variant="caption" tone="secondary">
                Toca “Completar datos” abajo. Mientras falte algo, se mostrará como “Sin datos”.
              </AppText>
            </Card>
          )}
        </>
      )}

      {relatedParts && (
        <Card flush>
          <ActionRow
            icon="partsCatalog"
            label="Ver opciones para mi carro"
            description="Especificación, repuestos y talleres · vista previa"
            onPress={goParts}
          />
        </Card>
      )}

      <View style={styles.disclaimer}>
        <Icon name="info" size={18} color={colors.text.secondary} />
        <AppText variant="caption" tone="secondary" style={styles.flex}>
          {isTires
            ? 'RODEXA Carro no calcula cuánto dura una llanta: depende del uso, la carga, la presión y las vías. Si tu mecánico te recomendó revisarla cada cierto kilometraje, configúralo como intervalo.'
            : 'RODEXA Carro no revisa la pieza: solo compara tus registros con el intervalo que configuraste. Verifica el manual de tu carro o consulta a tu mecánico.'}
        </AppText>
      </View>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  footer: {
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  paragraph: {
    marginTop: spacing.xs,
  },
  note: {
    marginTop: spacing.sm,
  },
  requirements: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
