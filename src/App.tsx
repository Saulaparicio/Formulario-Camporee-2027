/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ClubFormData, SubmissionRecord } from './types/form';
import { FORM_STEPS } from './data/formConfig';
import { HeaderNav } from './components/HeaderNav';
import { ConversationalForm } from './components/ConversationalForm';
import { FullFormView } from './components/FullFormView';
import { ReviewModal } from './components/ReviewModal';
import { SuccessView } from './components/SuccessView';
import { SubmissionsDrawer } from './components/SubmissionsDrawer';
import { WorkspaceConfirmDialog } from './components/WorkspaceConfirmDialog';
import { EmailTestModal } from './components/EmailTestModal';
import { initAuth, setAccessToken } from './services/googleAuth';
import { appendSubmissionToSheet, findExistingSpreadsheet } from './services/googleSheets';
import { sendCamporeeNotificationEmail } from './services/gmail';
import { sounds } from './utils/audio';
import { Flame, Clock } from 'lucide-react';

const INITIAL_FORM_DATA: ClubFormData = {
  clubName: '',
  foundationYear: '',
  clubLogo: null,
  clubLogoName: '',
  church: '',
  amapZone: '',
  districtPastor: '',
  directorName: '',
  contactPhone: '',
  contactEmail: '',
  paymentProof: null,
  paymentProofName: '',
  notes: '',
};

const INITIAL_SAMPLE_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: 'sample-sub-1',
    folio: 'AMAP-2027-C1984',
    clubName: 'Club de Conquistadores Orión',
    foundationYear: '2008',
    clubLogo:
      'https://www.jotform.com/uploads/sapaser/form_files/Emblema_del_Club_de_Conquistadores.svg.69e41cba3e5f68.34457135.png',
    clubLogoName: 'emblema_orion.png',
    church: 'Iglesia Adventista Central',
    amapZone: '1',
    districtPastor: 'Pr. Carlos Ramírez',
    directorName: 'Roberto Carlos Mendoza',
    contactPhone: '+506 8877-6655',
    contactEmail: 'director.orion@amapclub.org',
    paymentProof:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    paymentProofName: 'comprobante_banco_nacional.jpg',
    createdAt: '2026-10-15T14:30:00.000Z',
    status: 'completado',
  },
];

export default function App() {
  const [formData, setFormData] = useState<ClubFormData>(() => {
    try {
      const saved = localStorage.getItem('amap_camporee_draft_2027');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_FORM_DATA;
  });

  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('amap_camporee_submissions_2027');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SAMPLE_SUBMISSIONS;
  });

  const [viewMode, setViewMode] = useState<'conversational' | 'full'>('conversational');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEmailTestOpen, setIsEmailTestOpen] = useState(false);
  const [fullFormErrors, setFullFormErrors] = useState<Record<string, string>>({});

  // Google Workspace Authentication and State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('amap_camporee_sheet_url_2027') || null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ googleSynced: boolean; emailSent: boolean }>({
    googleSynced: false,
    emailSent: false,
  });

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        setAccessToken(token);

        // Check if existing sheet exists
        findExistingSpreadsheet(token).then((id) => {
          if (id) {
            const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;
            setSheetUrl(url);
            localStorage.setItem('amap_camporee_sheet_url_2027', url);
          }
        });
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle URL deep link from scanned QR code or shared link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const folioParam = params.get('folio');

    if (folioParam) {
      // First check if it already exists in stored submissions
      const existing = submissions.find((s) => s.folio.toLowerCase() === folioParam.toLowerCase());
      if (existing) {
        setActiveSubmission(existing);
      } else {
        // Build submission record from encoded URL parameters
        const scannedRecord: SubmissionRecord = {
          id: `sub-qr-${folioParam}`,
          folio: folioParam,
          clubName: params.get('club') || 'Club Conquistador',
          foundationYear: params.get('year') || '2026',
          church: params.get('church') || 'Iglesia Adventista',
          amapZone: params.get('zone') || '1',
          districtPastor: params.get('pastor') || 'Pastor Distrital',
          directorName: params.get('director') || 'Director de Club',
          contactPhone: params.get('phone') || '',
          contactEmail: params.get('email') || '',
          clubLogo: null,
          paymentProof: null,
          createdAt: params.get('date') || new Date().toISOString(),
          status: 'completado',
        };
        setActiveSubmission(scannedRecord);
      }
    }
  }, []);

  // Auto-save form draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('amap_camporee_draft_2027', JSON.stringify(formData));
    } catch {
      // ignore
    }
  }, [formData]);

  // Persist submissions list
  useEffect(() => {
    try {
      localStorage.setItem('amap_camporee_submissions_2027', JSON.stringify(submissions));
    } catch {
      // ignore
    }
  }, [submissions]);

  const updateField = (field: keyof ClubFormData, val: any, fileName?: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === 'clubLogo' && fileName !== undefined) {
        updated.clubLogoName = fileName;
      }
      if (field === 'paymentProof' && fileName !== undefined) {
        updated.paymentProofName = fileName;
      }
      return updated;
    });

    if (fullFormErrors[field]) {
      setFullFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    FORM_STEPS.forEach((step) => {
      if (step.validationFn) {
        const err = step.validationFn(formData[step.id]);
        if (err) {
          errors[step.id] = err;
        }
      }
    });

    setFullFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Called when user clicks "Confirmar y Enviar Preinscripción" from the ReviewModal
  const handleReviewConfirmed = () => {
    if (!validateAllFields()) {
      setIsReviewOpen(false);
      setViewMode('full');
      return;
    }

    setIsReviewOpen(false);

    // If user has Google connected, ask explicit confirmation per Workspace safety guidelines
    if (googleAccessToken) {
      setIsConfirmDialogOpen(true);
    } else {
      executeSubmissionRecord(false);
    }
  };

  // Create submission record and optionally sync to Google Sheets & Gmail
  const executeSubmissionRecord = async (syncToGoogle: boolean) => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const folio = `AMAP-2027-C${randomCode}`;

    const newRecord: SubmissionRecord = {
      ...formData,
      id: `sub-${Date.now()}`,
      folio,
      createdAt: new Date().toISOString(),
      status: 'completado',
    };

    setSubmissions((prev) => [newRecord, ...prev]);
    setActiveSubmission(newRecord);
    setIsConfirmDialogOpen(false);

    // Clear form draft
    setFormData(INITIAL_FORM_DATA);
    try {
      localStorage.removeItem('amap_camporee_draft_2027');
    } catch {
      // ignore
    }

    if (syncToGoogle && googleAccessToken) {
      setIsSyncing(true);
      let sheetOk = false;
      let emailOk = false;

      // 1. Append to Google Sheets
      try {
        const createdSheetUrl = await appendSubmissionToSheet(googleAccessToken, newRecord);
        setSheetUrl(createdSheetUrl);
        localStorage.setItem('amap_camporee_sheet_url_2027', createdSheetUrl);
        sheetOk = true;
      } catch (err: any) {
        console.error('Error al guardar en Google Sheets:', err);
      }

      // 2. Send email copy to sapaser@gmail.com (test) and departamentoja@amapanama.org
      try {
        await sendCamporeeNotificationEmail(
          googleAccessToken,
          newRecord,
          googleUser?.email || undefined,
          {
            primaryTo: 'sapaser@gmail.com',
            ccOfficial: true,
            isTestMode: true,
          }
        );
        emailOk = true;
      } catch (err: any) {
        console.error('Error al enviar copia por Gmail:', err);
      }

      setSyncStatus({ googleSynced: sheetOk, emailSent: emailOk });
      setIsSyncing(false);
    } else {
      setSyncStatus({ googleSynced: false, emailSent: false });
    }
  };

  // Sync an active submission manually if connected later
  const handleSyncCurrentSubmission = async () => {
    if (!activeSubmission || !googleAccessToken) return;
    setIsSyncing(true);
    try {
      const createdSheetUrl = await appendSubmissionToSheet(googleAccessToken, activeSubmission);
      setSheetUrl(createdSheetUrl);
      localStorage.setItem('amap_camporee_sheet_url_2027', createdSheetUrl);
      await sendCamporeeNotificationEmail(
        googleAccessToken,
        activeSubmission,
        googleUser?.email || undefined,
        {
          primaryTo: 'sapaser@gmail.com',
          ccOfficial: true,
          isTestMode: true,
        }
      );
      setSyncStatus({ googleSynced: true, emailSent: true });
      sounds.playSuccess();
      alert('¡Sincronizado con éxito en Google Sheets y copia de prueba enviada a sapaser@gmail.com y departamentoja@amapanama.org!');
    } catch (err: any) {
      alert(`Error al sincronizar: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync all submissions to Google Sheets from the drawer
  const handleSyncAllToSheet = async () => {
    if (!googleAccessToken) {
      alert('Por favor conecta tu cuenta de Google arriba primero.');
      return;
    }

    if (submissions.length === 0) return;

    if (
      !confirm(
        `¿Deseas sincronizar los ${submissions.length} registros a la hoja de Google Sheets «Preinscripciones VII Camporee AMAP 2027»?`
      )
    ) {
      return;
    }

    setIsSyncing(true);
    try {
      let finalUrl = '';
      for (const sub of submissions) {
        finalUrl = await appendSubmissionToSheet(googleAccessToken, sub);
      }
      setSheetUrl(finalUrl);
      localStorage.setItem('amap_camporee_sheet_url_2027', finalUrl);
      sounds.playSuccess();
      alert('¡Todos los clubes fueron sincronizados con éxito en Google Sheets!');
    } catch (err: any) {
      alert(`Error durante la sincronización: ${err.message || 'Error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Deseas reiniciar los datos del formulario?')) {
      setFormData(INITIAL_FORM_DATA);
      try {
        localStorage.removeItem('amap_camporee_draft_2027');
      } catch {
        // ignore
      }
      sounds.playClick();
    }
  };

  const handleDeleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    if (activeSubmission?.id === id) {
      setActiveSubmission(null);
    }
    sounds.playClick();
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Background Image: Panama City sunrise framed by rainforest */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/aistudio/Jungle_Framing_a_Sunlit_Future_City_f007bbaf.png')`,
        }}
      />
      {/* Cinematic dark tint with subtle blur for maximum contrast and legibility */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/92 via-slate-950/80 to-slate-950/95 backdrop-blur-[1.5px]" />

      {/* Camporee Header with Google Workspace Integration */}
      <HeaderNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSubmissions={() => setIsDrawerOpen(true)}
        submissionsCount={submissions.length}
        googleUser={googleUser}
        googleAccessToken={googleAccessToken}
        onGoogleAuthSuccess={(user, token) => {
          setGoogleUser(user);
          setGoogleAccessToken(token);
          setAccessToken(token);
        }}
        onGoogleAuthClear={() => {
          setGoogleUser(null);
          setGoogleAccessToken(null);
          setAccessToken(null);
        }}
        sheetUrl={sheetUrl}
        onOpenEmailTest={() => setIsEmailTestOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {/* Deadline & Official Camporee Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-sky-950/40 to-slate-900 p-4 border border-amber-500/30 text-xs sm:text-sm shadow-lg shadow-amber-500/5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>VII Camporee AMAP 2027</span>
            </div>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="text-sky-300 font-extrabold uppercase tracking-wide">
              «Preparados Para Su Regreso»
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              Cierre de preinscripción:{' '}
              <strong className="text-amber-300 font-bold">30 de octubre de 2026</strong>
            </span>
          </div>
        </div>

        {/* View Switch */}
        {activeSubmission ? (
          <SuccessView
            submission={activeSubmission}
            onNewRegistration={() => setActiveSubmission(null)}
            onViewAllSubmissions={() => setIsDrawerOpen(true)}
            sheetUrl={sheetUrl}
            googleSynced={syncStatus.googleSynced}
            emailSent={syncStatus.emailSent}
            onSyncGoogleNow={googleAccessToken ? handleSyncCurrentSubmission : undefined}
            isSyncingGoogle={isSyncing}
            onOpenEmailTest={() => setIsEmailTestOpen(true)}
          />
        ) : viewMode === 'conversational' ? (
          <ConversationalForm
            formData={formData}
            updateField={updateField}
            onComplete={() => setIsReviewOpen(true)}
            onOpenReview={() => setIsReviewOpen(true)}
            onReset={handleReset}
          />
        ) : (
          <FullFormView
            formData={formData}
            updateField={updateField}
            onSubmit={() => {
              if (validateAllFields()) {
                setIsReviewOpen(true);
              }
            }}
            errors={fullFormErrors}
          />
        )}
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        formData={formData}
        onEditField={(_index) => {
          setIsReviewOpen(false);
          setViewMode('conversational');
        }}
        onConfirmSubmit={handleReviewConfirmed}
        googleConnected={!!googleAccessToken}
        userEmail={googleUser?.email || undefined}
      />

      {/* Explicit Workspace Confirmation Dialog */}
      <WorkspaceConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => executeSubmissionRecord(true)}
        onSkipGoogle={() => executeSubmissionRecord(false)}
        formData={formData}
        userEmail={googleUser?.email || undefined}
        isProcessing={isSyncing}
      />

      {/* Submissions Admin Drawer */}
      <SubmissionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        submissions={submissions}
        onDeleteSubmission={handleDeleteSubmission}
        onSelectSubmission={(record) => {
          setActiveSubmission(record);
        }}
        sheetUrl={sheetUrl}
        onSyncAllToSheet={googleAccessToken ? handleSyncAllToSheet : undefined}
        isSyncingAll={isSyncing}
      />

      {/* Direct Email Test Modal (sapaser@gmail.com) */}
      <EmailTestModal
        isOpen={isEmailTestOpen}
        onClose={() => setIsEmailTestOpen(false)}
        googleUser={googleUser}
        googleAccessToken={googleAccessToken}
        onGoogleAuthSuccess={(user, token) => {
          setGoogleUser(user);
          setGoogleAccessToken(token);
          setAccessToken(token);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/85 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            <span>VII Camporee AMAP 2027 • Asociación Metropolitana de Panamá</span>
          </div>
          <p>© 2026-2027 Ministerio Juvenil AMAP • Formulario Oficial</p>
        </div>
      </footer>
    </div>
  );
}
