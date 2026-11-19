import type { IconName } from '@/shared/ui';

import type { UsageType } from './types';

/** Nombres de cada uso (incluye `delivery`, reservado para el futuro). */
export const USAGE_LABELS: Record<UsageType, string> = {
  personal: 'Uso personal',
  work: 'Trabajo / domicilios',
  delivery: 'Domicilios',
  apps: 'Aplicaciones',
  travel: 'Viajes',
  mixed: 'Uso mixto',
};

/** Opciones que se muestran en el primer ingreso (una sola selección). */
export const USAGE_OPTIONS: { value: UsageType; label: string; icon: IconName }[] = [
  { value: 'personal', label: USAGE_LABELS.personal, icon: 'usagePersonal' },
  { value: 'work', label: USAGE_LABELS.work, icon: 'usageWork' },
  { value: 'apps', label: USAGE_LABELS.apps, icon: 'usageApps' },
  { value: 'travel', label: USAGE_LABELS.travel, icon: 'usageTravel' },
  { value: 'mixed', label: USAGE_LABELS.mixed, icon: 'usageMixed' },
];
