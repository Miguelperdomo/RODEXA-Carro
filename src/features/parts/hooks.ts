import { useMemo } from 'react';

import { useAppData } from '@/features/session/SessionProvider';

import { getCompatibleProducts, getPartCategories, carRefFromProfile } from './repository';
import type { CarRef, PartTypeCode } from './types';

/**
 * El carro seleccionado para Repuestos. Hoy es el carro registrado; con varios
 * carros (RODEXA Pro) aquí se leerá el carro elegido y todo lo demás sigue igual.
 */
export function useSelectedCar(): CarRef | null {
  const { profile } = useAppData();
  return useMemo(() => carRefFromProfile(profile), [profile]);
}

export function usePartCategories(car: CarRef | null) {
  const { profile } = useAppData();
  return useMemo(() => getPartCategories(car, profile), [car, profile]);
}

export const useCompatibleProducts = (car: CarRef | null, partType: PartTypeCode) =>
  useMemo(() => getCompatibleProducts(car, partType), [car, partType]);
