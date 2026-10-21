import React from 'react';
import { ClubFormData } from '../types/form';
import { X, Edit3, Send, Shield, User, FileText, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: ClubFormData;
  onEditField: (fieldIndex: number) => void;
  onConfirmSubmit: () => void;
  googleConnected?: boolean;
  userEmail?: string;
}

export const ReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  formData,
  onEditField,
  onConfirmSubmit,
  googleConnected,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-4 sm:p-7 shadow-2xl my-4 sm:my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                Revisión de Preinscripción
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Verifica tus respuestas antes de enviar a AMAP 2027
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details (Scrollable) */}
        <div className="space-y-4 sm:space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Sección A: Datos del Club */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-2.5 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Sección A. Datos del Club
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Nombre del club:</span>
                  <span className="font-semibold text-white truncate block">{formData.clubName || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(0)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Año de fundación:</span>
                  <span className="font-semibold text-white truncate block">{formData.foundationYear || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(1)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Iglesia / congregación:</span>
                  <span className="font-semibold text-white truncate block">{formData.church || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(3)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Zona AMAP:</span>
                  <span className="font-bold text-amber-400 block">
                    {formData.amapZone ? `Zona ${formData.amapZone}` : '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(4)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Pastor distrital:</span>
                  <span className="font-semibold text-white truncate block">{formData.districtPastor || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(5)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {formData.clubLogo ? (
                    <img
                      src={formData.clubLogo}
                      alt="Logo"
                      className="h-10 w-10 rounded-lg object-contain bg-slate-950 p-1 border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Logo oficial:</span>
                    <span className="font-medium text-white text-xs truncate block">
                      {formData.clubLogoName || 'Sin archivo adjunto'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(2)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sección B: Datos del Director */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-2.5 text-sky-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Sección B. Datos del Director(a)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Nombre completo:</span>
                  <span className="font-semibold text-white truncate block">{formData.directorName || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(6)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Teléfono / WhatsApp:</span>
                  <span className="font-semibold text-white truncate block">{formData.contactPhone || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(7)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Correo electrónico:</span>
                  <span className="font-semibold text-amber-300 truncate block">{formData.contactEmail || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(8)}
                  className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sección D: Documentos y Pago */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-2.5 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Sección D. Documentos y Pago
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {formData.paymentProof ? (
                  <img
                    src={formData.paymentProof}
                    alt="Comprobante"
                    className="h-10 w-10 rounded-lg object-contain bg-slate-950 p-1 border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Comprobante de pago:</span>
                  <span className="font-semibold text-emerald-400 text-xs truncate block">
                    {formData.paymentProofName || 'Adjunto'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditField(9)}
                className="p-2 text-slate-400 hover:text-amber-400 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Editar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Google Workspace notification callout */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-200">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-amber-400" />
              <span>Sincronización Automática Oficial:</span>
            </div>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              • Se guardará el Folio oficial en Google Sheets.{' '}
              <br />• Se notificará con copia de prueba directa a{' '}
              <strong className="text-amber-300 font-mono">sapaser@gmail.com</strong> y a{' '}
              <strong className="text-slate-200 font-mono">departamentoja@amapanama.org</strong>.
            </p>
          </div>
        </div>

        {/* Modal Footer (Thumb friendly, full width buttons on mobile) */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-semibold transition-colors min-h-[44px] cursor-pointer"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playSuccess();
              onConfirmSubmit();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 sm:py-2.5 text-sm font-bold text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>Confirmar y Enviar Preinscripción</span>
          </button>
        </div>
      </div>
    </div>
  );
};
