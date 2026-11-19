import { useSession } from '@/features/session/SessionProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { FuelTracking, UsageStyle } from '@/features/settings/types';

import { monthlyFuelActive, monthlyFuelItem } from './style';

/**
 * Cambia el estilo o el combustible y deja coherente el "Combustible del mes": solo está activo
 * en Tranqui con "un valor al mes". Si no, queda en pausa (no se borra: al volver, sigue con su
 * valor) para no preguntar de más ni contar el combustible dos veces.
 */
export function useApplyStyle() {
  const { settings, update } = useSettings();
  const { recurringExpenses, setRecurringExpenses } = useSession();

  return (changes: { usageStyle?: UsageStyle; fuelTracking?: FuelTracking }) => {
    update(changes);
    const active = monthlyFuelActive(changes.usageStyle ?? settings.usageStyle, changes.fuelTracking ?? settings.fuelTracking);
    const item = monthlyFuelItem(recurringExpenses);
    if (!item || !item.paused === active) return;
    const next = { ...item };
    if (active) delete next.paused;
    else next.paused = true;
    void setRecurringExpenses(recurringExpenses.map((r) => (r.id === item.id ? next : r)));
  };
}
