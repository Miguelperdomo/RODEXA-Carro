import { needsEnergyConfirmation } from '@/features/cars/capabilities';
import type { CarProfile, ComponentSummary, DocumentSummary } from '@/features/cars/types';
import { DOCUMENT_DEFINITIONS } from '@/features/documents/catalog';

import type { Recommendation } from './types';

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

type Input = {
  profile: CarProfile;
  documents: DocumentSummary[];
  components: ComponentSummary[];
  /** El aceite de motor aplica con certeza y no tiene intervalo (Fase B). */
  needsOilSetup: boolean;
};

/**
 * "RODEXA Carro recomienda": TODO lo que el usuario debería atender, en orden de
 * importancia. Usa los estados centrales (documentos D, mantenimiento B); nada se
 * inventa y nunca queda vacío si hay algo vencido, próximo o importante sin registrar.
 * 1. Vencido · 2. Próximo a vencer · 3. Importante que falta.
 */
export function buildRecommendations({ profile, documents, components, needsOilSetup }: Input): Recommendation[] {
  const due: Recommendation[] = [];
  const soon: Recommendation[] = [];
  const missing: Recommendation[] = [];

  for (const doc of documents) {
    const tax = DOCUMENT_DEFINITIONS[doc.type].hasTaxFields;
    const action = { label: 'Ver documento', href: { pathname: '/documentos/[key]', params: { key: doc.key } } } as const;
    if (doc.status === 'due') {
      due.push({
        id: `doc-${doc.key}-due`,
        kind: 'document',
        level: 'due',
        text: `${doc.title}: ${lowerFirst(doc.detail)}, según la fecha que registraste. ${
          tax ? 'Si ya lo pagaste, regístralo.' : 'Si ya lo renovaste, actualízalo.'
        }`,
        action,
      });
    } else if (doc.status === 'soon') {
      soon.push({ id: `doc-${doc.key}-soon`, kind: 'document', level: 'soon', text: `${doc.title}: ${lowerFirst(doc.detail)}.`, action });
    }
  }

  for (const c of components) {
    if (!c.enabled) continue;
    if (c.status === 'due') {
      due.push({
        id: `maint-${c.code}-due`,
        kind: 'maintenance',
        level: 'due',
        text: `${c.title}: según tus registros ya corresponde (${lowerFirst(c.detail)}). Si ya lo hiciste, regístralo.`,
        action: { label: 'Registrar mantenimiento', href: { pathname: '/registrar/mantenimiento', params: { tipo: c.code } } },
      });
    } else if (c.status === 'soon') {
      soon.push({
        id: `maint-${c.code}-soon`,
        kind: 'maintenance',
        level: 'soon',
        text: `${c.title}: se acerca según tus registros (${lowerFirst(c.detail)}).`,
        action: { label: 'Ver detalle', href: { pathname: '/mi-carro/componente/[code]', params: { code: c.code } } },
      });
    }
  }

  // Lo importante que falta registrar (para que los avisos puedan funcionar).
  const soat = documents.find((d) => d.type === 'soat');
  if (!soat || soat.status === 'nodata') {
    missing.push({
      id: 'soat-missing',
      kind: 'document',
      level: 'nodata',
      text: 'Agrega la fecha de vencimiento de tu SOAT para recibir un aviso antes de que venza.',
      action: { label: 'Agregar SOAT', href: { pathname: '/registrar/documento', params: { tipo: 'soat' } } },
    });
  }
  const rtm = documents.find((d) => d.type === 'rtm');
  if (!rtm || rtm.status === 'nodata') {
    missing.push({
      id: 'rtm-missing',
      kind: 'document',
      level: 'nodata',
      text: 'Registra la fecha de tu tecnomecánica, o marca "Aún no aplica" si tu carro todavía no la requiere.',
      action: { label: 'Registrar tecnomecánica', href: { pathname: '/registrar/documento', params: { tipo: 'rtm' } } },
    });
  }
  if (needsEnergyConfirmation(profile)) {
    missing.push({
      id: 'energy-missing',
      kind: 'setup',
      level: 'nodata',
      text: 'Confirma el combustible o la energía de tu carro para ver solo lo que le aplica.',
      action: { label: 'Confirmar ahora', href: '/mi-carro/editar' },
    });
  }
  if (needsOilSetup) {
    missing.push({
      id: 'oil-setup',
      kind: 'setup',
      level: 'nodata',
      text: 'Configura cada cuántos km cambias el aceite para que RODEXA Carro pueda avisarte.',
      action: { label: 'Configurar aceite', href: { pathname: '/mi-carro/configurar/[code]', params: { code: 'oil' } } },
    });
  }

  return [...due, ...soon, ...missing];
}
