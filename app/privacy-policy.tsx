import {LegalDocumentScreen} from '../features/legal/LegalDocumentScreen';
import {privacyPolicy} from '../features/legal/legal-documents';
import {MainFonts} from '../features/navigation/MainFonts';

export default function PrivacyPolicy() {
  return <MainFonts><LegalDocumentScreen document={privacyPolicy} /></MainFonts>;
}
