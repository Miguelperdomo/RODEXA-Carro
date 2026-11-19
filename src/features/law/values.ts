/**
 * Valores legales para CARROS en Colombia.
 *
 * ⚠️ ACTUALIZAR CADA AÑO (UVB y tarifas del SOAT cambian el 1 de enero).
 *
 * Fuentes (revisadas en noviembre de 2026):
 * - UVB 2026 = $12.110: Resolución 3488 del 31 de diciembre de 2025, Ministerio de Hacienda.
 * - Multas (art. 131 Ley 769 de 2002, modificado por la Ley 1383 de 2010), liquidadas en UVB
 *   desde 2026. Valores de la tabla oficial "Valor de las multas… vigencia 2026" de la Alcaldía de
 *   Barranquilla: tipo D = $1.266.222 y tipo C = $633.111. Inmovilización: D.02 (sin SOAT) y C.35
 *   (sin revisión técnico-mecánica), según el art. 131. Se muestran como APROXIMADOS
 *   ("verifícalo en el SIMIT"): cada autoridad liquida su valor.
 * - Descuento por pronto pago (art. 136 Ley 769, modificado por el art. 24 Ley 1383 de 2010; plazos
 *   según la Alcaldía de Bogotá): en vía pública, 50 % con curso dentro de 5 días hábiles y 25 %
 *   entre el día 6 y el 20 hábil; por cámara (fotodetección), desde la notificación: 50 % hasta el
 *   día 11 hábil y 25 % del 12 al 26. No aplica a las infracciones por alcohol.
 * - SOAT 2026, tarifas máximas para automóviles familiares: Circular Externa 022 de 2025 de la
 *   Superintendencia Financiera (valores publicados por la prensa especializada). Aproximadas.
 * - Primera revisión técnico-mecánica de un carro particular nuevo: a los 5 años de la matrícula
 *   (Ley 2294 de 2023, para los matriculados después del 20 de mayo de 2023); servicio público, a
 *   los 2 años. Después, cada año.
 */
export const UVB_YEAR = 2026;
export const UVB_COP = 12_110;

/** Valor 2026 de cada tipo de infracción (tabla oficial de la Alcaldía de Barranquilla). */
export const FINE_TYPE_COP_2026 = { C: 633_111, D: 1_266_222 } as const;

export type FineCode = 'D02' | 'C35' | 'D01' | 'C29';

/**
 * Situaciones bien soportadas para carro. `immobilization` solo donde está confirmado (si no, no
 * se dice nada sobre inmovilización).
 */
export const FINES: Record<FineCode, { type: 'C' | 'D'; immobilization?: true; what: string }> = {
  D02: { type: 'D', immobilization: true, what: 'Manejar sin SOAT vigente' },
  C35: { type: 'C', immobilization: true, what: 'Manejar sin revisión técnico-mecánica vigente' },
  D01: { type: 'D', what: 'Manejar sin haber sacado la licencia de conducción' },
  C29: { type: 'C', what: 'Manejar con exceso de velocidad' },
};

/** Valor aproximado en pesos (redondeado a mil). */
export const fineCop = (code: FineCode) => Math.round(FINE_TYPE_COP_2026[FINES[code].type] / 1000) * 1000;

/** "D.02". */
export const fineCodeLabel = (code: FineCode) => `${code.charAt(0)}.${code.slice(1)}`;

/** Plazos del descuento, en días hábiles. */
export const DISCOUNT_RULES = {
  street: { full: 5, partial: 20 },
  camera: { full: 11, partial: 26 },
} as const;

/** SOAT 2026: tarifa máxima para automóvil familiar, por cilindraje y antigüedad. */
export const SOAT_FAMILY_CAR_2026 = [
  { maxCc: 1499, young: 447_300, old: 592_900, label: 'Menos de 1.500 c.c.' },
  { maxCc: 2500, young: 544_700, old: 677_400, label: '1.500 a 2.500 c.c.' },
  { maxCc: Infinity, young: 636_000, old: 754_300, label: 'Más de 2.500 c.c.' },
] as const;

/** Antigüedad que cambia la tarifa del SOAT: de 0 a 9 años, o 10 años o más. */
export const SOAT_OLD_FROM_YEARS = 10;

/**
 * Tarifa aproximada del SOAT para un automóvil familiar. Sin cilindraje o sin año, undefined
 * (no se adivina). No aplica a camionetas, camperos ni servicio público (otras tarifas).
 */
export function soatFamilyCarPrice(cc: number | undefined, modelYear: number | undefined, currentYear: number): number | undefined {
  if (!cc || !modelYear || cc <= 0) return undefined;
  const row = SOAT_FAMILY_CAR_2026.find((r) => cc <= r.maxCc)!;
  return currentYear - modelYear >= SOAT_OLD_FROM_YEARS ? row.old : row.young;
}

/** Años hasta la primera revisión técnico-mecánica (carro nuevo). */
export const FIRST_RTM_YEARS = { private: 5, public: 2 } as const;

/**
 * "Lo que debe llevar el carro" (art. 30 Ley 769 de 2002), como lo enumera un concepto del
 * Ministerio de Transporte. Otras fuentes listan más elementos: no se agregan sin confirmar.
 */
export const ROAD_KIT = [
  { key: 'jack', label: 'Gato con capacidad para levantar el carro' },
  { key: 'wrench', label: 'Cruceta' },
  { key: 'triangles', label: 'Dos señales de carretera en forma de triángulo' },
  { key: 'firstAid', label: 'Botiquín de primeros auxilios' },
  { key: 'extinguisher', label: 'Extintor' },
  { key: 'chocks', label: 'Dos tacos para bloquear el carro' },
] as const;

export const SIMIT_NOTE = 'Valor aproximado. Verifícalo en el SIMIT o con la autoridad de tránsito.';

/**
 * Guía de traspaso (carro usado). Requisitos que coinciden en los organismos de tránsito
 * consultados (Santa Marta, Bucaramanga): pueden cambiar un poco según la ciudad.
 */
export const TRANSFER_STEPS = [
  { title: 'Inscríbanse en el RUNT', text: 'El vendedor y el comprador deben estar inscritos en el RUNT.' },
  { title: 'SOAT y revisión técnico-mecánica vigentes', text: 'El carro debe tenerlos al día en el RUNT.' },
  { title: 'Paz y salvo de multas', text: 'Vendedor y comprador sin multas pendientes en el SIMIT.' },
  { title: 'Impuesto vehicular al día', text: 'Del año actual y los anteriores, en la Secretaría de Hacienda del departamento.' },
  { title: 'Contrato de compraventa', text: 'Firmado por los dos. En algunas ciudades piden que esté autenticado.' },
  {
    title: 'Formulario de solicitud de trámite',
    text: 'El formulario del RUNT, con las improntas del carro, las cédulas y la licencia de tránsito (tarjeta de propiedad).',
  },
  {
    title: 'Radicar en el organismo de tránsito',
    text: 'Donde está matriculado el carro: pagan los derechos del trámite y el carro queda a nombre del comprador.',
  },
] as const;
