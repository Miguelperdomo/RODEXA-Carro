import { findCity } from '@/features/catalogs/repository';
import {
  EMPTY_SELECTION,
  selectionToProfile,
  type CarSelection,
} from '@/features/catalogs/selection';
import { OTHER_CITY_ID } from '@/features/catalogs/types';
import { isItemVisible } from '@/features/maintenance/applicability';
import type { MaintenanceItemCode } from '@/features/maintenance/catalog';
import { capabilitiesOf } from '@/features/cars/capabilities';
import type { UsageType } from '@/features/cars/types';
import { validateProfile } from '@/features/cars/validation';
import { creditDueDayPassed, validateCredit } from '@/features/credit/credit';
import type { OnboardingCredit, OnboardingData, OnboardingMaintenance } from '@/features/session/types';
import type { IconName } from '@/shared/ui';
import { toISODate } from '@/shared/utils/date';
import { formatKm } from '@/shared/utils/format';

/** Pasos del primer ingreso, por nombre. */
export type StepKey = 'about' | 'car' | 'usage' | 'odometer' | 'maintenance' | 'documents' | 'credit';

export type RecentOption = 'oil' | 'alignment' | 'brakes' | 'tires' | 'battery' | 'other';
export type TireChoice = 'front' | 'rear' | 'both';

export const RECENT_OPTIONS: { value: RecentOption; label: string; icon: IconName }[] = [
  { value: 'oil', label: 'Aceite', icon: 'oil' },
  { value: 'alignment', label: 'Alineación y balanceo', icon: 'alignment' },
  { value: 'brakes', label: 'Frenos', icon: 'brakes' },
  { value: 'tires', label: 'Llantas', icon: 'tire' },
  { value: 'battery', label: 'Batería', icon: 'battery' },
  { value: 'other', label: 'Otro', icon: 'more' },
];

export type RecentEntry = {
  date: Date;
  km: number | null;
  /** "No sé el kilometraje": se guarda como desconocido (null), nunca como el km actual. */
  kmUnknown: boolean;
  cost: number | null;
  tires: TireChoice | null;
  description: string;
};

export type OnboardingForm = {
  name: string;
  /** Id del catálogo de ciudades (nunca texto libre). */
  cityId: string | null;
  car: CarSelection;
  plate: string;
  /** Ciudad donde está matriculada la placa (código DANE). */
  plateCityId: string | null;
  usageType: UsageType | null;
  km: number | null;
  recent: Partial<Record<RecentOption, RecentEntry>>;
  soatExpiresAt: Date | null;
  rtmExpiresAt: Date | null;
  /** "¿Tu carro está a crédito?" (null = no respondió: se puede saltar). */
  creditHas: boolean | null;
  creditAmount: number | null;
  creditTotal: number | null;
  creditPaid: number | null;
  creditDay: number | null;
  /** Solo si el día de pago de este mes ya pasó. */
  creditPaidThisMonth: boolean | null;
};

export const EMPTY_FORM: OnboardingForm = {
  name: '',
  cityId: null,
  car: EMPTY_SELECTION,
  plate: '',
  plateCityId: null,
  usageType: null,
  km: null,
  recent: {},
  soatExpiresAt: null,
  rtmExpiresAt: null,
  creditHas: null,
  creditAmount: null,
  creditTotal: null,
  creditPaid: null,
  creditDay: null,
  creditPaidThisMonth: null,
};

export type StepErrors = Record<string, string | undefined>;

/** Errores del paso actual; vacío = se puede continuar. */
export function validateStep(step: StepKey, form: OnboardingForm): StepErrors {
  switch (step) {
    case 'about':
      return { name: form.name.trim() === '' ? 'Escribe tu nombre.' : undefined };
    case 'car':
      return { ...validateProfile(form.car, form.plate) };
    case 'usage':
      return { usageType: form.usageType === null ? 'Elige una opción.' : undefined };
    case 'odometer':
      return {
        km: form.km === null || form.km <= 0 ? 'Escribe el kilometraje que marca tu carro.' : undefined,
      };
    case 'maintenance': {
      const errors: StepErrors = {};
      for (const [option, entry] of visibleRecent(form)) {
        if (!entry.kmUnknown && entry.km === null) {
          errors[`${option}.km`] = 'Escribe el kilometraje o marca “No sé el kilometraje”.';
        } else if (!entry.kmUnknown && entry.km !== null && form.km !== null && entry.km > form.km) {
          errors[`${option}.km`] = `No puede ser mayor a lo que marca hoy (${formatKm(form.km)}).`;
        }
        if (option === 'tires' && entry.tires === null) {
          errors['tires.tires'] = 'Elige qué llanta cambiaste.';
        }
        if (option === 'other' && entry.description.trim() === '') {
          errors['other.description'] = 'Describe qué se hizo.';
        }
      }
      return errors;
    }
    case 'credit': {
      if (form.creditHas !== true) return {};
      const e = validateCredit({
        amountCop: form.creditAmount,
        totalInstallments: form.creditTotal,
        paidBefore: form.creditPaid,
        dayOfMonth: form.creditDay,
      });
      const askMonth = form.creditDay !== null && e.day === undefined && creditDueDayPassed(form.creditDay, new Date());
      return {
        creditAmount: e.amount,
        creditTotal: e.total,
        creditPaid: e.paid,
        creditDay: e.day,
        creditPaidThisMonth: askMonth && form.creditPaidThisMonth === null ? 'Elige una opción.' : undefined,
      };
    }
    default:
      return {};
  }
}

/** El crédito respondido, listo para crearse al terminar el registro (o nada). */
export function onboardingCreditOf(form: OnboardingForm, today: Date): OnboardingCredit | undefined {
  if (form.creditHas !== true || form.creditAmount === null || form.creditTotal === null || form.creditDay === null) return undefined;
  return {
    amountCop: form.creditAmount,
    totalInstallments: form.creditTotal,
    paidBefore: form.creditPaid ?? 0,
    dayOfMonth: form.creditDay,
    paidThisMonth: creditDueDayPassed(form.creditDay, today) ? form.creditPaidThisMonth : null,
  };
}

const OPTION_CODES: Record<Exclude<RecentOption, 'tires'>, MaintenanceItemCode> = {
  oil: 'oil',
  alignment: 'wheel_alignment',
  brakes: 'brake_check',
  battery: 'battery',
  other: 'other',
};

/**
 * Opciones de "mantenimiento reciente" que tienen sentido para el vehículo elegido
 * (p. ej. un eléctrico no ve "Aceite"). Usa la misma regla que el catálogo.
 */
export function recentOptionsFor(car: CarSelection): typeof RECENT_OPTIONS {
  const caps = capabilitiesOf({ energySource: car.energySource ?? undefined });
  return RECENT_OPTIONS.filter((option) =>
    option.value === 'tires' ? isItemVisible('tire_front', caps) : isItemVisible(OPTION_CODES[option.value], caps),
  );
}

/** Lo marcado que sigue aplicando (si el usuario cambió la energía después, lo demás se ignora). */
function visibleRecent(form: OnboardingForm): [RecentOption, RecentEntry][] {
  const allowed = recentOptionsFor(form.car).map((o) => o.value);
  return (Object.entries(form.recent) as [RecentOption, RecentEntry][]).filter(([option]) => allowed.includes(option));
}

const TIRE_CODES: Record<TireChoice, MaintenanceItemCode[]> = {
  front: ['tire_front'],
  rear: ['tire_rear'],
  both: ['tire_front', 'tire_rear'],
};

/** Convierte el formulario en los datos del primer ingreso. */
export function toOnboardingData(form: OnboardingForm, today: Date): OnboardingData {
  const maintenance: OnboardingMaintenance[] = visibleRecent(form).flatMap(([option, entry]) => {
    const codes =
      option === 'tires' ? TIRE_CODES[entry.tires ?? 'rear'] : [OPTION_CODES[option]];
    return codes.map((code) => ({
      code,
      date: toISODate(entry.date),
      km: entry.kmUnknown ? null : entry.km,
      costCop: entry.cost,
      description: option === 'other' ? entry.description.trim() : undefined,
    }));
  });

  const city = findCity(form.cityId);
  const credit = onboardingCreditOf(form, today);

  return {
    user: {
      name: form.name.trim(),
      cityId: form.cityId ?? undefined,
      city: form.cityId === OTHER_CITY_ID ? 'Otro municipio' : (city?.name ?? ''),
    },
    profile: {
      id: 'car-1',
      ...selectionToProfile(form.car),
      plate: form.plate || undefined,
      plateCityId: form.plate && form.plateCityId ? form.plateCityId : undefined,
      usageType: form.usageType ?? undefined,
    },
    km: form.km ?? 0,
    maintenance,
    documents: {
      soatExpiresAt: form.soatExpiresAt ? toISODate(form.soatExpiresAt) : undefined,
      rtmExpiresAt: form.rtmExpiresAt ? toISODate(form.rtmExpiresAt) : undefined,
    },
    completedAt: toISODate(today),
    ...(credit ? { credit } : {}),
  };
}
