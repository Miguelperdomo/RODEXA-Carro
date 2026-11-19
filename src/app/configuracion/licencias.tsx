import { LegalDocumentView } from '@/features/legal/components/LegalDocumentView';
import { THIRD_PARTY_LICENSES } from '@/features/legal/documents';

/** Licencias de terceros. */
export default function ThirdPartyLicensesScreen() {
  return <LegalDocumentView document={THIRD_PARTY_LICENSES} />;
}
