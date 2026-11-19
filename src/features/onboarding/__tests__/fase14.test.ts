/** Fase 14: primer ingreso (bienvenida sin bajar, estilo, aviso antes del permiso, documento corto). */
import { ACTIVATE_MESSAGE, ACTIVATE_TITLE } from '@/features/notifications/local/LocalReminders';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { usageStyleLabel, USAGE_STYLES } from '@/features/settings/usageStyle';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as { readFileSync: (path: string, enc: string) => string };
const read = (p: string) => readFileSync(`src/${p}`, 'utf8');

jest.mock('@/features/notifications/local/scheduler', () => ({}));
jest.mock('@/features/notifications/local/useNotificationNavigation', () => ({}));
jest.mock('@/features/notifications/local/useNotificationPermission', () => ({}));

describe('bienvenida', () => {
  const welcome = read('app/(onboarding)/bienvenida.tsx');

  it('escudo, nombre y la frase de privacidad', () => {
    expect(welcome).toContain('<BrandMark size="lg" iconOnly />');
    expect(welcome).toContain('RODEXA Carro');
    expect(welcome).toContain('Cuida tu carro en un solo lugar. Tus datos se quedan en tu celular.');
  });

  it('5 beneficios que ocupan la pantalla, solo de lo que la app hace hoy', () => {
    for (const title of ['Te avisa a tiempo', 'Mantenimiento al día', 'Pico y placa y avisos', 'Cuánto te cuesta tu carro', 'Ayuda en la vía']) {
      expect(welcome).toContain(`title: '${title}'`);
    }
    // El asistente por voz todavía no existe en carro: no se promete.
    const benefits = welcome.slice(welcome.indexOf('const BENEFITS'), welcome.indexOf('const TRUST'));
    expect(benefits).not.toMatch(/asistente|voz/i);
    expect(welcome).toMatch(/flexGrow: 1,\s*justifyContent: 'space-evenly'/);
  });

  it('"Gratis · Sin crear cuenta · Sin internet" y los legales en una línea', () => {
    expect(welcome).toContain("const TRUST = ['Gratis', 'Sin crear cuenta', 'Sin internet'];");
    expect(welcome).toMatch(/Política de privacidad\s*<\/AppText>\s*\. \{BRAND\.madeBy\}\./);
  });
});

describe('Mi estilo', () => {
  it('"Al detalle" primero y por defecto, con 📊 y 😎', () => {
    expect(USAGE_STYLES[0].value).toBe('detail');
    expect(DEFAULT_SETTINGS.usageStyle).toBe('detail');
    expect(usageStyleLabel('detail')).toBe('📊 Al detalle');
    expect(usageStyleLabel('tranqui')).toBe('😎 Tranqui');
    expect(read('app/(onboarding)/estilo.tsx')).toContain("useState<UsageStyle>('detail')");
  });
});

describe('"¿Activamos los avisos?" antes del permiso de Android', () => {
  it('explica para qué sirven, sin publicidad', () => {
    expect(ACTIVATE_TITLE).toBe('¿Activamos los avisos?');
    expect(ACTIVATE_MESSAGE).toMatch(/SOAT.*tecnomecánica.*aceite/);
    expect(ACTIVATE_MESSAGE).toMatch(/sin publicidad/);
  });

  it('"Ahora no" no abre la ventana de Android; "Sí, activar avisos" sí', () => {
    const src = read('features/notifications/local/LocalReminders.tsx');
    expect(src).toMatch(/\{ text: 'Ahora no', style: 'cancel' \}/);
    expect(src).toMatch(/text: 'Sí, activar avisos',\s*onPress: \(\) =>\s*void ready\.then\(request\)/);
    // Solo después del primer ingreso.
    expect(src).toContain('if (!onboardingDone || !canAsk || asked.current) return;');
  });
});

describe('Registrar documento', () => {
  it('"Más detalles (opcional)" plegable con número, entidad, cobertura, categoría y observaciones', () => {
    const src = read('app/registrar/documento.tsx');
    const more = src.indexOf('Más detalles (opcional)');
    expect(more).toBeGreaterThan(0);
    for (const field of ['label={definition.numberLabel}', 'label={definition.issuerLabel}', 'label="Cobertura"', 'label="Categoría"', 'label="Observaciones"']) {
      expect(src.indexOf(field)).toBeGreaterThan(more);
    }
    // El vencimiento y el pago siguen a la vista.
    expect(src.indexOf('label="Fecha de vencimiento"')).toBeLessThan(more);
    expect(src.indexOf('label="Valor pagado"')).toBeLessThan(more);
    // Abierto si ya hay algo escrito; cerrado en un documento nuevo.
    expect(src).toMatch(/const \[moreOpen, setMoreOpen\] = useState\(\(\) =>/);
  });
});
