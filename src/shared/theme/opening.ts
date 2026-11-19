import { darkColors } from './colors';

/**
 * Fondo de la apertura, igual al de la pantalla de carga nativa (app.json → expo-splash-screen):
 * blanco en tema claro y oscuro en tema oscuro, para que al abrir no haya ningún destello.
 */
export const OPENING_BACKGROUND = { light: '#FFFFFF', dark: darkColors.background } as const;
