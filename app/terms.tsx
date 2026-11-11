import {LegalDocumentScreen} from '../features/legal/LegalDocumentScreen';
import {termsAndConditions} from '../features/legal/legal-documents';
import {MainFonts} from '../features/navigation/MainFonts';

export default function Terms() {
  return <MainFonts><LegalDocumentScreen document={termsAndConditions} /></MainFonts>;
}
