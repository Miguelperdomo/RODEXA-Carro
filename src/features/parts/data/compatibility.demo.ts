import type { Compatibility } from '../types';

/**
 * ⚠️ COMPATIBILIDADES DE DEMOSTRACIÓN (ficticias). Relación muchos-a-muchos:
 * "demo-oil-shared" aparece en ambos carros sin duplicar el producto; una relación
 * "unknown" demuestra que lo no confirmado no se muestra.
 */
export const DEMO_COMPATIBILITY: Compatibility[] = [
  // Chevrolet Onix
  { carId: 'chevrolet-onix', productId: 'demo-oil-a', status: 'verified' },
  { carId: 'chevrolet-onix', productId: 'demo-oil-shared', status: 'specification_match' },
  { carId: 'chevrolet-onix', productId: 'demo-oil-unconfirmed', status: 'unknown' },
  { carId: 'chevrolet-onix', productId: 'demo-spark-a', status: 'verified' },
  { carId: 'chevrolet-onix', productId: 'demo-timing-a', status: 'verified' },

  // Renault Logan
  { carId: 'renault-logan', productId: 'demo-oil-shared', status: 'verified' },
  { carId: 'renault-logan', productId: 'demo-oil-c', status: 'verified' },
  { carId: 'renault-logan', productId: 'demo-spark-b', status: 'specification_match' },
  // Solo desde cierto año: demuestra que no todos los años de un modelo son iguales.
  { carId: 'renault-logan', productId: 'demo-timing-b', status: 'verified', years: { from: 2024 } },
];
