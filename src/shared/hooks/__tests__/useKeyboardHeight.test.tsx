/** El alto del teclado sube y achica las hojas de selección (Modal) en Android. */
import { act, create } from 'react-test-renderer';
import { Keyboard } from 'react-native';

import { keyboardLift, useKeyboardHeight } from '../useKeyboardHeight';

type Listener = (event?: { endCoordinates: { height: number } }) => void;

describe('useKeyboardHeight', () => {
  const listeners: Record<string, Listener> = {};
  const removed: string[] = [];

  beforeEach(() => {
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, cb: Listener) => {
      listeners[name] = cb;
      return { remove: () => removed.push(name) };
    }) as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('0 con el teclado cerrado; su alto al abrirse; 0 al cerrarse; y limpia al salir', () => {
    let height = -1;
    function Probe() {
      height = useKeyboardHeight();
      return null;
    }
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Probe />);
    });
    expect(height).toBe(0);

    act(() => listeners.keyboardDidShow({ endCoordinates: { height: 310 } }));
    expect(height).toBe(310);

    act(() => listeners.keyboardDidHide());
    expect(height).toBe(0);

    act(() => renderer.unmount());
    expect(removed.sort()).toEqual(['keyboardDidHide', 'keyboardDidShow']);
  });
});

describe('keyboardLift: cuánto subir la hoja (medido, no supuesto)', () => {
  it('sin teclado → 0', () => {
    expect(keyboardLift(0, 800, 800)).toBe(0);
    expect(keyboardLift(0, 800, 500)).toBe(0);
  });

  it('Android no achicó la ventana (300, 800, 800) → 300', () => {
    expect(keyboardLift(300, 800, 800)).toBe(300);
  });

  it('Android ya la achicó (300, 800, 500) → 0: no se suma dos veces', () => {
    expect(keyboardLift(300, 800, 500)).toBe(0);
  });

  it('la achicó en parte (300, 800, 600) → 100', () => {
    expect(keyboardLift(300, 800, 600)).toBe(100);
  });

  it('nunca negativo', () => {
    expect(keyboardLift(300, 800, 300)).toBe(0);
  });
});
