import { StyleSheet } from 'react-native';

import { plateCityLabel } from '@/features/cars/plate';
import { RainSeasonCard } from '@/features/colombia/components/RainSeasonCard';
import { QuickCallSection } from '@/features/contacts/components/QuickCall';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { MonthSummaryCard } from '@/features/dashboard/components/MonthSummaryCard';
import { CarCard } from '@/features/dashboard/components/CarCard';
import { CarStatusSection } from '@/features/dashboard/components/CarStatusSection';
import { GettingStartedCard } from '@/features/dashboard/components/GettingStartedCard';
import { NextMaintenanceCard } from '@/features/dashboard/components/NextMaintenanceCard';
import { RecentActivitySection } from '@/features/dashboard/components/RecentActivitySection';
import { RecommendationsSection } from '@/features/dashboard/components/RecommendationsSection';
import { TodayCard, useToday } from '@/features/dashboard/components/TodayCard';
import { WelcomeGreeting } from '@/features/dashboard/components/WelcomeGreeting';
import { ProLaunchCard } from '@/features/pro/components/ProLaunchCard';
import { latestEntries } from '@/features/history/presentation';
import { TravelCard } from '@/features/travel/components/TravelCard';
import { useAppData, useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { isTranqui } from '@/features/settings/usageStyle';
import { tranquiAsk } from '@/features/tranqui/ask';
import { TranquiAskCard } from '@/features/tranqui/components/TranquiAskCard';
import { MonthlyFuelCard, StyleSuggestionCard } from '@/features/tranqui/components/TranquiCards';
import { needsMonthlyFuelAmount, suggestStyle } from '@/features/tranqui/style';
import { spacing } from '@/shared/theme';
import { BrandFooter, Screen } from '@/shared/ui';
import { today } from '@/shared/utils/date';

export default function DashboardScreen() {
  // Del primer ingreso o de demostración (mock). En la etapa de SQLite, con la misma forma.
  const appData = useAppData();
  const { dashboard: data, history, profile, user } = appData;
  const { settings } = useSettings();
  const { onboardingDone, recurringExpenses } = useSession();
  const todayData = useToday();
  // Lo que ya está en "Hoy" no se repite en la tarjeta de próximo mantenimiento.
  const maintenanceInToday = todayData.items.flatMap((item) => (item.componentCode ? [item.componentCode] : []));
  // Tranqui: Inicio con lo importante. Sin actividad reciente ni resumen del mes (piden registrar seguido).
  const tranqui = isTranqui(settings);
  // Una sola tarjeta a la vez: primero la pregunta del km, luego el combustible del mes y al final la sugerencia.
  const ask = onboardingDone && tranqui ? tranquiAsk(appData, today(), settings.tranquiAskSnoozedUntil) : undefined;
  const askFuel = onboardingDone && !ask && needsMonthlyFuelAmount(settings, recurringExpenses);
  const suggest = onboardingDone && !ask && !askFuel ? suggestStyle(history, settings, today()) : undefined;

  return (
    <Screen scroll scrollToTopOnTab contentStyle={styles.content}>
      <DashboardHeader />
      <WelcomeGreeting />
      {/* Solo el día del lanzamiento de Pro, a quien pidió el aviso. */}
      <ProLaunchCard />
      <CarCard
        car={data.car}
        odometer={data.odometer}
        // En Tranqui el km aproximado es el que se ve entre registros: siempre visible.
        showEstimate={tranqui || settings.showEstimate}
        plate={profile.plate}
        nickname={profile.nickname}
        plateCity={plateCityLabel(profile.plateCityId, user)}
        serviceType={profile.serviceType}
      />
      {ask && <TranquiAskCard key={ask.kind} ask={ask} />}
      {askFuel && <MonthlyFuelCard />}
      {suggest && <StyleSuggestionCard suggest={suggest} />}
      {/* Llamar rápido: mecánico, grúa, aseguradora… (o la invitación a guardarlos). */}
      <QuickCallSection />
      {/* Lo más importante del día: pico y placa, lo vencido o próximo, revisión semanal y km. */}
      <TodayCard data={todayData} />
      {/* Solo durante la temporada de lluvias (IDEAM, aproximado) y donde hay fechas confirmadas. */}
      <RainSeasonCard />
      <GettingStartedCard />
      <NextMaintenanceCard shownInToday={maintenanceInToday} />
      <CarStatusSection items={data.statusItems} />
      {settings.showRecommendations && <RecommendationsSection items={data.recommendations} />}
      <TravelCard />
      {!tranqui && <RecentActivitySection entries={latestEntries(history, 3)} />}
      {!tranqui && <MonthSummaryCard month={data.month} />}
      <BrandFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
