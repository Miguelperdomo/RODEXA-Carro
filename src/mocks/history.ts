import type { HistoryEntry } from '@/features/history/types';

/** Precio del galón de EJEMPLO (el mismo de la guía de diseño). FICTICIO: no es un precio real. */
const MOCK_PRICE_PER_GALLON = 16000;

/** Tanqueo de ejemplo (SOLO DESARROLLO): valor pagado + precio del galón → galones. */
const fuel = (
  id: string,
  date: string,
  km: number,
  amountCop: number,
  fullTank: boolean,
): HistoryEntry => ({
  id,
  kind: 'fuel',
  date,
  km,
  quantity: amountCop / MOCK_PRICE_PER_GALLON,
  unit: 'gal',
  costCop: amountCop,
  unitPriceCop: MOCK_PRICE_PER_GALLON,
  fullTank,
});

/**
 * Historial ficticio, coherente con el dashboard:
 * - Septiembre: gasolina 180.000 + sincronización 120.000 + lavado 30.000
 *   + parqueadero 54.500 = 384.500.
 * - Agosto: gasolina 200.000 + aceite 35.000 + parqueadero 54.000
 *   + lavado 30.000 + repuestos 93.000 = 412.000.
 * - Km: 51.990 (31/08) → 53.240 (20/09) = 1.250 km en septiembre.
 * - Tanqueos: km coherentes con las lecturas. Septiembre tiene tanques llenos
 *   (consumo estimado ≈ 28 km/L con el galón de ejemplo); en agosto todos son parciales, así que ese mes
 *   el consumo queda "Sin datos suficientes".
 */
export const historyMock: HistoryEntry[] = [
  // Septiembre 2026
  { id: 'w-0921', kind: 'expense', date: '2026-09-21', category: 'wash', amountCop: 15000 },
  { id: 'o-0920', kind: 'odometer', date: '2026-09-20', km: 53240 },
  { id: 'p-0919', kind: 'expense', date: '2026-09-19', category: 'parking', amountCop: 4500 },
  fuel('f-0918', '2026-09-18', 53125, 26400, true),
  fuel('f-0915', '2026-09-15', 52945, 26400, true),
  { id: 'o-0913', kind: 'odometer', date: '2026-09-13', km: 52830 },
  { id: 'p-0912', kind: 'expense', date: '2026-09-12', category: 'parking', amountCop: 5000 },
  fuel('f-0912', '2026-09-12', 52765, 29400, false),
  fuel('f-0909', '2026-09-09', 52570, 38400, true),
  { id: 'w-0907', kind: 'expense', date: '2026-09-07', category: 'wash', amountCop: 15000 },
  { id: 'o-0906', kind: 'odometer', date: '2026-09-06', km: 52380 },
  {
    id: 'm-0905',
    kind: 'maintenance',
    date: '2026-09-05',
    km: 52300,
    types: ['general'],
    costCop: 120000,
    note: 'Sincronización en el taller del barrio',
  },
  fuel('f-0905', '2026-09-05', 52315, 29400, true),
  fuel('f-0902', '2026-09-02', 52120, 30000, true),
  {
    id: 'p-0901',
    kind: 'expense',
    date: '2026-09-01',
    category: 'parking',
    amountCop: 45000,
    note: 'Mensualidad',
  },

  // Agosto 2026
  { id: 'o-0831', kind: 'odometer', date: '2026-08-31', km: 51990 },
  fuel('f-0826', '2026-08-26', 51635, 25000, false),
  { id: 'w-0823', kind: 'expense', date: '2026-08-23', category: 'wash', amountCop: 15000 },
  fuel('f-0822', '2026-08-22', 51350, 25000, false),
  fuel('f-0819', '2026-08-19', 51140, 25000, false),
  {
    id: 'r-0817',
    kind: 'expense',
    date: '2026-08-17',
    category: 'parts',
    amountCop: 93000,
    note: 'Bombillo delantero y plumillas',
  },
  fuel('f-0815', '2026-08-15', 50855, 25000, false),
  { id: 'p-0814', kind: 'expense', date: '2026-08-14', category: 'parking', amountCop: 9000 },
  fuel('f-0812', '2026-08-12', 50640, 25000, false),
  {
    id: 'm-0810',
    kind: 'maintenance',
    date: '2026-08-10',
    km: 50500,
    types: ['oil'],
    costCop: 35000,
  },
  { id: 'w-0809', kind: 'expense', date: '2026-08-09', category: 'wash', amountCop: 15000 },
  fuel('f-0808', '2026-08-08', 50475, 25000, false),
  fuel('f-0805', '2026-08-05', 50420, 25000, false),
  fuel('f-0801', '2026-08-01', 50370, 25000, false),
  {
    id: 'p-0801',
    kind: 'expense',
    date: '2026-08-01',
    category: 'parking',
    amountCop: 45000,
    note: 'Mensualidad',
  },

  // Meses anteriores
  { id: 'm-0718', kind: 'maintenance', date: '2026-07-18', km: 50200, types: ['brake_check'] },
  {
    id: 'm-0701',
    kind: 'maintenance',
    date: '2026-07-01',
    km: 49800,
    types: ['tire_rear'],
    costCop: 145000,
    note: 'Llantas traseras nuevas',
  },
  { id: 'd-0514', kind: 'document', date: '2026-05-14', docType: 'soat', expiresAt: '2027-05-14' },
  { id: 'd-1012', kind: 'document', date: '2025-10-12', docType: 'rtm', expiresAt: '2026-10-12' },
  // Batería registrada sin costo ni km (se controla por meses).
  { id: 'm-250310', kind: 'maintenance', date: '2025-03-10', km: 41200, types: ['battery'] },
];
