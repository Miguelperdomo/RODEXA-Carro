import { useEffect, useRef, useState } from 'react';

import { useReduceMotion } from './useReduceMotion';

/**
 * Un número que "sube rodando" hasta su valor (como un odómetro) cuando cambia. Sin animación si
 * el celular las apaga. Siempre termina en el valor exacto.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const reduceMotion = useReduceMotion();
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (reduceMotion || start === target) {
      const id = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(id);
    }
    const begin = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - begin) / durationMs);
      // Arranca rápido y frena al final.
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(start + (target - start) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduceMotion]);

  return shown;
}
