import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Alto del teclado en pantalla (0 si está cerrado). Las hojas que suben desde abajo con
 * Modal NO se acomodan solas al teclado en Android (app de borde a borde): con este valor
 * la hoja se sube y se achica para que el buscador y los resultados sigan visibles.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

/**
 * Cuánto hay que subir una hoja (Modal) para que el teclado no la tape. No se supone: en
 * algunos Android la ventana del Modal YA se achica al abrir el teclado y en otros no.
 * - `fullHeight`: alto del área sin teclado (el mayor medido);
 * - `currentHeight`: alto actual del área.
 * Lo que la ventana ya se achicó se descuenta del alto del teclado.
 */
export function keyboardLift(keyboardHeight: number, fullHeight: number, currentHeight: number): number {
  if (keyboardHeight <= 0) return 0;
  const alreadyLifted = Math.max(0, fullHeight - currentHeight);
  return Math.max(0, keyboardHeight - alreadyLifted);
}
