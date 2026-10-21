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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                Revisión de Preinscripción
              </h3>
              <p className="text-xs text-slate-400">
                Verifica tus respuestas antes de enviar a la coordinación AMAP 2027
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {/* Sección A: Datos del Club */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4">
            <div className="flex items-center justify-between mb-3 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Sección A. Datos del Club
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Nombre del club:</span>
                  <span className="font-semibold text-white">{formData.clubName || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(0)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Año de fundación:</span>
                  <span className="font-semibold text-white">{formData.foundationYear || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(1)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Iglesia / congregación:</span>
                  <span className="font-semibold text-white">{formData.church || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(3)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Zona AMAP:</span>
                  <span className="font-bold text-amber-400">
                    {formData.amapZone ? `Zona ${formData.amapZone}` : '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(4)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Pastor distrital:</span>
                  <span className="font-semibold text-white">{formData.districtPastor || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(5)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Logo preview */}
              <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.clubLogo ? (
                    <img
                      src={formData.clubLogo}
                      alt="Logo del club"
                      className="h-10 w-10 rounded-lg object-contain bg-slate-950 p-1 border border-slate-800"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                      Sin logo
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-400 block">Logo oficial:</span>
                    <span className="text-xs font-medium text-slate-200">
                      {formData.clubLogoName || (formData.clubLogo ? 'Cargado' : 'No adjunto')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(2)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sección B: Datos del Director */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4">
            <div className="flex items-center justify-between mb-3 text-blue-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Sección B. Datos del Director(a)
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Nombre del director(a):</span>
                  <span className="font-semibold text-white">{formData.directorName || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditField(6)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Teléfono de contacto:</span>
                    <span className="font-semibold text-white">{formData.contactPhone || '—'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditField(7)}
                    className="p-1.5 text-slate-400 hover:text-amber-400"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Correo electrónico:</span>
                    <span className="font-semibold text-white truncate max-w-[170px] inline-block">
                      {formData.contactEmail || '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditField(8)}
                    className="p-1.5 text-slate-400 hover:text-amber-400"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sección D: Documentos y Pago */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4">
            <div className="flex items-center justify-between mb-3 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Sección D. Documentos y Pago
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.paymentProof ? (
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    ✓
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                    Sin foto
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400 block">Comprobante de pago:</span>
                  <span className="text-xs font-medium text-slate-200">
                    {formData.paymentProofName || (formData.paymentProof ? 'Adjunto' : 'Pendiente')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditField(9)}
                className="p-1.5 text-slate-400 hover:text-amber-400"
                title="Editar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Google Workspace notification callout */}
        <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-200">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-amber-400" />
            <span>Sincronización Automática Oficial:</span>
          </div>
          <p className="text-slate-300">
            • Se guardará una copia con el Folio en tu Google Sheets oficial.{' '}
            <br />• Se notificará con copia de prueba directa a{' '}
            <strong className="text-amber-300 font-mono">sapaser@gmail.com</strong> y a{' '}
            <strong className="text-slate-200 font-mono">departamentoja@amapanama.org</strong>.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-semibold transition-colors"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playSuccess();
              onConfirmSubmit();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 text-sm font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Confirmar y Enviar Preinscripción</span>
          </button>
        </div>
      </div>
    </div>
  );
};
