import { FormStepConfig } from '../types/form';

export const CURRENT_YEAR = 2026;
export const FOUNDATION_YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => {
  const y = String(CURRENT_YEAR - i);
  return { value: y, label: y };
});

export const AMAP_ZONES = [
  { value: '1', label: 'Zona 1', description: 'Distritos y congregaciones Zona 1 AMAP' },
  { value: '2', label: 'Zona 2', description: 'Distritos y congregaciones Zona 2 AMAP' },
  { value: '3', label: 'Zona 3', description: 'Distritos y congregaciones Zona 3 AMAP' },
  { value: '4', label: 'Zona 4', description: 'Distritos y congregaciones Zona 4 AMAP' },
];

export const FORM_STEPS: FormStepConfig[] = [
  {
    id: 'clubName',
    section: 'A',
    sectionTitle: 'Sección A. Datos del club',
    questionTitle: 'Nombre oficial del club',
    conversationalPrompt: '¡Hola Conquistador! ⛺ Comencemos con el nombre con el que marchan: ¿Cuál es el nombre oficial de tu club?',
    helperText: 'Ingresa el nombre registrado del club (sin abreviaturas confusas).',
    placeholder: 'Ej: Club de Conquistadores Orión',
    type: 'text',
    required: true,
    validationFn: (val) => (!val || val.trim().length < 2 ? 'Por favor escribe el nombre oficial de tu club.' : null),
  },
  {
    id: 'foundationYear',
    section: 'A',
    sectionTitle: 'Sección A. Datos del club',
    questionTitle: 'Año de fundación del club',
    conversationalPrompt: '¡Gran legado! ¿En qué año se fundó el club? Cada año de historia cuenta en el campamento.',
    helperText: 'Selecciona el año en que el club inició sus actividades oficiales.',
    placeholder: 'Selecciona el año',
    type: 'select',
    options: FOUNDATION_YEARS,
    required: true,
    validationFn: (val) => (!val ? 'Por favor selecciona el año de fundación del club.' : null),
  },
  {
    id: 'clubLogo',
    section: 'A',
    sectionTitle: 'Sección A. Datos del club',
    questionTitle: 'Logo del club',
    conversationalPrompt: '¡Queremos ver su estandarte! Sube una imagen clara con el logo o emblema de tu club.',
    helperText: 'Archivos PNG, JPG o WEBP recomendados. Tamaño máximo: 5 MB.',
    type: 'file',
    required: true,
    validationFn: (val) => (!val ? 'Es necesario adjuntar el logo o escudo de tu club.' : null),
  },
  {
    id: 'church',
    section: 'A',
    sectionTitle: 'Sección A. Datos del club',
    questionTitle: 'Iglesia / congregación',
    conversationalPrompt: '¿A qué iglesia o congregación adventista pertenece y representa tu club?',
    helperText: 'Indica la iglesia local de procedencia.',
    placeholder: 'Ej: Iglesia Adventista Central, Bethel, Sinaí...',
    type: 'text',
    required: true,
    validationFn: (val) => (!val || val.trim().length < 3 ? 'Por favor indica la iglesia o congregación.' : null),
  },
  {
    id: 'amapZone',
    section: 'A',
    sectionTitle: 'Sección A. Datos del club',
    questionTitle: 'Zona AMAP',
    conversationalPrompt: '¿A cuál de las 4 zonas de la Asociación Metropolitana (AMAP) pertenecen?',
    helperText: 'Selecciona la zona correspondiente a tu distrito.',
    type: 'select',
    options: AMAP_ZONES,
    required: true,
    validationFn: (val) => (!val ? 'Por favor selecciona la Zona AMAP de tu club.' : null),
  },
  {
    id: 'districtPastor',
    section: 'A',
    sectionTitle: 'Sección A. Datos del club',
    questionTitle: 'Nombre del pastor distrital',
    conversationalPrompt: '¿Quién es el pastor distrital que acompaña espiritualmente y respalda a su club?',
    helperText: 'Nombre y apellido del pastor de su distrito eclesiástico.',
    placeholder: 'Ej: Pr. Josué Morales',
    type: 'text',
    required: true,
    validationFn: (val) => (!val || val.trim().length < 3 ? 'Por favor escribe el nombre del pastor distrital.' : null),
  },
  {
    id: 'directorName',
    section: 'B',
    sectionTitle: 'Sección B. Datos del director o directora',
    questionTitle: 'Nombre completo del director o directora',
    conversationalPrompt: '¡Conozcamos a quien lidera el batallón! ¿Cuál es el nombre completo del director o directora?',
    helperText: 'Nombre de la persona responsable ante la coordinación del Camporee.',
    placeholder: 'Ej: Roberto Carlos Sánchez Méndez',
    type: 'text',
    required: true,
    validationFn: (val) => (!val || val.trim().length < 4 ? 'Por favor escribe el nombre completo del director o directora.' : null),
  },
  {
    id: 'contactPhone',
    section: 'B',
    sectionTitle: 'Sección B. Datos del director o directora',
    questionTitle: 'Teléfono de contacto',
    conversationalPrompt: '¿Cuál es su número de teléfono o WhatsApp principal para mantenernos en comunicación directa?',
    helperText: 'Favor ingrese un número de teléfono válido (WhatsApp preferible).',
    placeholder: 'Ej: +506 8899-7711 o número local',
    type: 'phone',
    required: true,
    validationFn: (val) => {
      if (!val || val.trim().length < 6) return 'Ingresa un número de teléfono válido para emergencias y avisos.';
      return null;
    },
  },
  {
    id: 'contactEmail',
    section: 'B',
    sectionTitle: 'Sección B. Datos del director o directora',
    questionTitle: 'Correo electrónico',
    conversationalPrompt: '¿A qué correo electrónico enviamos la confirmación, folletos de acampada y circular oficial?',
    helperText: 'Ejemplo: ejemplo@ejemplo.com',
    placeholder: 'director@club.org',
    type: 'email',
    required: true,
    validationFn: (val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val || !emailRegex.test(val)) return 'Ingresa un correo electrónico con formato válido (ejemplo@correo.com).';
      return null;
    },
  },
  {
    id: 'paymentProof',
    section: 'D',
    sectionTitle: 'Sección D. Documentos y pago',
    questionTitle: 'Comprobante de pago',
    conversationalPrompt: '¡Último paso para apartar su lugar en el Camporee! 🏕️ Adjunta la foto o captura del comprobante de pago.',
    helperText: 'Fotografía legible del comprobante de depósito, transferencia bancaria o recibo de tesorería.',
    type: 'file',
    required: true,
    validationFn: (val) => (!val ? 'Es necesario adjuntar el comprobante de pago para validar la preinscripción.' : null),
  },
];
