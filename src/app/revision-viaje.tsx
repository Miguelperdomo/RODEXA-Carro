import { router } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { readinessOf, tripHeadline } from '@/features/dashboard/readiness';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { itemKind } from '@/features/travel/checklist';
import { buildTripReview, preTripSuggestions, summarizeTrip, VERDICT_TEXT } from '@/features/travel/review';
import type { TripCheck, TripVerdict } from '@/features/travel/types';
import { useTravelProgress } from '@/features/travel/useTravelProgress';
import { createStyles, radius, sizes, spacing, useTheme, type StatusLevel } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, SectionHeader, StatusRow } from '@/shared/ui';
import { today } from '@/shared/utils/date';

const VERDICT_LEVEL: Record<TripVerdict, StatusLevel> = { attention: 'due', incomplete: 'nodata', ready: 'ok' };

/**
 * "Voy a viajar": revisión preventiva antes de salir. Arriba, la respuesta a "¿Mi carro
 * está listo?" según los registros; luego lo que requiere atención, lo que falta y lo
 * que está al día; al final, la revisión que el usuario marca. RODEXA no diagnostica.
 */
export default function TravelChecklistScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const data = useAppData();
  const review = useMemo(() => buildTripReview(data, today()), [data]);
  // Marcas guardadas mientras la revisión está en curso (se limpian al terminar).
  const { state, toggle, finish } = useTravelProgress();
  const [phase, setPhase] = useState<'check' | 'summary'>('check');
  const [showOk, setShowOk] = useState(false);
  const summary = summarizeTrip(review, state);
  const suggestions = preTripSuggestions(review);
  const { customReminders } = useSession();
  // Misma regla que Inicio: un documento obligatorio vencido manda; sin fecha, nunca "al día".
  const verdict = tripHeadline(
    { ...VERDICT_TEXT[review.verdict], level: VERDICT_LEVEL[review.verdict] as 'due' | 'nodata' | 'ok' },
    readinessOf(data, today(), customReminders),
  );
  const verdictStyle = colors.status[verdict.level];

  const byStatus = (status: TripCheck['status']) => review.checks.filter((c) => c.status === status);
  const attention = byStatus('attention').sort((a, b) => (a.level === 'due' ? 0 : 1) - (b.level === 'due' ? 0 : 1));
  const groups: { title: string; checks: TripCheck[]; collapsible?: boolean }[] = [
    { title: 'Requieren atención', checks: attention },
    { title: 'Sin datos', checks: byStatus('nodata') },
    { title: 'Al día', checks: byStatus('ok'), collapsible: true },
    { title: 'No aplica', checks: byStatus('na') },
  ];

  const renderCheck = (check: TripCheck, index: number) => (
    <Fragment key={check.id}>
      {index > 0 && <View style={styles.dividerIndented} />}
      <StatusRow
        status={check.level}
        title={check.title}
        icon={check.icon}
        statusLabel={check.label}
        detail={check.detail}
        onPress={check.href ? () => router.push(check.href!) : undefined}
      />
    </Fragment>
  );

  if (phase === 'summary') {
    const counts: { level: StatusLevel; label: string; value: number }[] = [
      { level: 'due', label: 'requieren atención', value: summary.attention },
      { level: 'nodata', label: 'sin datos', value: summary.noData },
      { level: 'ok', label: 'al día según tus registros', value: summary.ok },
    ];
    return (
      <FormScreen
        title="Voy a viajar"
        closeIcon="back"
        onClose={() => setPhase('check')}
        footer={
          <View style={styles.footer}>
            <Button label="Volver a la revisión" icon="checklist" fullWidth onPress={() => setPhase('check')} />
            <Button
              label="Terminar"
              variant="ghost"
              fullWidth
              onPress={async () => {
                // Revisión terminada: la próxima vez empieza de cero.
                await finish();
                router.back();
              }}
            />
          </View>
        }>
        <AppText variant="title">Resumen de tu revisión</AppText>
        <Card>
          {counts.map((c, index) => (
            <View key={c.level} style={[styles.countRow, index > 0 && styles.divider]}>
              <View style={[styles.countIcon, { backgroundColor: colors.status[c.level].background }]}>
                <Icon name={colors.status[c.level].icon} size={20} color={colors.status[c.level].color} />
              </View>
              <AppText variant="heading" numeric>
                {c.value}
              </AppText>
              <AppText tone="secondary">{c.label}</AppText>
            </View>
          ))}
        </Card>
        <AppText tone="secondary">
          {`Marcaste ${summary.manualChecked} de ${summary.manualTotal} puntos de la revisión.`}
        </AppText>

        {summary.recommendations.length > 0 && (
          <View>
            <SectionHeader title="Antes de salir" icon="recommendation" />
            <Card flush>
              {summary.recommendations.map((r, index) => (
                <Fragment key={`${r.level}-${r.text}`}>
                  {index > 0 && <View style={styles.dividerIndented} />}
                  <View style={styles.recommendation}>
                    <Icon name={colors.status[r.level].icon} size={20} color={colors.status[r.level].color} />
                    <AppText style={styles.flex}>{r.text}</AppText>
                  </View>
                </Fragment>
              ))}
            </Card>
          </View>
        )}

        <AppText variant="caption" tone="muted">
          RODEXA no comprueba físicamente tu carro: este resumen refleja tus registros y lo que marcaste.
          Ante cualquier duda, consulta a tu mecánico.
        </AppText>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Voy a viajar"
      closeIcon="back"
      footer={
        <Button
          label={`Ver resumen · ${summary.manualChecked}/${summary.manualTotal} revisados`}
          fullWidth
          onPress={() => setPhase('summary')}
        />
      }>
      {/* ¿Mi carro está listo para salir? — según los registros, nunca "OK" sin datos. */}
      <Card>
        <View style={styles.verdict}>
          <View style={[styles.verdictIcon, { backgroundColor: verdictStyle.background }]}>
            <Icon name={verdictStyle.icon} size={28} color={verdictStyle.color} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{verdict.title}</AppText>
            <AppText variant="caption" tone="secondary">
              {verdict.detail}
            </AppText>
            <AppText variant="caption" tone="muted">
              {`${summary.attention} con atención · ${summary.noData} sin datos · ${summary.ok} al día`}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Antes de un viaje largo: lo próximo o pendiente (el aceite primero). */}
      {suggestions.length > 0 && (
        <Card tone="highlight">
          <View style={styles.suggestionsHeader}>
            <Icon name="recommendation" color={colors.brand.accent} />
            <AppText variant="bodyStrong" style={styles.flex}>
              Antes de salir de viaje
            </AppText>
          </View>
          {suggestions.map((s) => (
            <View key={s.code} style={styles.suggestion}>
              <Icon name={colors.status[s.level].icon} size={20} color={colors.status[s.level].color} />
              <AppText style={styles.flex}>{s.text}</AppText>
            </View>
          ))}
          <Button
            label="Registrar mantenimiento"
            icon="maintenance"
            variant="secondary"
            onPress={() => router.push({ pathname: '/registrar/mantenimiento', params: { tipo: suggestions[0].code } })}
          />
        </Card>
      )}

      {groups
        .filter((g) => g.checks.length > 0)
        .map((group) => (
          <View key={group.title}>
            <SectionHeader title={group.title} caption={`${group.checks.length}`} />
            {group.collapsible && !showOk ? (
              <Button
                label={`Ver ${group.checks.length} puntos al día`}
                variant="ghost"
                onPress={() => setShowOk(true)}
              />
            ) : (
              <Card flush>{group.checks.map(renderCheck)}</Card>
            )}
          </View>
        ))}

      {review.info.length > 0 && (
        <View>
          <SectionHeader title="Energía" caption="Según tus registros" />
          <Card flush>
            {review.info.map((info, index) => (
              <Fragment key={info.id}>
                {index > 0 && <View style={styles.dividerIndented} />}
                <Pressable
                  accessibilityRole="button"
                  onPress={info.href ? () => router.push(info.href!) : undefined}
                  style={({ pressed }) => [styles.info, pressed && styles.pressed]}>
                  <Icon name={info.icon} color={colors.brand.accent} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{info.title}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {info.detail}
                    </AppText>
                  </View>
                </Pressable>
              </Fragment>
            ))}
          </Card>
        </View>
      )}

      <AppText tone="secondary">
        Revisa también estos puntos antes de salir. Son recomendaciones preventivas; marcar un punto
        significa que tú lo revisaste.
      </AppText>

      {review.sections.map((section) => (
        <View key={section.id}>
          <SectionHeader title={section.title} icon={section.icon} caption="Recomendado" />
          <Card flush>
            {section.items.map((item, index) => {
              const checked = !!state[item.id];
              return (
                <Fragment key={item.id}>
                  {index > 0 && <View style={styles.dividerIndented} />}
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`${item.label}: ${checked ? 'revisado' : 'pendiente'}`}
                    onPress={() => toggle(item.id)}
                    style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                    <Icon
                      name={checked ? 'checked' : 'unchecked'}
                      color={checked ? colors.status.ok.color : colors.text.muted}
                    />
                    <View style={styles.flex}>
                      <AppText>{item.label}</AppText>
                      {item.hint && (
                        <AppText variant="caption" tone="secondary">
                          {item.hint}
                        </AppText>
                      )}
                      {itemKind(item) === 'legal' && (
                        <AppText variant="caption" tone="secondary">
                          Requisito legal · {item.legalSource?.name}
                        </AppText>
                      )}
                    </View>
                    <AppText variant="captionStrong" tone={checked ? 'secondary' : 'muted'}>
                      {checked ? 'Revisado' : 'Pendiente'}
                    </AppText>
                  </Pressable>
                </Fragment>
              );
            })}
          </Card>
        </View>
      ))}
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  footer: {
    gap: spacing.xs,
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  verdictIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchMin + 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dividerIndented: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  countIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
}));
