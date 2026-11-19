import { LegalDocumentView } from '@/features/legal/components/LegalDocumentView';
import { TERMS } from '@/features/legal/documents';

/** Términos y condiciones. */
export default function TermsScreen() {
  return <LegalDocumentView document={TERMS} />;
}
