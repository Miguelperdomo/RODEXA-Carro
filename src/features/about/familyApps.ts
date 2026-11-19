import type { ImageSourcePropType } from 'react-native';

/**
 * La familia RODEXA (Providentia Tech): otras apps que le pueden servir a la persona. RODEXA
 * Carro no se muestra a sí misma. Cuando una se publique, cambiar `status` a 'available' y
 * poner su enlace de Play Store en `url` (solo aquí). Las descripciones dicen lo que cada app
 * VA A TENER según su diseño, sin prometer ideas a futuro ni funciones inventadas.
 */
export type FamilyAppFeature = { emoji: string; title: string; text: string };

export type FamilyApp = {
  key: string;
  emoji: string;
  /** Logo de la app (si lo hay; si no, se muestra el emoji). */
  logo?: ImageSourcePropType;
  name: string;
  /** Una frase: para quién es y qué resuelve. */
  tagline: string;
  description: string;
  status: 'available' | 'soon';
  /** Enlace de la tienda (solo si está publicada). */
  url?: string;
  /** Detalle (al tocar la tarjeta). */
  about?: string;
  features?: FamilyAppFeature[];
  forWho?: string;
  /** Lo que la app quiere que la persona sienta ("Por fin sé cuánto me cuesta mi hogar"). */
  motto?: string;
};

/** "moto,hogar" → las apps de las que pidió aviso. */
export const notifiedApps = (saved: string): string[] => saved.split(',').filter(Boolean);

/** Prende o apaga el aviso de una app (devuelve el texto para guardar). */
export function toggleNotify(saved: string, key: string): string {
  const list = notifiedApps(saved);
  return (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]).join(',');
}

/** Promesas que comparten todas las apps RODEXA. */
export const FAMILY_PROMISES: FamilyAppFeature[] = [
  { emoji: '📱', title: 'Tus datos en tu celular', text: 'Sin cuentas para empezar y sin subir tu información a internet.' },
  { emoji: '🆓', title: 'Gratis y completa', text: 'Una versión gratis para usar todos los días, sin sentirte obligado a pagar.' },
  { emoji: '🇨🇴', title: 'Hecha en Colombia', text: 'Por Providentia Tech, pensada para cómo vivimos aquí.' },
];

export const FAMILY_APPS: FamilyApp[] = [
  {
    key: 'moto',
    emoji: '🏍️',
    name: 'RODEXA Moto',
    logo: require('../../../assets/images/apps/rodexa-moto.png'),
    tagline: '¿También tienes moto?',
    description: 'La misma ayuda de RODEXA Carro, para tu moto: mantenimiento, SOAT, tecnomecánica, gasolina y gastos.',
    status: 'soon',
    about:
      'RODEXA Moto es la versión de RODEXA para tu moto. Lo mismo que ya conoces de RODEXA Carro: saber qué mantenimiento le corresponde a tu moto, cuándo vencen sus documentos y cuánto te cuesta.',
    features: [
      { emoji: '🔧', title: 'Mantenimiento', text: 'Aceite, frenos, llantas, kit de arrastre y más, con avisos según tus kilómetros o fechas.' },
      { emoji: '📄', title: 'Documentos al día', text: 'SOAT, tecnomecánica e impuesto, con aviso antes de que venzan.' },
      { emoji: '⛽', title: 'Gasolina', text: 'Tus cargas de combustible y cuánto rinde tu moto.' },
      { emoji: '💰', title: 'Gastos', text: 'Todo lo que le gastas, por categoría y por mes.' },
      { emoji: '📊', title: 'Historial y estadísticas', text: 'En qué gastas y cómo cambia mes a mes.' },
    ],
    forWho: 'Para quien tiene moto, o moto y carro, y quiere tenerlo todo bajo control.',
  },
  {
    key: 'negocio',
    emoji: '🏪',
    name: 'RODEXA Negocio',
    logo: require('../../../assets/images/apps/rodexa-negocio.png'),
    tagline: 'Entiende cómo está funcionando tu negocio',
    description: 'Ventas, gastos, inventario, clientes y lo que te deben, para tu negocio o emprendimiento.',
    status: 'soon',
    about:
      'RODEXA Negocio es para tu tienda, tu emprendimiento o tu trabajo independiente: registras lo que vendes y lo que gastas en segundos, y la app te muestra cómo va tu negocio. No necesitas saber de contabilidad.',
    features: [
      { emoji: '💵', title: 'Ventas y gastos', text: 'Regístralos en pocos segundos, también otros ingresos.' },
      { emoji: '📦', title: 'Productos e inventario', text: 'Cuánto tienes de cada producto, con entradas y salidas de mercancía.' },
      { emoji: '✂️', title: 'Productos o servicios', text: 'Sirve si vendes productos, si das servicios o las dos cosas.' },
      {
        emoji: '📒',
        title: 'Lo que te deben y lo que debes',
        text: 'Cuentas por cobrar y por pagar, con abonos y pagos por partes.',
      },
      { emoji: '👥', title: 'Clientes y proveedores', text: 'Todos tus contactos del negocio en un solo lugar.' },
      { emoji: '📋', title: 'Tu negocio de un vistazo', text: 'Un panel con lo más importante del día y del mes.' },
      {
        emoji: '📊',
        title: 'Estadísticas',
        text: 'Cuánto vendes, cuánto gastas, tus productos más vendidos y cómo va creciendo tu negocio.',
      },
    ],
    forWho:
      'Tiendas, restaurantes, barberías, peluquerías, talleres, negocios familiares, emprendedores, vendedores independientes y quienes ofrecen servicios. Usas solo lo que tu negocio necesita.',
    motto: 'Entiende cómo está funcionando tu negocio.',
  },
  {
    key: 'hogar',
    emoji: '🏠',
    name: 'RODEXA Hogar',
    logo: require('../../../assets/images/apps/rodexa-hogar.png'),
    tagline: 'Por fin sé cuánto me está costando mi hogar',
    description: 'Gastos, servicios, pagos, reparaciones y pendientes de tu casa, en un solo lugar.',
    status: 'soon',
    about:
      'RODEXA Hogar es el centro de control de tu casa: tus gastos, los servicios, lo que tienes por pagar, tus electrodomésticos y sus reparaciones, todo en un solo lugar. No es una app de contabilidad: es para que sepas, sin complicarte, cuánto te cuesta tu hogar.',
    features: [
      { emoji: '💰', title: 'Gastos y presupuesto', text: 'Registra tus gastos por categoría y controla tu presupuesto del mes.' },
      {
        emoji: '💡',
        title: 'Servicios y pagos',
        text: 'Agua, energía, gas e internet: fechas de pago, lo pendiente y recordatorios para pagar a tiempo.',
      },
      {
        emoji: '🧺',
        title: 'Tus electrodomésticos',
        text: 'Nevera, lavadora, televisor y más: fecha de compra, garantía, mantenimientos y cuánto te han costado.',
      },
      {
        emoji: '📋',
        title: 'Tu casa de un vistazo',
        text: 'Cuánto llevas gastado este mes, cuánto te falta por pagar y lo próximo que vence.',
      },
      { emoji: '🛒', title: 'Compras y tareas', text: 'Listas de compras, tareas de la casa y un calendario de actividades.' },
      { emoji: '👨‍👩‍👧', title: 'Gastos compartidos', text: 'Organiza lo que se paga entre la pareja o la familia.' },
      { emoji: '📊', title: 'Estadísticas', text: 'En qué gastas y cómo cambia de un mes a otro.' },
    ],
    forWho: 'Vivas solo, en pareja o en familia, en arriendo, en una habitación o en casa propia.',
    motto: 'Por fin sé cuánto me está costando mi hogar.',
  },
  {
    key: 'seguridad',
    emoji: '🛡️',
    name: 'RODEXA Seguridad',
    logo: require('../../../assets/images/apps/rodexa-seguridad.png'),
    tagline: 'Protege tu celular y a tu familia',
    description: 'Bloquea páginas y búsquedas de contenido para adultos y te ayuda a cuidar a tu familia en internet.',
    status: 'soon',
    about:
      'RODEXA Seguridad es una protección digital para ti y tu familia: bloquea páginas pornográficas y contenido sexual explícito en tu celular. Te ayuda si quieres dejar de ver ese contenido o si quieres proteger a tus hijos, con lo que cada sistema permite.',
    features: [
      { emoji: '🚫', title: 'Bloqueo de páginas para adultos', text: 'Bloquea sitios pornográficos conocidos, con listas que se actualizan.' },
      { emoji: '🔍', title: 'Búsqueda segura', text: 'Activa la búsqueda segura en Google y otros buscadores compatibles.' },
      {
        emoji: '🌐',
        title: 'Navegación protegida',
        text: 'Protección en navegadores como Chrome, Firefox y Edge, y menos contenido explícito en redes compatibles.',
      },
      {
        emoji: '🤝',
        title: 'Modo Compromiso',
        text: 'Para quien decide dejar la pornografía: restricciones que te ayudan a mantener tu decisión.',
      },
      { emoji: '👨‍👩‍👧', title: 'Protección familiar', text: 'Los papás configuran los filtros para cuidar a sus hijos.' },
      { emoji: '🔒', title: 'Contraseña de administrador', text: 'Para que la protección no se pueda quitar fácilmente.' },
      { emoji: '📊', title: 'Tu protección de un vistazo', text: 'Un panel con lo que se ha bloqueado y los intentos de acceso.' },
    ],
    forWho:
      'Para quien quiere alejarse de la pornografía por decisión propia y para las familias que quieren proteger a sus hijos en internet.',
    motto: 'Un internet más seguro para ti y tu familia.',
  },
];
