import type { IconName } from '@/shared/ui';

/**
 * Categorías del registro rápido de gastos (`expense_categories.code`).
 * Los mantenimientos (aceite, llantas, frenos…) NO van aquí: se registran en
 * Mantenimiento, que crea su gasto vinculado y así no se cuentan dos veces.
 */
export type ExpenseCategoryCode =
  | 'fuel'
  | 'wash'
  | 'detailing'
  | 'parking'
  | 'monthly_parking'
  | 'toll'
  | 'flat_tire'
  | 'tow'
  | 'impound'
  | 'locksmith'
  | 'bodywork'
  | 'diagnostic'
  | 'parts'
  | 'accessories'
  | 'window_tint'
  | 'soat'
  | 'rtm'
  | 'insurance'
  | 'fine'
  | 'tax'
  | 'transit_paperwork'
  | 'driver_license'
  | 'loan'
  | 'other';

export type ExpenseCategory = {
  code: ExpenseCategoryCode;
  label: string;
  icon: IconName;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { code: 'fuel', label: 'Combustible', icon: 'fuel' },
  { code: 'wash', label: 'Lavado', icon: 'wash' },
  { code: 'detailing', label: 'Lavado detallado / polichado', icon: 'detailing' },
  { code: 'parking', label: 'Parqueadero', icon: 'parking' },
  { code: 'monthly_parking', label: 'Garaje o parqueadero mensual', icon: 'garage' },
  { code: 'toll', label: 'Peajes', icon: 'toll' },
  { code: 'flat_tire', label: 'Pinchazo', icon: 'tire' },
  { code: 'tow', label: 'Grúa / asistencia en carretera', icon: 'tow' },
  { code: 'impound', label: 'Patios / inmovilización', icon: 'impound' },
  { code: 'locksmith', label: 'Cerrajería', icon: 'locksmith' },
  { code: 'bodywork', label: 'Latonería y pintura', icon: 'bodywork' },
  { code: 'diagnostic', label: 'Diagnóstico / escáner', icon: 'diagnostic' },
  { code: 'parts', label: 'Repuestos', icon: 'parts' },
  { code: 'accessories', label: 'Accesorios', icon: 'accessories' },
  { code: 'window_tint', label: 'Polarizado', icon: 'windowTint' },
  { code: 'soat', label: 'SOAT', icon: 'insurance' },
  { code: 'rtm', label: 'Tecnomecánica', icon: 'inspection' },
  { code: 'insurance', label: 'Seguros', icon: 'insurance' },
  { code: 'fine', label: 'Multas', icon: 'fine' },
  { code: 'tax', label: 'Impuestos', icon: 'tax' },
  { code: 'transit_paperwork', label: 'Trámites de tránsito', icon: 'paperwork' },
  { code: 'driver_license', label: 'Licencia de conducción', icon: 'driverLicense' },
  { code: 'loan', label: 'Cuota del crédito o leasing', icon: 'loan' },
  { code: 'other', label: 'Otros', icon: 'more' },
];

/**
 * Categorías para registrar un gasto NUEVO. Sin "Combustible": los tanqueos y las cargas se
 * registran en Tanquear (así se calcula el consumo y no se cuentan dos veces). "Combustible"
 * sigue en EXPENSE_CATEGORIES para mostrar y corregir los gastos que ya se guardaron así.
 */
export const NEW_EXPENSE_CATEGORIES: ExpenseCategory[] = EXPENSE_CATEGORIES.filter((c) => c.code !== 'fuel');
