import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * ¿El celular pide menos movimiento? En Android es true cuando las animaciones están
 * apagadas: "Quitar animaciones" (accesibilidad) o el ahorro de batería que las apaga,
 * algo común en celulares sencillos. Con eso la app se mueve sin transiciones ni
 * animaciones en bucle: se siente más rápida y gasta menos batería.
 */
let reduce = false;
let started = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (value === reduce) return;
  reduce = value;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled()
    .then(set)
    .catch(() => undefined);
  AccessibilityInfo.addEventListener('reduceMotionChanged', set);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduce, () => false);
}

/** Para las ventanas que suben desde abajo (Modal de React Native). */
export const sheetAnimation = (reduceMotion: boolean) => (reduceMotion ? 'none' : 'slide');

/** El valor de ahora (sin suscribirse): para ventanas que se abren un momento. */
export function reduceMotionNow(): boolean {
  start();
  return reduce;
}
