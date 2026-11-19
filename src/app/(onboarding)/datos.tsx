import { router } from 'expo-router';
import { useEffect, useState, type ComponentType } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { StepProgress } from '@/features/onboarding/components/StepProgress';
import {
  EMPTY_FORM,
  toOnboardingData,
  validateStep,
  type OnboardingForm,
  type StepKey,
} from '@/features/onboarding/form';
import { AboutStep } from '@/features/onboarding/steps/AboutStep';
import { DocumentsStep } from '@/features/onboarding/steps/DocumentsStep';
import { MaintenanceStep } from '@/features/onboarding/steps/MaintenanceStep';
import { CarStep } from '@/features/onboarding/steps/CarStep';
import { CreditStep } from '@/features/onboarding/steps/CreditStep';
import { OdometerStep } from '@/features/onboarding/steps/OdometerStep';
import type { StepProps } from '@/features/onboarding/steps/types';
import { UsageStep } from '@/features/onboarding/steps/UsageStep';
import { useSession } from '@/features/session/SessionProvider';
import { usePersist } from '@/features/session/usePersist';
import { spacing } from '@/shared/theme';
import { FaqButton } from '@/features/help/components/FaqButton';
import { AppText, Button, FormScreen } from '@/shared/ui';
import { today } from '@/shared/utils/date';
import { hasErrors } from '@/shared/utils/validation';

type Step = { key: StepKey; title: string; subtitle?: string; Component: ComponentType<StepProps> };

const STEPS: Step[] = [
  { key: 'about', title: 'Sobre ti', subtitle: 'Para saludarte y ubicar mejor tu carro.', Component: AboutStep },
  { key: 'car', title: 'Tu carro', subtitle: 'Cada carro usa referencias y medidas distintas.', Component: CarStep },
  { key: 'usage', title: '¿Para qué usas principalmente tu carro?', Component: UsageStep },
  { key: 'odometer', title: '¿Cuántos kilómetros marca tu carro hoy?', Component: OdometerStep },
  { key: 'maintenance', title: '¿Has hecho algún mantenimiento recientemente?', Component: MaintenanceStep },
  { key: 'documents', title: 'Documentos de tu carro', subtitle: 'Te avisaremos antes de que venzan.', Component: DocumentsStep },
  { key: 'credit', title: '¿Tu carro está a crédito?', subtitle: 'Opcional: te avisamos antes de cada cuota.', Component: CreditStep },
];

/** Pasos que se pueden saltar con "Omitir por ahora". */
const SKIPPABLE: Partial<Record<StepKey, Partial<OnboardingForm>>> = {
  maintenance: { recent: {} },
  documents: { soatExpiresAt: null, rtmExpiresAt: null },
  credit: { creditHas: null, creditAmount: null, creditTotal: null, creditPaid: null, creditDay: null, creditPaidThisMonth: null },
};

export default function OnboardingFormScreen() {
  const { setDraft } = useSession();
  const persist = usePersist();
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);

  const steps = STEPS;
  const current = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  const validation = validateStep(current.key, form);
  const errors = attempted ? validation : {};
  const { title, subtitle, Component } = current;
  const skipChanges = SKIPPABLE[current.key];

  const goTo = (next: number) => {
    setAttempted(false);
    setIndex(next);
  };

  const goBack = () => (index > 0 ? goTo(index - 1) : router.back());

  // Botón "atrás" de Android: vuelve al paso anterior en vez de salir del formulario.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      goTo(index - 1);
      return true;
    });
    return () => sub.remove();
  }, [index]);

  // El resumen se abre solo cuando las respuestas quedaron guardadas en el teléfono.
  const finish = async (finalForm: OnboardingForm) => {
    if (await persist(() => setDraft(toOnboardingData(finalForm, today())))) router.push('/resumen');
  };

  const handleContinue = () => {
    setAttempted(true);
    if (hasErrors(validation)) return;
    if (isLast) finish(form);
    else goTo(index + 1);
  };

  const handleSkip = () => {
    const skipped = { ...form, ...skipChanges };
    setForm(skipped);
    if (isLast) finish(skipped);
    else goTo(index + 1);
  };

  return (
    <FormScreen
      key={current.key}
      title="Configura tu RODEXA Carro"
      headerAction={<FaqButton />}
      closeIcon="back"
      onClose={goBack}
      footer={
        <View style={styles.footer}>
          <Button label="Continuar" fullWidth onPress={handleContinue} />
          {skipChanges && (
            <Button label="Omitir por ahora" variant="ghost" fullWidth onPress={handleSkip} />
          )}
        </View>
      }>
      <StepProgress step={index + 1} total={steps.length} />
      <View style={styles.heading}>
        <AppText variant="title">{title}</AppText>
        {subtitle && <AppText tone="secondary">{subtitle}</AppText>}
      </View>
      <Component form={form} update={(changes) => setForm((f) => ({ ...f, ...changes }))} errors={errors} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.xs,
  },
  footer: {
    gap: spacing.xs,
  },
});
