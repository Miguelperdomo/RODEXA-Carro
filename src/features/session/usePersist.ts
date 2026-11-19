import { useCallback, useRef } from 'react';

import { useToast } from '@/shared/ui';

import { SAVE_FAILED_MESSAGE } from './SessionProvider';

/**
 * Guardar desde una pantalla: espera a que el dato quede en el teléfono antes de
 * continuar. Evita el doble toque mientras guarda y, si falla, avisa y devuelve
 * `false` (la pantalla NO debe mostrar éxito).
 *
 *   if (await persist(() => addExpense(…))) setSaved(true);
 */
export function usePersist() {
  const toast = useToast();
  const busy = useRef(false);

  return useCallback(
    async (task: () => Promise<boolean>): Promise<boolean> => {
      if (busy.current) return false;
      busy.current = true;
      try {
        const ok = await task();
        if (!ok) toast.show(SAVE_FAILED_MESSAGE);
        return ok;
      } finally {
        busy.current = false;
      }
    },
    [toast],
  );
}
