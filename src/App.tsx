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
import { sendSubmissionViaResend } from './services/resendService';
import { sounds } from './utils/audio';
import { Flame, Clock, CheckCircle2, AlertCircle, RotateCcw, X } from 'lucide-react';

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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [fullFormErrors, setFullFormErrors] = useState<Record<string, string>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

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

    // Automated dispatch via Resend (server-side, zero login required)
    sendSubmissionViaResend(newRecord, 'sapaser@gmail.com')
      .then((res) => {
        console.log('[Resend] Notificación enviada con éxito:', res.messageId);
        setSyncStatus((prev) => ({ ...prev, emailSent: true }));
      })
      .catch((err) => {
        console.info('[Resend] Envío automático:', err.message);
      });

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

      // 2. Send email copy to sapaser@gmail.com (test)
      try {
        const sendRes = await sendCamporeeNotificationEmail(
          googleAccessToken,
          newRecord,
          googleUser?.email || undefined,
          {
            primaryTo: 'sapaser@gmail.com',
            ccOfficial: false,
            isTestMode: true,
          }
        );
        emailOk = true;
        console.log('Correo de preinscripción enviado a sapaser@gmail.com:', sendRes.messageId);
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
      const sendRes = await sendCamporeeNotificationEmail(
        googleAccessToken,
        activeSubmission,
        googleUser?.email || undefined,
        {
          primaryTo: 'sapaser@gmail.com',
          ccOfficial: false,
          isTestMode: true,
        }
      );
      setSyncStatus({ googleSynced: true, emailSent: true });
      sounds.playSuccess();
      console.log('Sincronización manual completada con éxito. Message ID:', sendRes.messageId);
    } catch (err: any) {
      console.error('Error al sincronizar:', err);
      sounds.playError();
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync all submissions to Google Sheets from the drawer
  const handleSyncAllToSheet = async () => {
    if (!googleAccessToken) {
      return;
    }

    if (submissions.length === 0) return;

    setIsSyncing(true);
    try {
      let finalUrl = '';
      for (const sub of submissions) {
        finalUrl = await appendSubmissionToSheet(googleAccessToken, sub);
      }
      setSheetUrl(finalUrl);
      localStorage.setItem('amap_camporee_sheet_url_2027', finalUrl);
      sounds.playSuccess();
      showToast('¡Todos los clubes fueron sincronizados con éxito en Google Sheets!', 'success');
    } catch (err: any) {
      showToast(`Error durante la sincronización: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setIsResetConfirmOpen(true);
  };

  const confirmResetAction = () => {
    setFormData(INITIAL_FORM_DATA);
    try {
      localStorage.removeItem('amap_camporee_draft_2027');
    } catch {
      // ignore
    }
    setIsResetConfirmOpen(false);
    sounds.playClick();
    showToast('El formulario ha sido restablecido', 'info');
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

      {/* Main Container (Responsive mobile padding) */}
      <main className="flex-1 py-3.5 sm:py-8 px-3 sm:px-6 max-w-6xl mx-auto w-full">
        {/* Deadline & Official Camporee Banner */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-sky-950/40 to-slate-900 p-3 sm:p-4 border border-amber-500/30 text-xs sm:text-sm shadow-lg shadow-amber-500/5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>VII Camporee AMAP 2027</span>
            </div>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="text-sky-300 font-extrabold uppercase tracking-wide text-[11px] sm:text-xs">
              «Preparados Para Su Regreso»
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800 self-start sm:self-auto text-[11px] sm:text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Cierre: <strong className="text-amber-300 font-bold">30 de octubre de 2026</strong>
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

      {/* In-app Toast Feedback Banner (Mobile & Desktop) */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto shadow-2xl transition-all animate-bounce">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-500/20'
                : 'bg-slate-900/90 border-amber-500/40 text-amber-200 shadow-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {toast.type === 'info' && <span className="text-amber-400">ℹ️</span>}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-amber-400 font-bold">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">¿Reiniciar formulario?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción borrará los campos completados del borrador actual para que puedas iniciar desde cero.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 min-h-[38px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmResetAction}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors min-h-[38px]"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/85 backdrop-blur-md py-4 sm:py-6 px-3 sm:px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span>VII Camporee AMAP 2027 • Asociación Metropolitana de Panamá</span>
          </div>
          <p className="text-[10px] sm:text-xs">© 2026-2027 Ministerio Juvenil AMAP • Formulario Oficial</p>
        </div>
      </footer>
    </div>
  );
}
