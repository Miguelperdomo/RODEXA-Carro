/**
 * Datos de DEMOSTRACIÓN (carro ficticio, historial y repuestos DEMO): SOLO desarrollo.
 *
 * - En la app publicada (`__DEV__ = false`) están SIEMPRE apagados.
 * - En desarrollo también vienen apagados, porque Expo Go corre en modo desarrollo y
 *   un tester los vería como si fueran reales. Para verlos en tu copia local, cambia
 *   `SHOW_DEMO_DATA_IN_DEV` a `true` (y no lo subas así).
 */
const SHOW_DEMO_DATA_IN_DEV = false;

/** Regla pura (se prueba): demo solo si es desarrollo Y alguien lo activó a propósito. */
export function isDemoEnabled(isDev: boolean, showInDev: boolean): boolean {
  return isDev && showInDev;
}

export const DEMO_DATA_ENABLED = isDemoEnabled(__DEV__, SHOW_DEMO_DATA_IN_DEV);

/**
 * Vista previa de RODEXA Pro: SOLO desarrollo, para revisar las pantallas Pro sin pagos.
 * Todavía no hay pagos: en la app publicada Pro está SIEMPRE apagado. Para verlo en tu
 * copia local, cambia `PREVIEW_PRO_IN_DEV` a `true` (y no lo subas así).
 */
const PREVIEW_PRO_IN_DEV = false;

export const PRO_PREVIEW_ENABLED = isDemoEnabled(__DEV__, PREVIEW_PRO_IN_DEV);
