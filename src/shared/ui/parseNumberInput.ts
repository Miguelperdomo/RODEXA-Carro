/**
 * Número escrito en un campo de pesos o km. `previous` es lo que se veía antes del cambio.
 *
 * Al PEGAR "$350.000,00" (del banco o un extracto) los centavos del final no son pesos: si no,
 * quedaría 35.000.000. Solo al pegar (llegan varios caracteres de golpe); al escribir o borrar
 * ("1.234" → "1.23") nunca se toca.
 */
export function parseNumberInput(text: string, previous: string, maxDigits: number): number | null {
  const pasted = text.length > previous.length + 1;
  const clean = pasted ? text.replace(/[.,]\d{1,2}\s*$/, '') : text;
  const digits = clean.replace(/\D/g, '').slice(0, maxDigits);
  return digits === '' ? null : Number(digits);
}
