import type { ManufacturerInterval } from '../intervals';

/**
 * Intervalos según fabricante / manual, por modelo del catálogo.
 *
 * VACÍO A PROPÓSITO: todavía no tenemos intervalos verificados. Solo se agrega una
 * entrada con su fuente (manual o sitio oficial del fabricante), una referencia
 * que permita encontrarla (página, sección o URL) y la fecha de verificación.
 * Una entrada sin fuente verificable se ignora (ver `isVerifiableSource`).
 *
 * Forma esperada (EJEMPLO, no son datos reales):
 *   {
 *     modelId: 'modelo-del-catalogo',
 *     years: { from: 2020, to: 2024 },
 *     energySources: ['gasoline'],
 *     component: 'oil',
 *     km: 0, months: 0,
 *     condition: 'Uso normal',
 *     source: { type: 'official_manual', name: 'Manual del propietario …', reference: 'Pág. …', verifiedAt: 'AAAA-MM-DD' },
 *   }
 */
export const MANUFACTURER_INTERVALS: ManufacturerInterval[] = [];
