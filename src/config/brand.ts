/**
 * Identidad de marca (un solo lugar para todos los textos de marca).
 *
 * RODEXA es la marca general; RODEXA Carro es el producto 100 % enfocado en carros
 * (RODEXA Moto es el producto hermano para motocicletas, en otro proyecto).
 * Productos futuros (NO implementados): RODEXA Truck (camiones y vehículos
 * pesados), RODEXA Fleet (gestión de flotas).
 */
export const BRAND = {
  masterBrand: 'RODEXA',
  productLine: 'Carro',
  productName: 'RODEXA Carro',
  tagline: 'Control y cuidado de tu carro',
  company: 'Providentia Tech',
  madeBy: 'Un producto de Providentia Tech',
  footerDescription: 'Tecnología para el cuidado y control de vehículos',
  copyrightYear: 2026,
  /** Correo oficial para reportes, sugerencias y contacto (Ayuda y soporte). */
  supportEmail: 'providentiatech.digital@gmail.com',
  /**
   * Enlace de Google Play: vacío hasta publicar la app (no inventar). Cuando exista,
   * se agrega solo a los mensajes de Compartir y Recomendar.
   */
  playStoreUrl: undefined as string | undefined,
  /**
   * Datos legales y de contacto: vacíos hasta que Providentia Tech los entregue.
   * El pie de página solo muestra los que tengan valor. No inventar.
   */
  legal: {
    nit: undefined as string | undefined,
    address: undefined as string | undefined,
    phone: undefined as string | undefined,
    email: undefined as string | undefined,
    website: undefined as string | undefined,
  },
} as const;
