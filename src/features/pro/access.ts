import { PRO_PREVIEW_ENABLED } from '@/config/dev';

import type { ProPlan } from './config';

export type ProAccess = {
  isPro: boolean;
  /** "free" · "dev_preview" = vista previa local de desarrollo (nunca en la app publicada). */
  source: 'free' | 'dev_preview';
};

/**
 * Regla pura (se prueba). Todavía NO existe un sistema de pagos: ninguna compra puede
 * activar Pro. Solo la vista previa de desarrollo lo enciende, y esa siempre está
 * apagada en la app publicada (ver config/dev).
 */
export function resolveProAccess(devPreview: boolean): ProAccess {
  return devPreview ? { isPro: true, source: 'dev_preview' } : { isPro: false, source: 'free' };
}

/** Estado Pro de este teléfono. Sin cuenta ni servidor: es local. */
export function useProAccess(): ProAccess {
  return resolveProAccess(PRO_PREVIEW_ENABLED);
}

export type PurchaseResult = { status: 'unavailable'; message: string };

export const PURCHASE_UNAVAILABLE_MESSAGE =
  'Los pagos de RODEXA Pro todavía no están disponibles. Te avisaremos cuando puedas activarlo.';

/**
 * Punto ÚNICO de la futura compra (Google Play / App Store). Hoy no hay pasarela:
 * no simula la compra, no activa Pro y no crea ninguna suscripción.
 */
export async function startProPurchase(_plan: ProPlan): Promise<PurchaseResult> {
  return { status: 'unavailable', message: PURCHASE_UNAVAILABLE_MESSAGE };
}
