/**
 * Un taller físico, un servicio a domicilio (mecánico, electricista, grúa…) o un CDA
 * (revisión técnico-mecánica) inscrito y verificado por RODEXA. La lista va DENTRO de la app
 * (sin servidor) y se actualiza con cada versión.
 */
export type ProviderKind = 'workshop' | 'mobile' | 'cda';

/** Cómo se le puede pagar (lo que el negocio nos dijo). */
export type PaymentMethod = 'cash' | 'nequi' | 'daviplata' | 'card' | 'transfer';

/** Horario para "Abierto ahora". `days`: 0 = domingo … 6 = sábado; horas "HH:MM". */
export type OpeningHours = { days: number[]; open: string; close: string };

export type Provider = {
  id: string;
  kind: ProviderKind;
  name: string;
  /** Código DANE del municipio (el mismo del selector de ciudad). */
  cityId: string;
  /** Taller y CDA: dirección escrita por el negocio. */
  address?: string;
  /** Servicio a domicilio: zonas o barrios que cubre. */
  zones?: string;
  services: string[];
  /** Tipos de carro que atiende ("Gasolina", "Diésel", "Eléctricos"…). */
  vehicles: string[];
  phone: string;
  whatsapp?: string;
  /** Cómo se lee el horario ("Lunes a sábado, 8:00 a. m. a 6:00 p. m."). */
  schedule?: string;
  /** Para "Abierto ahora" (si no está, no se dice nada). */
  hours?: OpeningHours;
  payments?: PaymentMethod[];
  /** Pagó por aparecer destacado: SIEMPRE se muestra "Patrocinado". */
  sponsored?: boolean;
};
