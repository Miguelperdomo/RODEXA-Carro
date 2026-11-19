import { findCity } from '@/features/catalogs/repository';
import { OTHER_CITY_ID } from '@/features/catalogs/types';

/**
 * Lo que va DEBAJO de la placa en Inicio (en vez de "COLOMBIA"): la ciudad donde está
 * matriculada. Si no se registró, la ciudad del perfil. Sin ninguna, no se muestra nada
 * (nunca se inventa). En MAYÚSCULAS, como en la placa.
 */
export function plateCityLabel(
  plateCityId: string | undefined,
  user: { cityId?: string; city?: string },
): string | undefined {
  const name =
    findCity(plateCityId)?.name ??
    findCity(user.cityId)?.name ??
    (user.cityId !== OTHER_CITY_ID && user.city?.trim() ? user.city.trim() : undefined);
  return name?.toUpperCase();
}

/**
 * Colores de la placa en Colombia según el servicio (Resolución 1690 de 2015 del Ministerio de
 * Transporte): PARTICULAR fondo amarillo y letras negras; SERVICIO PÚBLICO fondo blanco y
 * letras negras. Sin dato se toma particular.
 */
export const PRIVATE_PLATE_COLORS = { background: '#F5C518', text: '#111111', border: '#111111' };
export const PUBLIC_PLATE_COLORS = { background: '#FFFFFF', text: '#111111', border: '#111111' };

export function plateColors(serviceType: 'private' | 'public' | undefined) {
  return serviceType === 'public' ? PUBLIC_PLATE_COLORS : PRIVATE_PLATE_COLORS;
}

/** "ABC123" → "ABC - 123". */
export const formatPlate = (plate: string) => (/^[A-Z]{3}\d{3}$/.test(plate) ? `${plate.slice(0, 3)} - ${plate.slice(3)}` : plate);
