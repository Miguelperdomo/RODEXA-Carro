import { SymbolView } from 'expo-symbols';
import type { AndroidSymbol } from 'expo-symbols';

import { sizes } from '@/shared/theme/layout';
import { useTheme } from '@/shared/theme/ThemeProvider';

/**
 * Registro central de íconos de RODEXA Carro (Material Symbols en Android).
 * Las pantallas usan estos nombres propios; si cambiamos de librería
 * o agregamos iOS, solo se toca este archivo.
 */
const ICONS = {
  home: 'home',
  history: 'history',
  stats: 'bar_chart',
  car: 'directions_car',
  motorcycle: 'two_wheeler',
  company: 'domain',
  founder: 'person',
  add: 'add',
  close: 'close',
  chevronRight: 'chevron_right',
  oil: 'oil_barrel',
  alignment: 'car_repair',
  belt: 'link',
  transmission: 'settings',
  suspension: 'swap_vert',
  evSystem: 'ev_station',
  climate: 'ac_unit',
  document: 'description',
  maintenance: 'build',
  odometer: 'speed',
  expense: 'payments',
  income: 'paid',
  receipt: 'receipt_long',
  recommendation: 'lightbulb',
  settings: 'settings',
  info: 'info',
  back: 'arrow_back',
  calendar: 'calendar_month',
  check: 'check',
  note: 'edit_note',
  warning: 'warning',
  more: 'more_horiz',
  fuel: 'local_gas_station',
  wash: 'local_car_wash',
  parking: 'local_parking',
  toll: 'toll',
  parts: 'hardware',
  accessories: 'shopping_bag',
  fine: 'gavel',
  tax: 'account_balance',
  insurance: 'shield',
  inspection: 'fact_check',
  brakes: 'disc_full',
  tire: 'tire_repair',
  battery: 'battery_charging_full',
  generalService: 'engineering',
  electric: 'bolt',
  cooling: 'thermostat',
  expandMore: 'expand_more',
  expandLess: 'expand_less',
  checkboxOn: 'check_box',
  checkboxOff: 'check_box_outline_blank',
  theme: 'contrast',
  textSize: 'format_size',
  lock: 'lock',
  camera: 'photo_camera',
  notifications: 'notifications',
  language: 'language',
  faq: 'quiz',
  bug: 'bug_report',
  premium: 'workspace_premium',
  version: 'code',
  partsCatalog: 'inventory_2',
  tierBudget: 'savings',
  tierBalanced: 'balance',
  workshop: 'storefront',
  location: 'location_on',
  preview: 'visibility',
  partner: 'handshake',
  search: 'search',
  city: 'location_city',
  selectArrow: 'unfold_more',
  usagePersonal: 'person',
  usageWork: 'work',
  usageApps: 'smartphone',
  usageTravel: 'route',
  usageMixed: 'sync',
  tune: 'tune',
  reset: 'restart_alt',
  logout: 'logout',
  star: 'star',
  share: 'share',
  suggest: 'forum',
  storage: 'storage',
  exportData: 'file_download',
  importData: 'file_upload',
  delete: 'delete',
  policy: 'policy',
  contact: 'support_agent',
  markRead: 'done_all',
  recommend: 'thumb_up',
  liters: 'water_drop',
  pricePerLiter: 'price_change',
  travel: 'luggage',
  checklist: 'checklist',
  checked: 'task_alt',
  unchecked: 'radio_button_unchecked',
  tow: 'car_crash',
  impound: 'warehouse',
  locksmith: 'key',
  bodywork: 'format_paint',
  diagnostic: 'troubleshoot',
  detailing: 'auto_awesome',
  windowTint: 'window',
  paperwork: 'assignment',
  driverLicense: 'badge',
  loan: 'account_balance_wallet',
  garage: 'garage',
  phone: 'call',
  emergency: 'sos',
  starOutline: 'star_outline',
  statusOk: 'check_circle',
  statusSoon: 'schedule',
  statusDue: 'error',
  statusNoData: 'help',
  statusNotApplicable: 'remove_circle',
} as const satisfies Record<string, AndroidSymbol>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = sizes.iconMd, color }: IconProps) {
  // Sin color explícito: el texto principal del tema activo (visible en claro y oscuro).
  const { colors } = useTheme();
  return (
    <SymbolView name={{ android: ICONS[name] }} size={size} tintColor={color ?? colors.text.primary} />
  );
}
