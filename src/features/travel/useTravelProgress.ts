import { useCallback, useEffect, useRef, useState } from 'react';

import { clearTravelProgress, loadTravelProgress, saveTravelProgress } from '@/storage/travelProgressStore';

import type { TravelChecklistState } from './types';

/**
 * Puntos marcados en "Voy a viajar", conservados mientras la revisión está en
 * curso (salir de la pantalla o cerrar la app no los borra). `finish` los limpia
 * para empezar una revisión nueva la próxima vez.
 */
export function useTravelProgress() {
  const [state, setState] = useState<TravelChecklistState>({});
  const [loaded, setLoaded] = useState(false);
  const current = useRef<TravelChecklistState>({});

  useEffect(() => {
    let alive = true;
    loadTravelProgress().then((saved) => {
      if (!alive) return;
      current.current = saved;
      setState(saved);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(
    (id: string) => {
      // Antes de leer lo guardado no se escribe nada (no se pisa el progreso anterior).
      if (!loaded) return;
      const next = { ...current.current, [id]: !current.current[id] };
      current.current = next;
      setState(next);
      saveTravelProgress(next);
    },
    [loaded],
  );

  const finish = useCallback(async () => {
    current.current = {};
    setState({});
    await clearTravelProgress();
  }, []);

  return { state, loaded, toggle, finish };
}
