import type { OnboardingForm, StepErrors } from '../form';

/** Props comunes de cada paso del primer ingreso. */
export type StepProps = {
  form: OnboardingForm;
  update: (changes: Partial<OnboardingForm>) => void;
  errors: StepErrors;
};
