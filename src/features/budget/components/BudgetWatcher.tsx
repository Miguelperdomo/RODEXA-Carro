import { useEffect, useRef } from 'react';

import { useSession } from '@/features/session/SessionProvider';
import { useToast } from '@/shared/ui';
import { toISODate, today } from '@/shared/utils/date';

import { budgetStatus, crossedLevel, type BudgetStatus } from '../rules';

/**
 * Aviso del presupuesto DENTRO de la app: el gasto del mes solo sube cuando el usuario
 * registra algo (y en ese momento está usando la app), así que se avisa justo cuando un
 * registro hace pasar el 80 % o el 100 %. Una sola vez por umbral; no al abrir la app ni
 * al cambiar el presupuesto.
 */
export function BudgetWatcher() {
  const toast = useToast();
  const { budget, data, onboardingDone } = useSession();
  const status = onboardingDone ? budgetStatus(budget, data.dashboard.month.totalCop) : undefined;
  const monthKey = toISODate(today()).slice(0, 7);
  const previous = useRef<{ monthKey: string; status: BudgetStatus | undefined } | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = { monthKey, status };
    // Primera lectura o mes nuevo: se toma como punto de partida, sin avisar.
    if (!before || before.monthKey !== monthKey) return;
    const crossed = crossedLevel(before.status, status);
    if (crossed === 'near' && status) toast.show(`Llegaste al ${status.percent} % de tu presupuesto del mes`);
    if (crossed === 'over') toast.show('Superaste el presupuesto del mes');
  }, [monthKey, status, toast]);

  return null;
}
