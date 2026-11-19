import { View } from 'react-native';

import { useAppData } from '@/features/session/SessionProvider';
import { createStyles } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { greeting, greetingSubtitle } from '../greeting';

/** Saludo de Inicio según la hora y el primer nombre, sin género (ver greeting). */
export function WelcomeGreeting() {
  const styles = useStyles();
  const { user, profile } = useAppData();

  return (
    <View style={styles.container}>
      <AppText variant="title">{greeting(new Date(), user.name)}</AppText>
      <AppText tone="secondary">{greetingSubtitle(profile.nickname)}</AppText>
    </View>
  );
}

const useStyles = createStyles(() => ({
  container: {
    gap: 2,
  },
}));
