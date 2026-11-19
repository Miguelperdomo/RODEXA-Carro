import { formatCop } from '@/shared/utils/format';

/**
 * "¿Cuánto me ahorro en carro?": lo que pagarías en transporte público (el pasaje y los viajes
 * los escribe la persona; RODEXA no inventa tarifas, que cambian por ciudad) frente a lo que de
 * verdad le gastaste al carro este mes (tus registros). Si el carro sale más caro, se dice.
 */
export type TransitSavings = {
  /** Lo que costarían los viajes en transporte público al mes. */
  transitCop: number;
  /** Lo que le gastaste al carro este mes, según tus registros. */
  carCop: number;
  /** transitCop − carCop (negativo = el carro salió más caro). */
  savedCop: number;
};

export function transitSavings(fareCop: number, tripsPerMonth: number, carSpentCop: number): TransitSavings | undefined {
  if (!(fareCop > 0) || !(tripsPerMonth > 0) || !Number.isFinite(carSpentCop)) return undefined;
  const transitCop = Math.round(fareCop * tripsPerMonth);
  return { transitCop, carCop: carSpentCop, savedCop: transitCop - carSpentCop };
}

/** Viajes al mes desde "viajes al día" y "días a la semana" (52 semanas / 12 meses ≈ 4,33). */
export const tripsPerMonth = (perDay: number, daysPerWeek: number) => Math.round(perDay * daysPerWeek * (52 / 12));

/** Texto para compartir (sin emojis ni datos personales). */
export function savingsShareText(result: TransitSavings, monthName: string): string {
  const cop = (v: number) => formatCop(Math.abs(v));
  return result.savedCop > 0
    ? `En ${monthName} mi carro me ahorró ${cop(result.savedCop)} frente al transporte público. Lo calculé con RODEXA Carro.`
    : `Llevo las cuentas de mi carro con RODEXA Carro: en ${monthName} le he invertido ${cop(result.carCop)}.`;
}
