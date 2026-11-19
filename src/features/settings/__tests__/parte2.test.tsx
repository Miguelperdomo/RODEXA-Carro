/** ⚙️ en las pestañas, "Letra grande" y preguntas frecuentes antes de registrar el carro. */
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

import { FAQ } from '@/features/help/faq';
import { PUBLIC_ROUTES } from '@/features/session/appRoutes';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { LARGE_TEXT_SCALE, ThemeProvider, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };

describe('⚙️ Configuración en las 4 pestañas', () => {
  it.each(['historial', 'estadisticas', 'carro'])('%s tiene el botón', (tab) => {
    expect(readFileSync(`src/app/(tabs)/${tab}.tsx`, 'utf8')).toMatch(/<SettingsButton \/>/);
  });

  it('Inicio ya lo tiene en su encabezado', () => {
    expect(readFileSync('src/features/dashboard/components/DashboardHeader.tsx', 'utf8')).toMatch(/router\.push\('\/configuracion'\)/);
  });
});

describe('Letra grande', () => {
  const fontSize = (scale: number) => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <ThemeProvider preference="light" textScale={scale}>
          <AppText>Hola</AppText>
        </ThemeProvider>,
      );
    });
    const style = [tree.root.findByType(Text).props.style].flat(Infinity).filter(Boolean);
    return Object.assign({}, ...style).fontSize as number;
  };

  it('apagada por defecto', () => {
    expect(DEFAULT_SETTINGS.largeText).toBe(false);
  });

  it('agranda el texto un 15 %', () => {
    expect(LARGE_TEXT_SCALE).toBe(1.15);
    expect(fontSize(1)).toBe(typography.body.fontSize);
    expect(fontSize(LARGE_TEXT_SCALE)).toBeCloseTo(typography.body.fontSize * 1.15, 5);
  });
});

describe('preguntas frecuentes antes de registrar el carro', () => {
  it('la Ayuda se puede abrir desde la bienvenida (es pública)', () => {
    expect(PUBLIC_ROUTES).toContain('configuracion/ayuda');
    expect(readFileSync('src/app/(onboarding)/bienvenida.tsx', 'utf8')).toMatch(/configuracion\/ayuda/);
    expect(readFileSync('src/app/(onboarding)/datos.tsx', 'utf8')).toMatch(/headerAction=\{<FaqButton \/>\}/);
  });

  it('las 4 preguntas nuevas van primero', () => {
    expect(FAQ.slice(0, 4).map((f) => f.id)).toEqual(['free', 'account-internet', 'new-phone', 'permissions']);
  });

  it('dicen lo que carro hace hoy: notificaciones y la cámara solo para la foto opcional', () => {
    const permissions = FAQ.find((f) => f.id === 'permissions')!.answer.es;
    expect(permissions).toMatch(/Notificaciones/);
    expect(permissions).toMatch(/Cámara: solo si decides/);
    expect(permissions).toMatch(/no pide tu ubicación, tus contactos ni el micrófono/);
    const newPhone = FAQ.find((f) => f.id === 'new-phone')!.answer.es;
    expect(newPhone).toMatch(/Guardar copia en el celular/);
    expect(newPhone).toMatch(/Ya tenía RODEXA: recuperar mi copia/);
  });
});
