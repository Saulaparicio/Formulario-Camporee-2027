/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ClubFormData, SubmissionRecord } from './types/form';
import { FORM_STEPS } from './data/formConfig';
import { HeaderNav } from './components/HeaderNav';
import { ConversationalForm } from './components/ConversationalForm';
import { FullFormView } from './components/FullFormView';
import { ReviewModal } from './components/ReviewModal';
import { SuccessView } from './components/SuccessView';
import { SubmissionsDrawer } from './components/SubmissionsDrawer';
import { fetchServerSubmissions, submitRegistration } from './services/submissionsService';
import { sounds } from './utils/audio';
import { CheckCircle2, AlertCircle, RotateCcw, X } from 'lucide-react';

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
    return [];
  });

  const [viewMode, setViewMode] = useState<'conversational' | 'full'>('conversational');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [fullFormErrors, setFullFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

  // Load central submissions from server on mount
  useEffect(() => {
    fetchServerSubmissions()
      .then((serverList) => {
        if (serverList && serverList.length > 0) {
          setSubmissions((prev) => {
            const combinedMap = new Map<string, SubmissionRecord>();
            // Add server submissions
            serverList.forEach((s) => combinedMap.set(s.folio, s));
            // Add any local ones not yet synced
            prev.forEach((s) => {
              if (!combinedMap.has(s.folio)) {
                combinedMap.set(s.folio, s);
              }
            });
            return Array.from(combinedMap.values());
          });
        }
      })
      .catch((err) => {
        console.warn('Carga de preinscripciones del servidor:', err);
      });
  }, []);

  // Handle URL deep link from scanned QR code or shared link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const folioParam = params.get('folio');

    if (folioParam) {
      const existing = submissions.find((s) => s.folio.toLowerCase() === folioParam.toLowerCase());
      if (existing) {
        setActiveSubmission(existing);
      } else {
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

  // Persist submissions list to localStorage as offline fallback
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
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setIsReviewOpen(false);
    executeSubmissionRecord();
  };

  // Create submission record, save centrally to server and dispatch email
  const executeSubmissionRecord = async () => {
    setIsSubmitting(true);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const folio = `AMAP-2027-C${randomCode}`;

    const newRecord: SubmissionRecord = {
      ...formData,
      id: `sub-${Date.now()}`,
      folio,
      createdAt: new Date().toISOString(),
      status: 'completado',
    };

    // Update local state immediately for instant feedback
    setSubmissions((prev) => [newRecord, ...prev]);
    setActiveSubmission(newRecord);

    // Clear form draft
    setFormData(INITIAL_FORM_DATA);
    try {
      localStorage.removeItem('amap_camporee_draft_2027');
    } catch {
      // ignore
    }

    // Save to central server and trigger Resend email
    try {
      const result = await submitRegistration(newRecord);
      setEmailDispatched(result.emailSent ?? true);
      sounds.playSuccess();
      showToast(`¡Preinscripción oficial enviada! Folio: ${folio}`, 'success');
    } catch (err: any) {
      console.warn('Guardado en servidor falló o sin conexión:', err);
      // Even if offline, local registration succeeded
      setEmailDispatched(false);
      showToast(`Preinscripción guardada localmente. Folio: ${folio}`, 'info');
    } finally {
      setIsSubmitting(false);
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
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/aistudio/Jungle_Framing_a_Sunlit_Future_City_f007bbaf.png')`,
        }}
      />
      {/* Cinematic dark tint with subtle blur */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/92 via-slate-950/80 to-slate-950/95 backdrop-blur-[1.5px]" />

      {/* Camporee Header */}
      <HeaderNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSubmissions={() => setIsDrawerOpen(true)}
        submissionsCount={submissions.length}
      />

      {/* Main Container */}
      <main className="flex-1 py-3.5 sm:py-8 px-3 sm:px-6 max-w-6xl mx-auto w-full">


        {/* View Switch */}
        {activeSubmission ? (
          <SuccessView
            submission={activeSubmission}
            onNewRegistration={() => setActiveSubmission(null)}
            onViewAllSubmissions={() => setIsDrawerOpen(true)}
            emailSent={emailDispatched}
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
      />

      {/* In-app Toast Feedback Banner */}
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
