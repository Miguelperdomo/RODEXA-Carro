import type { Href } from 'expo-router';

import { energyRecordKinds } from '@/features/cars/energy';
import { energyActionTitle } from '@/features/energy/form';
import { ENERGY_META } from '@/features/energy/meta';
import type { AppData } from '@/features/session/types';
import type { IconName } from '@/shared/ui';

export type GettingStartedStep = {
  key: 'energy' | 'oil' | 'soat' | 'compliance';
  icon: IconName;
  title: string;
  description: string;
  href: Href;
};

/**
 * Primeros pasos en Inicio: solo los que FALTAN y aplican a este carro.
 * - Energía: según lo que el carro puede registrar (tanqueo, GNC o carga eléctrica).
 * - Aceite: solo si el carro tiene aceite de motor (un eléctrico no lo ve).
 * - SOAT: no aparece si ya se registró (también el del primer ingreso).
 */
/** ¿Se ve la guía "Primeros pasos" en Inicio? (activada y con pasos pendientes). */
export function isGettingStartedOpen(showGettingStarted: boolean, data: AppData, hideEnergy = false, complianceDone = true): boolean {
  return showGettingStarted && gettingStartedSteps(data, hideEnergy, complianceDone).length > 0;
}

/** `hideEnergy`: Tranqui con "No lo llevo" (no se pide registrar la primera carga). */
export function gettingStartedSteps(data: AppData, hideEnergy = false, complianceDone = true): GettingStartedStep[] {
  const steps: GettingStartedStep[] = [];
  const kinds = energyRecordKinds(data.profile);
  const hasEnergy = data.history.some((e) => e.kind === 'fuel' || e.kind === 'cng' || e.kind === 'charge');

  if (!hasEnergy && !(hideEnergy && kinds.length > 0)) {
    if (kinds.length === 0) {
      steps.push({
        key: 'energy',
        icon: 'info',
        title: 'Confirma la energía de tu carro',
        description: 'Gasolina, diésel, GNC, eléctrico o híbrido: así RODEXA te muestra lo que aplica.',
        href: '/mi-carro/editar',
      });
    } else if (kinds.length === 1) {
      const kind = kinds[0];
      const title = energyActionTitle(kind, data.profile.energySource);
      // Solo la primera letra en minúscula: "carga de GNC", no "carga de gnc".
      const action = title.charAt(0).toLowerCase() + title.slice(1);
      steps.push({
        key: 'energy',
        icon: ENERGY_META[kind].icon,
        title: `Registra tu primera ${action}`,
        description: 'Escribe lo que pagaste y el precio: RODEXA calcula la cantidad.',
        href: { pathname: '/registrar/energia', params: { tipo: kind } },
      });
    } else {
      steps.push({
        key: 'energy',
        icon: ENERGY_META[kinds[0]].icon,
        title: 'Registra tu primera carga de energía',
        description: kinds.map((k) => energyActionTitle(k, data.profile.energySource)).join(' o '),
        href: '/nuevo',
      });
    }
  }

  const oil = data.components.find((c) => c.code === 'oil');
  if (oil && (!oil.enabled || !oil.interval)) {
    steps.push({
      key: 'oil',
      icon: 'oil',
      title: 'Configura el aceite',
      description: 'Cada cuántos km o meses lo cambias y cuándo fue el último cambio.',
      href: { pathname: '/mi-carro/configurar/[code]', params: { code: 'oil' } },
    });
  }

  const soat = data.documents.find((d) => d.type === 'soat');
  if (!soat || soat.records === 0) {
    steps.push({
      key: 'soat',
      icon: 'insurance',
      title: 'Agrega tu SOAT',
      description: 'Con la fecha de vencimiento te avisamos antes de que se venza.',
      // Sin ?tipo= (eso abre una renovación); el SOAT es el tipo por defecto.
      href: '/registrar/documento',
    });
  }
  // "¿Estoy en regla?": hasta que marque lo que lleva en el carro.
  if (!complianceDone) {
    steps.push({
      key: 'compliance',
      icon: 'statusOk',
      title: '¿Estás en regla?',
      description: 'Revisa tus documentos y lo que debe llevar el carro.',
      href: '/en-regla',
    });
  }
  return steps;
}
