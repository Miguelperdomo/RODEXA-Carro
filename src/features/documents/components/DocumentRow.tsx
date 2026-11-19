import { router } from 'expo-router';

import type { DocumentSummary } from '@/features/cars/types';
import { StatusRow } from '@/shared/ui';

import { DOCUMENT_DEFINITIONS } from '../catalog';
import { documentStatusText } from '../presentation';

/**
 * Fila de un documento (Mi carro, Documentos, Configuración). Registrado → su detalle;
 * sin registrar → el formulario para agregarlo.
 */
export function DocumentRow({ doc }: { doc: DocumentSummary }) {
  return (
    <StatusRow
      status={doc.status}
      title={doc.title}
      icon={DOCUMENT_DEFINITIONS[doc.type].icon}
      statusLabel={documentStatusText(doc)}
      detail={doc.detail}
      onPress={() =>
        doc.records > 0
          ? router.push({ pathname: '/documentos/[key]', params: { key: doc.key } })
          : router.push({ pathname: '/registrar/documento', params: { tipo: doc.type } })
      }
    />
  );
}
