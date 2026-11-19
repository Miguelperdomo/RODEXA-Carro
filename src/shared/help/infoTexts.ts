import type { EnergyKind } from '@/features/history/types';
import type { InfoText } from '@/shared/ui/InfoButton';

/**
 * Textos del botón ⓘ: explican CÓMO calcula la app (revisados contra el código), sin valores,
 * intervalos ni consejos técnicos inventados. Cortos: si son largos, nadie los lee.
 */

/** Estadísticas → Costo por km del mes (stats/compute: computeMonthStats + kmInMonth). */
export const INFO_COST_PER_KM_MONTH: InfoText = {
  title: 'Costo por km',
  message:
    'Lo que te costó cada km del mes: todo lo que registraste con valor (cargas de combustible o energía, mantenimientos, gastos y documentos) dividido entre los km que recorriste.\n\nPara medir los km hace falta un kilometraje registrado en los últimos días del mes anterior y otro en el mes (cerca del final, si el mes ya terminó). Con menos de 100 km no se calcula.',
};

/** Estadísticas → Costo por km de los últimos 12 meses (stats/compute: measuredCostPerKm). */
export const INFO_COST_PER_KM_YEAR: InfoText = {
  title: 'Costo por km',
  message:
    'Todo lo que registraste con valor en los últimos 12 meses, dividido entre los km que recorriste en ese tiempo. Si llevas menos tiempo, se mide desde tu primer kilometraje registrado. Con menos de 100 km no se calcula.',
};

/** Estadísticas → Consumo estimado (energy/compute: consumptionPairs). */
export function infoConsumption(kind: EnergyKind): InfoText {
  const message: Record<EnergyKind, string> = {
    fuel: 'Cuántos km recorres con un galón (o litro). Se calcula entre dos cargas de tanque lleno con su kilometraje, sumando lo que cargaste en medio.\n\nEs un estimado con tus registros, no un valor exacto.',
    cng: 'Cuántos km recorres con un m³ de gas. Se calcula entre dos cargas completas con su kilometraje, sumando lo que cargaste en medio.\n\nEs un estimado con tus registros, no un valor exacto.',
    charge:
      'Cuántos km recorres con un kWh. Se calcula entre dos cargas que terminan en el mismo porcentaje de batería, con su kilometraje.\n\nEs un estimado con tus registros, no un valor exacto.',
  };
  return { title: 'Consumo estimado', message: message[kind] };
}

/** Mi carro → Puntaje de cuidado (care/score: WEIGHTS y STATUS_VALUE). */
export const INFO_CARE_SCORE: InfoText = {
  title: 'Puntaje de cuidado',
  message:
    'Una guía de 0 a 100 de qué tan al día llevas tu carro, solo con tus registros. Suma:\n\n• Mantenimientos al día: hasta 50 puntos.\n• Documentos vigentes: hasta 30.\n• Kilometraje actualizado: hasta 20.\n\nLo próximo suma una parte y lo pendiente o vencido no suma. Lo que no tiene datos no cuenta. No es una revisión mecánica.',
};

/** Mi carro → Mantenimiento: estados (cars/componentDetail: WARN_RATIO = 15 %). */
export const INFO_MAINTENANCE_STATUS: InfoText = {
  title: 'Estados del mantenimiento',
  message:
    'Según el intervalo que configuraste para cada componente (por km o por tiempo):\n\n• Al día: todavía falta.\n• Próximo: ya vas en el último 15 % del intervalo.\n• Pendiente: ya se cumplió el km o la fecha.\n• Sin datos: falta configurar el intervalo o el último cambio.\n• No aplica: tu carro no lo tiene.',
};

/** Registrar tanqueo / carga de GNC → ¿Tanque lleno? (energy/form: FULL_QUESTION). */
export const INFO_FULL: Partial<Record<EnergyKind, InfoText>> = {
  fuel: {
    title: '¿Llenaste el tanque?',
    message:
      'Sí: llenaste hasta el tope (hasta que la bomba se detuvo).\n\nParcial: cargaste solo una parte.\n\nCon dos cargas de tanque lleno, RODEXA estima el consumo.',
  },
  cng: {
    title: '¿Llenaste el cilindro?',
    message: 'Sí: el cilindro quedó lleno.\n\nParcial: cargaste solo una parte.\n\nCon dos cargas completas, RODEXA estima el consumo.',
  },
};
