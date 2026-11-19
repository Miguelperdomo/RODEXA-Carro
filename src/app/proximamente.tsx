import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { createStyles, radius, spacing, useTheme } from '@/shared/theme';
import { AppText, Button, Card, FormScreen, Icon, type IconName } from '@/shared/ui';

type Topic = 'talleres' | 'repuestos';

type TopicContent = {
  icon: IconName;
  title: string;
  message: string;
  points: string[];
};

/**
 * Talleres y repuestos: Próximamente. Solo informa lo que vendrá; no muestra talleres
 * ni productos (no hay ninguno verificado todavía).
 */
export default function ComingSoonScreen() {
  const { tema } = useLocalSearchParams<{ tema?: string }>();
  const topic: Topic = tema === 'repuestos' ? 'repuestos' : 'talleres';
  const { colors } = useTheme();
  const styles = useStyles();
  const { profile, user } = useAppData();
  const carName = [profile.brandName, profile.model, profile.year].filter(Boolean).join(' ') || 'tu carro';

  const content: Record<Topic, TopicContent> = {
    talleres: {
      icon: 'workshop',
      title: 'Talleres inscritos en RODEXA',
      message: 'Próximamente encontrarás talleres de confianza donde podrás reparar y hacerle mantenimiento a tu carro.',
      points: [
        user.city ? `Talleres en ${user.city} y cerca de ti` : 'Talleres en tu ciudad y cerca de ti',
        `Que atiendan carros como el tuyo (${carName})`,
        'Solo talleres inscritos en RODEXA',
        'Un lugar donde instalar los repuestos que necesites',
      ],
    },
    repuestos: {
      icon: 'partsCatalog',
      title: 'Repuestos para mi carro',
      message: `Próximamente vas a encontrar los repuestos que usa tu ${carName}, y un taller donde instalarlos.`,
      points: [
        'Repuestos según tu carro y su tipo de energía',
        'Solo productos verificados como compatibles',
        'Opciones para comparar',
        'Talleres inscritos donde instalarlos',
      ],
    },
  };
  const c = content[topic];

  return (
    <FormScreen title={c.title} closeIcon="back">
      <View style={styles.hero}>
        <View style={styles.iconBox}>
          <Icon name={c.icon} size={36} color={colors.brand.accent} />
        </View>
        <View style={styles.badge}>
          <AppText variant="captionStrong" color={colors.brand.onPrimary}>
            Próximamente
          </AppText>
        </View>
        <AppText variant="title" align="center">
          {c.title}
        </AppText>
        <AppText tone="secondary" align="center">
          {c.message}
        </AppText>
      </View>

      <Card style={styles.points}>
        <AppText variant="captionStrong" tone="secondary">
          LO QUE ESTAMOS PREPARANDO
        </AppText>
        {c.points.map((point) => (
          <View key={point} style={styles.point}>
            <Icon name="check" size={18} color={colors.brand.accent} />
            <AppText style={styles.flex}>{point}</AppText>
          </View>
        ))}
      </Card>

      {topic === 'repuestos' && (
        <Card style={styles.points}>
          <AppText variant="bodyStrong">Mientras tanto</AppText>
          <AppText variant="caption" tone="secondary">
            Anota lo que usa tu carro: el aceite, los filtros, las bujías, las pastillas de freno, las llantas… Queda
            guardado en tu celular y lo tendrás a mano cuando vayas a comprar.
          </AppText>
          <Button label="Anotar lo que usa mi carro" variant="secondary" icon="note" onPress={() => router.push('/repuestos')} />
        </Card>
      )}

      <AppText variant="caption" tone="muted" align="center">
        Todavía no hay {topic === 'talleres' ? 'talleres inscritos' : 'productos verificados'}: cuando estén listos, los
        verás aquí.
      </AppText>
    </FormScreen>
  );
}

const useStyles = createStyles((colors) => ({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  points: {
    gap: spacing.md,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
