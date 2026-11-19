import { useCallback } from 'react';

import { useSettings } from '@/features/settings/SettingsProvider';
import type { Language } from '@/features/settings/types';

import { en } from './en';
import { es, type TranslationKey } from './es';

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { es, en };

export const LANGUAGE_NAMES: Record<Language, string> = { es: 'Español', en: 'English (Beta)' };

/**
 * Traducción sin librerías: `t('settings.title')` → "Configuración" / "Settings".
 * Admite variables: t('settings.unread', { count: 3 }) → "3 sin leer".
 */
export function useT() {
  const { settings } = useSettings();
  const dictionary = DICTIONARIES[settings.language];
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text = dictionary[key] ?? es[key];
      if (vars) for (const [name, value] of Object.entries(vars)) text = text.replace(`{${name}}`, String(value));
      return text;
    },
    [dictionary],
  );
}

export type { TranslationKey };
