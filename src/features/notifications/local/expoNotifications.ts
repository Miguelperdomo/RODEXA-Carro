/**
 * Punto ÚNICO de acceso a expo-notifications, solo con lo LOCAL.
 *
 * Por qué no `import * from 'expo-notifications'`: en Expo Go para Android (SDK 53+)
 * el índice de la librería carga el registro de tokens push, que lanza un error a
 * propósito ("push removido de Expo Go") y tumba la app. RODEXA solo usa
 * notificaciones LOCALES, cuyos módulos no dependen del push, así que se importan
 * directamente. Con un development build se puede volver a importar del índice
 * cambiando solo este archivo.
 */
export { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export type { NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export {
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
export type { NotificationResponse } from 'expo-notifications/build/Notifications.types';
