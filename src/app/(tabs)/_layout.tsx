import { Tabs } from 'expo-router/js-tabs';

import { useT } from '@/i18n';
import { TabBar } from '@/shared/navigation/TabBar';
import { useTheme } from '@/shared/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="historial" options={{ title: t('tabs.history') }} />
      <Tabs.Screen name="estadisticas" options={{ title: t('tabs.stats') }} />
      <Tabs.Screen name="carro" options={{ title: t('tabs.car') }} />
    </Tabs>
  );
}
