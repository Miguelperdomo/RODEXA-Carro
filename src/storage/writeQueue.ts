type Pending = { value: string; waiters: ((ok: boolean) => void)[] };

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 300;

/**
 * Escrituras en orden y sin pisarse: cada clave guarda SIEMPRE el último estado.
 * Si llegan varios cambios seguidos mientras se escribe, se escribe una sola vez
 * más con el más reciente (que incluye a los anteriores). Si una escritura falla,
 * se reintenta.
 *
 * `enqueue` devuelve si ESE cambio quedó realmente en el disco: `true` cuando se
 * escribió él o un estado más nuevo que lo incluye; `false` si todo falló.
 */
export function createWriteQueue(write: (value: string) => Promise<void>) {
  let pending: Pending | null = null;
  // `pending` puede cambiar mientras se espera la escritura (otra llamada a enqueue).
  const newer = () => pending as Pending | null;
  let running: Promise<void> | null = null;

  const run = async () => {
    while (pending !== null) {
      const { value, waiters } = pending;
      pending = null;
      let ok = false;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await write(value);
          ok = true;
          break;
        } catch (error) {
          const next = newer();
          if (next !== null) {
            // Ya hay un estado más nuevo (incluye este cambio): esperan su resultado.
            next.waiters.unshift(...waiters);
            waiters.length = 0;
            break;
          }
          if (attempt === MAX_ATTEMPTS) {
            console.warn('[RODEXA] No se pudo guardar en el teléfono tras varios intentos.', error);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
      waiters.forEach((resolve) => resolve(ok));
    }
    running = null;
  };

  return {
    enqueue(value: string): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        // Un estado más nuevo reemplaza al que esperaba: sus waiters pasan al nuevo.
        pending = { value, waiters: [...(pending?.waiters ?? []), resolve] };
        if (!running) running = run();
      });
    },
    /** Espera a que termine lo pendiente. */
    flush(): Promise<void> {
      return running ?? Promise.resolve();
    },
  };
}
