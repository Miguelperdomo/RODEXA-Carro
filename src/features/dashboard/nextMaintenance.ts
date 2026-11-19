import { buildComponentDetail } from '@/features/cars/componentDetail';
import type { ComponentSummary } from '@/features/cars/types';
import type { HistoryEntry } from '@/features/history/types';
import type { StatusLevel } from '@/shared/theme';

export type NextMaintenance = {
  component: ComponentSummary;
  status: StatusLevel;
  /** "Faltan 1.200 km o ~2 meses" / "Pasaron 300 km del previsto". */
  remaining: string;
  /** Parte del intervalo ya usada (0 = recién hecho, 1 = toca hoy o ya se pasó). */
  progress: number;
};

const SEVERITY: Record<StatusLevel, number> = { due: 0, soon: 1, ok: 2, nodata: 3, na: 4 };

/**
 * El mantenimiento más próximo, para Inicio. Solo componentes activos con intervalo y
 * último dato (los "Sin datos" no se muestran: nunca se supone un estado).
 */
export function nextMaintenance(
  components: ComponentSummary[],
  history: HistoryEntry[],
  currentKm: number,
  today: Date,
): NextMaintenance | undefined {
  const candidates = components.flatMap((component) => {
    if (!component.enabled) return [];
    const detail = buildComponentDetail(component, history, currentKm, today);
    if (!detail.ready || !detail.status || detail.remainingRatio === undefined || !Number.isFinite(detail.remainingRatio)) {
      return [];
    }
    return [
      {
        component,
        status: detail.status,
        remaining: detail.remainingAll ?? detail.remaining ?? '',
        ratio: detail.remainingRatio,
      },
    ];
  });
  const best = candidates.sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.ratio - b.ratio)[0];
  if (!best) return undefined;
  return {
    component: best.component,
    status: best.status,
    remaining: best.remaining,
    progress: Math.min(Math.max(1 - best.ratio, 0), 1),
  };
}
