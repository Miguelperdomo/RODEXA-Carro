import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Único punto que toca el almacenamiento físico del teléfono. En Android,
 * AsyncStorage guarda en una base SQLite privada de la app: sobrevive a cerrar
 * la app, reiniciar y apagar el teléfono; se borra al desinstalar o al borrar
 * los datos de la app. Nada de esto sale del dispositivo.
 */
export const keyValueStore = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
  /** Todas las claves guardadas por la app. */
  keys: async () => [...(await AsyncStorage.getAllKeys())],
  removeMany: (keys: string[]) => AsyncStorage.multiRemove(keys),
};

/** Claves de RODEXA. La versión del esquema va DENTRO del valor, no en la clave. */
export const STORAGE_KEYS = {
  user: 'rodexa:user',
  settings: 'rodexa:settings',
  /** Copia intacta de un valor que no se pudo leer (nunca se borra sola). */
  backup: (key: string) => `${key}:backup:${Date.now()}`,
} as const;
