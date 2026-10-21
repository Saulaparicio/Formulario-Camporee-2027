export interface ClubFormData {
  clubName: string;          // Nombre oficial del club
  foundationYear: string;    // Año de fundación del club
  clubLogo: string | null;   // Data URL o preview del logo del club
  clubLogoName?: string;     // Nombre del archivo de logo
  church: string;            // Iglesia / congregación
  amapZone: string;          // Zona AMAP (1, 2, 3, 4)
  districtPastor: string;    // Nombre del pastor distrital
  directorName: string;      // Nombre completo del director o directora
  contactPhone: string;      // Teléfono de contacto
  contactEmail: string;      // Correo electrónico
  paymentProof: string | null; // Data URL o preview del comprobante de pago
  paymentProofName?: string; // Nombre del archivo de comprobante
  notes?: string;            // Notas o comentarios adicionales (opcional)
}

export interface SubmissionRecord extends ClubFormData {
  id: string;
  folio: string;
  createdAt: string;
  status: 'completado' | 'pendiente_revision';
}

export interface FormStepConfig {
  id: keyof ClubFormData;
  section: 'A' | 'B' | 'D';
  sectionTitle: string;
  questionTitle: string;
  conversationalPrompt: string;
  helperText?: string;
  placeholder?: string;
  type: 'text' | 'select' | 'file' | 'phone' | 'email';
  options?: { value: string; label: string; description?: string }[];
  required: boolean;
  validationFn?: (val: any) => string | null;
}
