import type { Href } from 'expo-router';

import type { IconName } from '@/shared/ui';

/**
 * RODEXA Carro Pro (local). Precios en COP definidos por Providentia Tech: cambiarlos aquí y
 * en ningún otro lugar. Ahorro y equivalente mensual se CALCULAN, nunca se escriben.
 */
export const PRO_MONTHLY_PRICE = 7900;
export const PRO_YEARLY_PRICE = 59900;

/** Lo que se paga en un año con el plan mensual: 7.900 × 12 = 94.800. */
export const PRO_MONTHLY_PRICE_PER_YEAR = PRO_MONTHLY_PRICE * 12;
/** Ahorro del plan anual frente a pagar 12 meses: 94.800 − 59.900 = 34.900. */
export const PRO_YEARLY_SAVINGS = Math.max(PRO_MONTHLY_PRICE_PER_YEAR - PRO_YEARLY_PRICE, 0);
/** El plan anual repartido en 12 meses, redondeado al peso (≈ 4.992). */
export const PRO_YEARLY_MONTHLY_EQUIVALENT = Math.round(PRO_YEARLY_PRICE / 12);

export type ProPlan = 'monthly' | 'yearly';

/** Prueba gratis (Google Play la maneja): días para probar Pro antes de pagar. */
export const PRO_TRIAL_DAYS = 7;

/**
 * Estado de RODEXA Pro: PRÓXIMAMENTE. Todavía no se puede comprar (no hay pagos ni
 * suscripciones); los precios se muestran como informativos. Para el lanzamiento: integrar
 * la compra real, poner PRO_AVAILABLE en `true` y leer la suscripción en `access.ts`.
 */
export const PRO_AVAILABLE = false;
export const PRO_STATUS_LABEL = 'Próximamente';

export const FREE_TAGLINE = 'Controla tu carro.';
export const PRO_TAGLINE = 'Entiende cuánto cuesta, cómo lo estás cuidando y cómo se está comportando.';
export const PRO_HEADLINE = 'Más control. Más información. Más claridad sobre tu carro.';
export const PRO_DESCRIPTION = 'Analiza tus gastos, entiende el uso de tu carro y lleva tus datos contigo.';

/**
 * Preguntas frecuentes de Pro: lo que la gente quiere saber ANTES de pagar. Sin letra
 * pequeña: cancelar es libre, nada se borra y los datos siguen en el celular.
 */
export const PRO_FAQ: { question: string; answer: string }[] = [
  {
    question: `¿Cómo funciona la prueba gratis de ${PRO_TRIAL_DAYS} días?`,
    answer: `Usas todo Pro gratis durante ${PRO_TRIAL_DAYS} días. Si la cancelas antes de que termine, no se te cobra nada. Si no la cancelas, empieza el plan que elegiste.`,
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer:
      'Sí, cuando quieras y sin explicaciones. Se cancela desde Google Play → Pagos y suscripciones. Pro sigue activo hasta que termine el tiempo que ya pagaste.',
  },
  {
    question: '¿Qué pasa con mis datos si dejo de pagar?',
    answer:
      'No se borra nada. Todo lo gratis sigue funcionando igual y tus registros siguen ahí. Solo se cierran las funciones Pro; si vuelves, todo aparece como lo dejaste.',
  },
  {
    question: '¿Y si tengo varios carros y dejo de pagar?',
    answer:
      'Eliges con cuál carro sigues usando RODEXA gratis. Los demás quedan guardados en "solo lectura": los puedes ver, pero no agregarles registros. Si vuelves a Pro, se reactivan.',
  },
  {
    question: '¿Sirve en otro celular?',
    answer:
      'Sí. Pro va con tu cuenta de Google: en el celular nuevo, con la misma cuenta, tocas "Restaurar compra". Tus datos se pasan con la copia de seguridad, porque RODEXA no los guarda en internet.',
  },
  {
    question: '¿Mis datos se suben a internet con Pro?',
    answer: 'No. Con Pro también todo se queda en tu celular: sin cuentas ni servidores de RODEXA.',
  },
];

export type ProGroup = 'money' | 'assistant' | 'analysis' | 'comfort' | 'style' | 'perks';

/** Grupos de beneficios, en el orden en que se muestran. */
export const PRO_GROUPS: { key: ProGroup; title: string }[] = [
  { key: 'money', title: 'Ahorra y controla tus gastos' },
  { key: 'assistant', title: 'Asistente Pro' },
  { key: 'analysis', title: 'Análisis' },
  { key: 'comfort', title: 'Comodidad' },
  { key: 'style', title: 'Personalización' },
  { key: 'perks', title: 'Beneficios' },
];

export type ProFeature = {
  key: string;
  group: ProGroup;
  icon: IconName;
  title: string;
  /** Por qué es útil, en palabras del usuario. */
  description: string;
  /** Pantalla de la función (solo se abre con Pro activo). */
  href?: Href;
};

/**
 * Lo que incluirá Pro: cosas NUEVAS que la versión gratuita no tiene (lo gratis nunca se
 * quita). Las que ya tienen pantalla (análisis, estado, informe, hoja de vida) se abren con
 * Pro activo; las demás se describen sin prometer más de lo que harán.
 */
export const PRO_FEATURES: ProFeature[] = [
  // Ahorra y controla tus gastos
  {
    key: 'multi_car',
    group: 'money',
    icon: 'car',
    title: 'Varios carros',
    description: 'Registra todos tus carros y cambia entre ellos: el de trabajo, el personal o los de la familia.',
  },
  {
    key: 'worker',
    group: 'money',
    icon: 'usageWork',
    title: 'Modo trabajador',
    description:
      'Si trabajas con tu carro: lo que ganaste menos combustible y gastos, por día, semana y mes, con meta diaria.',
  },
  {
    key: 'export',
    group: 'money',
    icon: 'exportData',
    title: 'Exportar a Excel y PDF',
    description: 'Tus gastos ordenados para el contador o la declaración de renta.',
  },
  {
    key: 'life_record',
    group: 'money',
    icon: 'document',
    title: 'Hoja de vida del carro',
    description:
      'Todos los mantenimientos en orden, documentos y repuestos que usa tu carro, listo para compartir. Ideal para vender.',
    href: '/hoja-de-vida',
  },
  {
    key: 'save_ahead',
    group: 'money',
    icon: 'tierBudget',
    title: 'Ahorra para lo que viene',
    description: 'Cuánto apartar al mes para el SOAT, las llantas o el aceite, según lo que te costaron la última vez.',
  },
  {
    key: 'category_budget',
    group: 'money',
    icon: 'expense',
    title: 'Presupuesto por categoría',
    description: 'Un límite para combustible, lavados o repuestos, con aviso si lo superas.',
  },
  // Asistente Pro
  {
    key: 'receipt',
    group: 'assistant',
    icon: 'camera',
    title: 'Lectura del recibo de la estación',
    description: 'Tómale foto a la tirilla y RODEXA propone el valor, los galones y la estación.',
  },
  {
    key: 'report',
    group: 'assistant',
    icon: 'receipt',
    title: 'Informes completos',
    description: 'Todo tu carro en un solo lugar: datos, kilometraje, mantenimiento, documentos, gastos y alertas.',
    href: '/pro/informe',
  },
  {
    key: 'timed_reminders',
    group: 'assistant',
    icon: 'notifications',
    title: 'Recordatorios con hora',
    description: 'Un aviso justo a la hora que elijas, por ejemplo "mañana a las 7, llevarlo al taller".',
  },
  // Análisis
  {
    key: 'advanced_stats',
    group: 'analysis',
    icon: 'stats',
    title: 'Estadísticas avanzadas',
    description: 'Gasto acumulado desde tu primer registro y el mes de mayor gasto de tu carro.',
    href: '/pro/analisis',
  },
  {
    key: 'charts',
    group: 'analysis',
    icon: 'stats',
    title: 'Gráficas de 6 y 12 meses',
    description: 'Mes a mes, cómo cambian tus gastos, el costo por kilómetro y el uso de tu carro.',
    href: '/pro/analisis',
  },
  {
    key: 'expenses',
    group: 'analysis',
    icon: 'expense',
    title: 'Análisis detallado de gastos',
    description: 'Descubre en qué gastas: energía, mantenimiento, repuestos, SOAT, tecnomecánica, póliza, impuesto y más.',
    href: { pathname: '/pro/analisis', params: { vista: 'gastos' } },
  },
  {
    key: 'energy',
    group: 'analysis',
    icon: 'fuel',
    title: 'Análisis avanzado de energía',
    description:
      'Consumo, precio promedio y su evolución, con cada tipo de energía por separado (combustible, GNC o electricidad).',
    href: { pathname: '/pro/analisis', params: { vista: 'energia' } },
  },
  {
    key: 'compare',
    group: 'analysis',
    icon: 'calendar',
    title: 'Comparaciones de períodos',
    description: 'Tus últimos 3, 6 y 12 meses frente a los anteriores: gastos, energía y costo por km.',
    href: { pathname: '/pro/analisis', params: { vista: 'comparar' } },
  },
  {
    key: 'state',
    group: 'analysis',
    icon: 'inspection',
    title: 'Análisis del estado',
    description: 'Lo atrasado, lo próximo y los datos que faltan, según tus registros. No diagnostica fallas.',
    href: '/pro/estado',
  },
  // Comodidad
  {
    key: 'auto_backup',
    group: 'comfort',
    icon: 'storage',
    title: 'Copia de seguridad automática',
    description: 'Se guarda sola cada semana o cada mes en la carpeta que elijas, para que no tengas que recordarlo.',
  },
  {
    key: 'widget',
    group: 'comfort',
    icon: 'usageApps',
    title: 'Widget en tu pantalla',
    description: 'Tu kilometraje y el próximo mantenimiento, sin abrir la app.',
  },
  {
    key: 'photos',
    group: 'comfort',
    icon: 'camera',
    title: 'Varias fotos por registro',
    description: 'La factura, el repuesto, el antes y el después: todo en el mismo registro.',
  },
  // Personalización
  {
    key: 'themes',
    group: 'style',
    icon: 'theme',
    title: 'Temas de color e ícono',
    description: 'Ponle a RODEXA los colores que van con tu carro y cambia el ícono de la app.',
  },
  {
    key: 'share_card',
    group: 'style',
    icon: 'share',
    title: 'Tarjeta para compartir tu carro',
    description: 'Tu placa, tus kilómetros y tu puntaje de cuidado, listos para compartir.',
  },
  // Beneficios
  {
    key: 'no_ads',
    group: 'perks',
    icon: 'statusNotApplicable',
    title: 'Sin anuncios',
    description:
      'Hoy RODEXA Carro no tiene anuncios. Si más adelante la versión gratuita incluye publicidad, con Pro no la verás.',
  },
  {
    key: 'support',
    group: 'perks',
    icon: 'contact',
    title: 'Soporte prioritario',
    description: 'Tus mensajes al equipo de RODEXA se responden primero.',
  },
  {
    key: 'early',
    group: 'perks',
    icon: 'star',
    title: 'Acceso anticipado',
    description: 'Prueba antes que nadie las funciones nuevas de RODEXA.',
  },
];

/** Lo esencial: sigue gratis y no se bloquea. */
export const FREE_FEATURES = [
  'Mantenimiento',
  'Documentos',
  'Registros de energía',
  'Gastos',
  'Historial',
  'Recordatorios',
  'Ficha del carro',
  'Revisión para viajar',
  'Estadísticas: el mes, costo por km y últimos 12 meses',
  'Copia de seguridad (exportar e importar)',
];

/**
 * Tabla "Gratis vs Pro". `true` = incluido; `false` = no; un texto = incluido con ese alcance.
 * Lo de arriba es igual en las dos: Pro SUMA, no quita.
 */
export const PRO_COMPARISON: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: 'Mantenimiento y documentos', free: true, pro: true },
  { label: 'Energía, gastos e historial', free: true, pro: true },
  { label: 'Estadísticas del mes', free: true, pro: true },
  { label: 'Carros', free: '1', pro: 'Todos' },
  { label: 'Copia de seguridad', free: 'Manual', pro: 'Automática' },
  { label: 'Modo trabajador', free: false, pro: true },
  { label: 'Gráficas de 6 y 12 meses', free: false, pro: true },
  { label: 'Exportar a Excel y PDF', free: false, pro: true },
  { label: 'Hoja de vida del carro', free: false, pro: true },
  { label: 'Ahorra para lo que viene', free: false, pro: true },
  { label: 'Widget, temas e ícono', free: false, pro: true },
  { label: 'Sin anuncios', free: 'Hoy', pro: 'Siempre' },
];
