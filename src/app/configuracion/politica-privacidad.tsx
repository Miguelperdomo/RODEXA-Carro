import { LegalDocumentView } from '@/features/legal/components/LegalDocumentView';
import { PRIVACY_POLICY } from '@/features/legal/documents';

/** Política de privacidad (también desde Privacidad y datos). */
export default function PrivacyPolicyScreen() {
  return <LegalDocumentView document={PRIVACY_POLICY} />;
}
