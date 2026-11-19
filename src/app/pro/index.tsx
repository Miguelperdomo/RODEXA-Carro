import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useProAccess } from '@/features/pro/access';
import {
  PRO_COMPARISON,
  PRO_FAQ,
  PRO_FEATURES,
  PRO_GROUPS,
  PRO_HEADLINE,
  PRO_MONTHLY_PRICE,
  PRO_MONTHLY_PRICE_PER_YEAR,
  PRO_TRIAL_DAYS,
  PRO_YEARLY_MONTHLY_EQUIVALENT,
  PRO_YEARLY_PRICE,
  PRO_YEARLY_SAVINGS,
} from '@/features/pro/config';
import { useAppData } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, useToast, type IconName } from '@/shared/ui';
import { formatCop } from '@/shared/utils/format';

/** Dorado de "Pro" (el mismo amarillo de la placa). Fijo: se ve igual en tema claro u oscuro. */
const GOLD = '#F5C400';
const ON_GOLD = '#111111';

/**
 * RODEXA Carro Pro — PRÓXIMAMENTE. Presenta lo que incluirá Pro, la comparación con la
 * versión gratuita y los precios futuros (informativos). No hay compra ni suscripción:
 * ningún botón compra nada. Nada inventado: ni opiniones de usuarios ni cifras de ahorro falsas.
 */
export default function ProScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { history } = useAppData();
  // Solo en la vista previa de desarrollo (access.ts) se pueden abrir las pantallas Pro.
  const preview = useProAccess().isPro;
  const records = history.length;
  const { settings, update } = useSettings();
  const toast = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <FormScreen
      title="RODEXA Carro Pro"
      closeIcon="back"
      footer={
        <View style={styles.footer}>
          <AppText variant="caption" tone="secondary" style={styles.center}>
            Disponible próximamente. Todavía no se puede comprar ni suscribirse.
          </AppText>
          {/* "Avísame cuando salga": la app lo recuerda y, cuando Pro exista, se lo muestra primero. */}
          {settings.proNotifyMe ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Te avisaremos cuando salga. Toca para dejar de avisarte."
              onPress={() => update({ proNotifyMe: false })}
              style={styles.notified}>
              <Icon name="checked" size={20} color={colors.brand.accent} />
              <AppText variant="bodyStrong" tone="brand">
                Te avisaremos cuando salga
              </AppText>
            </Pressable>
          ) : (
            <Button
              label="Avísame cuando salga"
              icon="notifications"
              fullWidth
              onPress={() => {
                update({ proNotifyMe: true });
                toast.show('Te avisaremos cuando salga RODEXA Pro');
              }}
            />
          )}
          <Button label="Entendido" variant="secondary" fullWidth onPress={() => router.back()} />
        </View>
      }>
      {/* 1. Encabezado */}
      <View style={styles.hero}>
        {/* Círculos decorativos de fondo. */}
        <View style={[styles.bubble, styles.bubbleBig]} />
        <View style={[styles.bubble, styles.bubbleSmall]} />
        <View style={styles.goldBadge}>
          <AppText variant="captionStrong" color={ON_GOLD}>
            ✦ PRÓXIMAMENTE
          </AppText>
        </View>
        <AppText variant="display" color={colors.brand.onPrimary}>
          RODEXA Pro
        </AppText>
        <AppText variant="bodyStrong" color={colors.brand.onPrimary}>
          {PRO_HEADLINE}
        </AppText>
        <AppText variant="caption" color={colors.brand.onPrimaryMuted}>
          Todo lo de la versión gratis, más herramientas para ahorrar, ganar y cuidar mejor tu carro.
        </AppText>
        <View style={styles.trialPill}>
          <AppText variant="captionStrong" color={ON_GOLD}>
            {PRO_TRIAL_DAYS} días de prueba gratis
          </AppText>
        </View>
        <View style={styles.heroChips}>
          {['Varios carros', 'Modo trabajador', 'Sin anuncios'].map((chip) => (
            <View key={chip} style={styles.heroChip}>
              <AppText variant="captionStrong" color={colors.brand.onPrimary}>
                {chip}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {preview && (
        <Card tone="highlight">
          <AppText variant="captionStrong" tone="brand">
            Vista previa Pro (solo desarrollo)
          </AppText>
          <AppText variant="caption" tone="secondary">
            Las funciones Pro están abiertas en esta copia local. No es una suscripción.
          </AppText>
        </Card>
      )}

      {/* 2. Con tus propios datos (bloqueado): la persona ve que Pro ya sabe cosas de SU carro. */}
      <Card>
        <View style={styles.teaserHead}>
          <Icon name="lock" size={20} color={colors.brand.accent} />
          <AppText variant="heading" style={styles.flex}>
            Lo que Pro haría con tus datos
          </AppText>
        </View>
        <AppText variant="caption" tone="secondary">
          {records > 0
            ? `Ya tienes ${records} ${records === 1 ? 'registro' : 'registros'} en RODEXA. Con Pro se convierten en:`
            : 'Con lo que registres, Pro te mostraría:'}
        </AppText>
        <View style={styles.teaserList}>
          <LockedRow label="Lo que te ha costado tu carro" value="$ ▒▒▒.▒▒▒" />
          <LockedRow label="Aparta al mes para el SOAT" value="$ ▒▒.▒▒▒" />
          <LockedRow label="Tus gastos en 12 meses" value="▁▃▅▂▆▄" />
        </View>
      </Card>

      {/* 3. Precios (informativos: nada se puede comprar todavía) */}
      <View style={styles.group}>
        <View style={styles.titleRow}>
          <AppText variant="heading" style={styles.flex}>
            Precios
          </AppText>
          <View style={[styles.tag, { backgroundColor: colors.brand.soft }]}>
            <AppText variant="captionStrong" tone="brand">
              Disponible próximamente
            </AppText>
          </View>
        </View>
        <View style={styles.plans}>
          <PriceCard
            title="Mensual"
            price={formatCop(PRO_MONTHLY_PRICE)}
            period="/ mes"
            lines={[`${formatCop(PRO_MONTHLY_PRICE_PER_YEAR)} al año pagando mes a mes`]}
          />
          <PriceCard
            highlighted
            title="Anual"
            price={formatCop(PRO_YEARLY_PRICE)}
            period="/ año"
            lines={[`≈ ${formatCop(PRO_YEARLY_MONTHLY_EQUIVALENT)} al mes`]}
            note={`Ahorras ${formatCop(PRO_YEARLY_SAVINGS)} al año`}
          />
        </View>
        <View style={styles.trialNote}>
          <Icon name="star" size={20} color={colors.brand.accent} />
          <AppText variant="caption" style={styles.flex}>
            Cualquiera de los dos empieza con <AppText variant="captionStrong">{PRO_TRIAL_DAYS} días gratis</AppText>.
            Si cancelas antes, no pagas nada.
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          Precios informativos en pesos colombianos. Cuando RODEXA Pro esté disponible, lo verás aquí.
        </AppText>
      </View>

      {/* 4. Gratis vs Pro */}
      <View style={styles.group}>
        <AppText variant="heading">Gratis vs Pro</AppText>
        <Card flush>
          <View style={[styles.compareRow, styles.compareHeader]}>
            <AppText variant="captionStrong" tone="secondary" style={styles.compareLabel}>
              INCLUYE
            </AppText>
            <View style={styles.compareCell}>
              <AppText variant="captionStrong" tone="secondary">
                Gratis
              </AppText>
            </View>
            <View style={[styles.compareCell, styles.compareProCell]}>
              <AppText variant="captionStrong" tone="brand">
                ✦ Pro
              </AppText>
            </View>
          </View>
          {PRO_COMPARISON.map((row) => (
            <View key={row.label} style={[styles.compareRow, styles.divider]}>
              <AppText variant="caption" style={styles.compareLabel}>
                {row.label}
              </AppText>
              <View style={styles.compareCell}>
                <CompareValue value={row.free} />
              </View>
              <View style={[styles.compareCell, styles.compareProCell]}>
                <CompareValue value={row.pro} pro />
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* 5. Todo lo que incluirá Pro, por grupos */}
      <AppText variant="heading">Todo lo que incluirá Pro</AppText>
      {PRO_GROUPS.map((group) => (
        <View key={group.key} style={styles.group}>
          <AppText variant="captionStrong" tone="secondary">
            {group.title.toUpperCase()}
          </AppText>
          <Card flush>
            {PRO_FEATURES.filter((f) => f.group === group.key).map((feature, index) => {
              const opens = preview && feature.href !== undefined;
              return (
                <Pressable
                  key={feature.key}
                  disabled={!opens}
                  accessibilityRole={opens ? 'button' : undefined}
                  onPress={() => opens && feature.href && router.push(feature.href)}
                  style={({ pressed }) => [styles.feature, index > 0 && styles.divider, pressed && styles.pressed]}>
                  <View style={styles.featureIcon}>
                    <Icon name={feature.icon} size={20} color={colors.brand.accent} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{feature.title}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {feature.description}
                    </AppText>
                  </View>
                  {opens && <Icon name="chevronRight" color={colors.text.muted} />}
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}

      {/* 6. Preguntas frecuentes de Pro: lo que se pregunta ANTES de pagar. */}
      <View style={styles.group}>
        <AppText variant="heading">Preguntas frecuentes</AppText>
        <Card flush>
          {PRO_FAQ.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <View key={item.question} style={index > 0 && styles.divider}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => setOpenFaq(isOpen ? null : index)}
                  style={({ pressed }) => [styles.faqQuestion, pressed && styles.pressed]}>
                  <AppText variant="bodyStrong" style={styles.flex}>
                    {item.question}
                  </AppText>
                  <Icon name={isOpen ? 'expandLess' : 'expandMore'} color={colors.text.muted} />
                </Pressable>
                {isOpen && (
                  <AppText tone="secondary" style={styles.faqAnswer}>
                    {item.answer}
                  </AppText>
                )}
              </View>
            );
          })}
        </Card>
      </View>

      {/* 7. Promesas */}
      <Card tone="highlight">
        <PromiseRow icon="checked" title="Lo gratis sigue siendo gratis" text="Pro suma cosas nuevas: nunca te quitamos lo que ya tienes." />
        <PromiseRow icon="storage" title="Tus datos se quedan en tu celular" text="Con Pro también: sin cuentas ni servidores." />
        <PromiseRow
          icon="usageMixed"
          title="Una sola app"
          text="Cuando Pro esté disponible podrás activarlo aquí mismo, sin perder tus datos."
        />
      </Card>
    </FormScreen>
  );
}

function PriceCard({
  title,
  price,
  period,
  lines = [],
  note,
  highlighted = false,
}: {
  title: string;
  price: string;
  period: string;
  lines?: string[];
  note?: string;
  highlighted?: boolean;
}) {
  const styles = useStyles();
  return (
    <View
      style={[styles.plan, highlighted && styles.planHighlighted]}
      accessible
      accessibilityLabel={`${title}: ${price} ${period}. ${[...lines, note].filter(Boolean).join('. ')}. Disponible próximamente.`}>
      {highlighted && (
        <View style={styles.ribbon}>
          <AppText variant="tabLabel" color={ON_GOLD}>
            MEJOR PRECIO
          </AppText>
        </View>
      )}
      <AppText variant="captionStrong" tone={highlighted ? 'brand' : 'secondary'}>
        {title.toUpperCase()}
      </AppText>
      <AppText variant="title" numeric>
        {price}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {period}
      </AppText>
      {lines.map((line) => (
        <AppText key={line} variant="caption" tone="secondary">
          {line}
        </AppText>
      ))}
      {note && (
        <View style={styles.saving}>
          <AppText variant="captionStrong" tone="brand">
            {note}
          </AppText>
        </View>
      )}
    </View>
  );
}

/** Fila bloqueada de la vista previa: el valor se ve borroso hasta tener Pro. */
function LockedRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.locked} accessible accessibilityLabel={`${label}: disponible con Pro`}>
      <AppText variant="caption" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" tone="muted" style={styles.blurred}>
        {value}
      </AppText>
      <Icon name="lock" size={16} color={colors.text.muted} />
    </View>
  );
}

function CompareValue({ value, pro = false }: { value: boolean | string; pro?: boolean }) {
  const { colors } = useTheme();
  if (value === true) {
    return <Icon name="checked" size={20} color={pro ? colors.brand.accent : colors.text.secondary} />;
  }
  if (value === false) {
    return (
      <AppText variant="caption" tone="muted" accessibilityLabel="No incluido">
        —
      </AppText>
    );
  }
  return (
    <AppText variant="captionStrong" tone={pro ? 'brand' : 'secondary'} align="center">
      {value}
    </AppText>
  );
}

function PromiseRow({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.promise}>
      <Icon name={icon} size={22} color={colors.brand.accent} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="secondary">
          {text}
        </AppText>
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
  hero: {
    overflow: 'hidden',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  bubble: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bubbleBig: {
    width: 220,
    height: 220,
    top: -90,
    right: -70,
  },
  bubbleSmall: {
    width: 120,
    height: 120,
    bottom: -50,
    left: -40,
  },
  goldBadge: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heroChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  teaserHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  teaserList: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  blurred: {
    opacity: 0.45,
    letterSpacing: 1,
  },
  group: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tag: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  plans: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  plan: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: 2,
  },
  planHighlighted: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.soft,
  },
  ribbon: {
    position: 'absolute',
    top: -1,
    right: spacing.md,
    backgroundColor: GOLD,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  saving: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surface,
  },
  compareHeader: {
    backgroundColor: colors.background,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  compareLabel: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compareCell: {
    width: 76,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  compareProCell: {
    backgroundColor: colors.brand.soft,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  trialPill: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  trialNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand.soft,
  },
  notified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  faqAnswer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  promise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
}));
