/**
 * Estado que solo se "confirma" (se entrega a la UI) cuando quedó guardado en el
 * teléfono. Los cambios seguidos se calculan sobre el último estado pendiente,
 * así ninguno se pierde; si la escritura falla, la UI sigue mostrando lo que sí
 * está en el disco.
 */
export function createConfirmedState<T>(save: (value: T) => Promise<boolean>, onConfirmed: (value: T) => void) {
  let confirmed: T | null = null;
  let latest: T | null = null;
  let version = 0;
  let confirmedVersion = 0;

  return {
    /** Lo leído del teléfono al abrir la app. */
    hydrate(value: T) {
      confirmed = value;
      latest = value;
    },
    /**
     * Aplica un cambio y espera a que quede en el disco. `true` = guardado (y ya
     * visible en la UI); `false` = no se pudo guardar (la UI no cambia).
     * Antes de hidratar no se escribe nada.
     */
    async commit(change: (value: T) => T): Promise<boolean> {
      if (latest === null) return false;
      const next = change(latest);
      latest = next;
      const mine = ++version;
      const ok = await save(next);
      if (ok) {
        if (mine > confirmedVersion) {
          confirmedVersion = mine;
          confirmed = next;
          onConfirmed(next);
        }
        return true;
      }
      // Sin cambios más nuevos en camino: se vuelve a lo que sí está guardado.
      if (mine === version) latest = confirmed;
      return false;
    },
    /** Reemplaza todo (p. ej. tras "Eliminar todos los datos", ya borrado del disco). */
    reset(value: T) {
      version++;
      confirmedVersion = version;
      confirmed = value;
      latest = value;
      onConfirmed(value);
    },
  };
}
