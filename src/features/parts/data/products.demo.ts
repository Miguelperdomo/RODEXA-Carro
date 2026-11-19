import type { InfoSource, PartProduct, PriceRange } from '../types';

/**
 * ⚠️ PRODUCTOS DE DEMOSTRACIÓN. Nombres, marcas, especificaciones y precios son
 * FICTICIOS: solo prueban que el catálogo funciona por carro. Se reemplazarán por
 * productos reales con fuente verificada (no representan ninguna marca real).
 */
const DEMO_SOURCE: InfoSource = { type: 'demo', name: 'Datos de demostración' };
const demoPrice = (min: number, max: number): PriceRange => ({
  min,
  max,
  currency: 'COP',
  referenceDate: '2026-09-01',
  source: DEMO_SOURCE,
});
const DEMO_SPEC = 'Valor de ejemplo (DEMO)';

export const DEMO_PRODUCTS: PartProduct[] = [
  {
    id: 'demo-oil-a',
    partType: 'oil',
    name: 'Aceite DEMO A',
    brand: 'Marca Demo',
    reference: 'DEMO-OIL-A',
    presentation: 'Presentación de ejemplo',
    specs: [
      { label: 'Viscosidad', value: DEMO_SPEC },
      { label: 'Norma', value: DEMO_SPEC },
    ],
    price: demoPrice(120000, 160000),
    source: DEMO_SOURCE,
    demo: true,
  },
  {
    id: 'demo-oil-shared',
    partType: 'oil',
    name: 'Aceite DEMO compartido',
    brand: 'Marca Demo',
    reference: 'DEMO-OIL-S',
    presentation: 'Presentación de ejemplo',
    specs: [{ label: 'Viscosidad', value: DEMO_SPEC }],
    price: demoPrice(140000, 190000),
    source: DEMO_SOURCE,
    demo: true,
  },
  {
    id: 'demo-oil-c',
    partType: 'oil',
    name: 'Aceite DEMO C',
    brand: 'Otra Marca Demo',
    reference: 'DEMO-OIL-C',
    specs: [{ label: 'Viscosidad', value: DEMO_SPEC }],
    price: demoPrice(170000, 230000),
    source: DEMO_SOURCE,
    demo: true,
  },
  {
    // Su compatibilidad con el Onix es "unknown": NO debe aparecer.
    id: 'demo-oil-unconfirmed',
    partType: 'oil',
    name: 'Aceite DEMO sin confirmar',
    brand: 'Marca Demo',
    specs: [],
    demo: true,
  },
  {
    id: 'demo-spark-a',
    partType: 'spark_plug',
    name: 'Bujía DEMO A',
    brand: 'Marca Demo',
    reference: 'DEMO-SP-A',
    specs: [{ label: 'Grado térmico', value: DEMO_SPEC }],
    price: demoPrice(25000, 40000),
    source: DEMO_SOURCE,
    demo: true,
  },
  {
    id: 'demo-spark-b',
    partType: 'spark_plug',
    name: 'Bujía DEMO B',
    brand: 'Otra Marca Demo',
    reference: 'DEMO-SP-B',
    specs: [{ label: 'Grado térmico', value: DEMO_SPEC }],
    source: DEMO_SOURCE,
    demo: true,
  },
  {
    id: 'demo-timing-a',
    partType: 'timing_belt',
    name: 'Kit de distribución DEMO A',
    brand: 'Marca Demo',
    reference: 'DEMO-KIT-A',
    specs: [
      { label: 'Número de dientes', value: DEMO_SPEC },
      { label: 'Incluye tensor', value: DEMO_SPEC },
    ],
    price: demoPrice(350000, 520000),
    source: DEMO_SOURCE,
    demo: true,
  },
  {
    id: 'demo-timing-b',
    partType: 'timing_belt',
    name: 'Kit de distribución DEMO B',
    brand: 'Otra Marca Demo',
    reference: 'DEMO-KIT-B',
    specs: [{ label: 'Número de dientes', value: DEMO_SPEC }],
    price: demoPrice(420000, 650000),
    source: DEMO_SOURCE,
    demo: true,
  },
];
