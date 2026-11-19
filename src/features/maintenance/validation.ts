import type { MaintenanceItemCode } from './catalog';

type MaintenanceInput = {
  types: MaintenanceItemCode[];
  otherDescription: string;
  km: number | null;
  /** "No sé el kilometraje": válido, no genera error. */
  kmUnknown?: boolean;
};

export type MaintenanceErrors = {
  types?: string;
  otherDescription?: string;
  km?: string;
};

export function validateMaintenance({
  types,
  otherDescription,
  km,
  kmUnknown = false,
}: MaintenanceInput): MaintenanceErrors {
  const errors: MaintenanceErrors = {};
  if (types.length === 0) {
    errors.types = 'Elige al menos un tipo de mantenimiento.';
  }
  if (types.includes('other') && otherDescription.trim() === '') {
    errors.otherDescription = 'Describe qué se hizo.';
  }
  if (!kmUnknown && (km === null || km <= 0)) {
    errors.km = 'Ingresa el kilometraje en que se hizo.';
  }
  return errors;
}
