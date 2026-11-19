import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/features/session/SessionProvider';
import { isDeletableEntry, isEditableEntry } from '@/features/session/userDataActions';
import { usePersist } from '@/features/session/usePersist';
import { useToast } from '@/shared/ui';

import type { HistoryEntry } from './types';
import { appAlert } from '@/shared/ui/AppDialog';

/** Formulario de registro de cada tipo, abierto en modo edición (`?id=`). */
export function editHref(entry: HistoryEntry): Href {
  // Los tres registros de energía comparten formulario (con su tipo).
  if (entry.kind === 'fuel' || entry.kind === 'cng' || entry.kind === 'charge') {
    return { pathname: '/registrar/energia', params: { id: entry.id, tipo: entry.kind } };
  }
  const pathname = {
    odometer: '/registrar/kilometraje',
    maintenance: '/registrar/mantenimiento',
    expense: '/registrar/gasto',
    document: '/registrar/documento',
  }[entry.kind] as '/registrar/kilometraje';
  return { pathname, params: { id: entry.id } };
}

/** Editar y eliminar un registro del historial (con confirmación y guardado real). */
export function useEntryActions(entry: HistoryEntry | undefined) {
  const { deleteEntry, restoreEntry, storedData } = useSession();
  // Los registros normales se pueden "deshacer" (se guarda el original); los del primer ingreso se confirman antes.
  const stored = entry ? storedData.records.find((r) => r.id === entry.id) : undefined;
  const persist = usePersist();
  const toast = useToast();
  const editable = entry !== undefined && isEditableEntry(entry.id);
  const deletable = entry !== undefined && isDeletableEntry(entry.id);

  const edit = useCallback(() => {
    if (entry) router.push(editHref(entry));
  }, [entry]);

  const remove = useCallback(() => {
    if (!entry) return;
    if (stored) {
      // Se borra de una vez y se puede deshacer durante 5 segundos (sin preguntar antes).
      void (async () => {
        if (!(await persist(() => deleteEntry(entry.id)))) return;
        toast.show('Registro eliminado', {
          label: 'Deshacer',
          onPress: () => {
            void persist(() => restoreEntry(stored)).then((ok) => ok && toast.show('Registro recuperado'));
          },
        });
        router.back();
      })();
      return;
    }
    appAlert('¿Eliminar este registro?', 'Se borrará de tu celular. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!(await persist(() => deleteEntry(entry.id)))) return;
          toast.show('Registro eliminado');
          router.back();
        },
      },
    ]);
  }, [entry, stored, deleteEntry, restoreEntry, persist, toast]);

  return { editable, deletable, edit, remove };
}
