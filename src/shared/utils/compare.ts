/**
 * Compara textos por su código (no por idioma). Para fechas ISO ("2026-11-10") e ids da el
 * mismo orden que `localeCompare`, pero mucho más rápido en Android (Hermes): ordenar miles de
 * registros por fecha deja de trabar la app. Para NOMBRES (con tildes y ñ) se sigue usando
 * `localeCompare(…, 'es')`.
 */
export function cmpText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
