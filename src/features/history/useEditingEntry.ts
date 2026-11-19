import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useAppData } from '@/features/session/SessionProvider';
import { isEditableEntry } from '@/features/session/userDataActions';

import type { HistoryEntry } from './types';

type Entry<K extends HistoryEntry['kind']> = Extract<HistoryEntry, { kind: K }>;

/**
 * Formularios en modo edición: si la ruta trae `?id=` de un registro editable de
 * ese tipo, lo devuelve (fijado al abrir la pantalla); si no, el formulario es de
 * registro nuevo.
 */
export function useEditingEntry<K extends HistoryEntry['kind']>(kind: K): Entry<K> | undefined {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { history } = useAppData();
  const [entry] = useState(() => {
    const found = id ? history.find((e) => e.id === id) : undefined;
    return found && found.kind === kind && isEditableEntry(found.id) ? (found as Entry<K>) : undefined;
  });
  return entry;
}
