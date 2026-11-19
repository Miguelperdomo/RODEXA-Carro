/** Pestañas: al llegar desde la barra empiezan arriba; tocar la actual sube con animación. */
import { act, create } from 'react-test-renderer';

import { useScrollToTopOnTab } from '../useScrollToTopOnTab';

const mockListeners: Record<string, () => void> = {};
let mockFocused = false;
const mockUnsubscribe = jest.fn();

jest.mock('expo-router', () => ({
  useNavigation: () => ({
    addListener: (name: string, cb: () => void) => {
      mockListeners[name] = cb;
      return mockUnsubscribe;
    },
    isFocused: () => mockFocused,
  }),
}));

function Probe({ enabled, onTop }: { enabled: boolean; onTop: (animated: boolean) => void }) {
  useScrollToTopOnTab(enabled, onTop);
  return null;
}

describe('useScrollToTopOnTab', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockListeners)) delete mockListeners[key];
    mockUnsubscribe.mockClear();
  });

  it('desde otra pestaña: arriba SIN animación; en la misma pestaña: CON animación', () => {
    const onTop = jest.fn();
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Probe enabled onTop={onTop} />);
    });

    mockFocused = false; // venía de otra pestaña
    mockListeners.tabPress();
    expect(onTop).toHaveBeenLastCalledWith(false);

    mockFocused = true; // ya estaba en esta pestaña
    mockListeners.tabPress();
    expect(onTop).toHaveBeenLastCalledWith(true);

    act(() => renderer.unmount());
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('solo escucha la barra de abajo: no usa "blur" (volver con la flecha conserva la posición)', () => {
    act(() => {
      create(<Probe enabled onTop={jest.fn()} />);
    });
    expect(Object.keys(mockListeners)).toEqual(['tabPress']);
  });

  it('apagado por defecto: no escucha nada', () => {
    act(() => {
      create(<Probe enabled={false} onTop={jest.fn()} />);
    });
    expect(Object.keys(mockListeners)).toEqual([]);
  });
});
