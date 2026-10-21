import React from 'react';
import { ClubFormData } from '../types/form';
import { FileSpreadsheet, Mail, ShieldAlert, Check, X, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkipGoogle: () => void;
  formData: ClubFormData;
  userEmail?: string;
  isProcessing: boolean;
}

export const WorkspaceConfirmDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  onSkipGoogle,
  formData,
  userEmail,
  isProcessing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900 p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Confirmación de Sincronización
            </span>
            <h3 className="text-lg font-bold text-white font-display">
              Google Workspace (Sheets & Gmail)
            </h3>
          </div>
        </div>

        {/* Detailed Action Description */}
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p className="text-xs text-slate-400">
            Al confirmar, se ejecutarán las siguientes acciones con tu cuenta ({userEmail || 'Google conectada'}):
          </p>

          <div className="space-y-2.5 rounded-2xl bg-slate-950/70 p-4 border border-slate-800">
            {/* Sheet action */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-white block font-semibold">Guardar en Google Sheets:</strong>
                <span>
                  Se insertará una nueva fila en la hoja de cálculo{' '}
                  <strong className="text-emerald-400">«Preinscripciones VII Camporee AMAP 2027»</strong>{' '}
                  con los datos del club <strong>{formData.clubName}</strong>.
                </span>
              </div>
            </div>

            {/* Gmail action */}
            <div className="flex items-start gap-3 pt-2.5 border-t border-slate-800/80">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-white block font-semibold">Enviar copia por Gmail:</strong>
                <span>
                  Se enviará una copia oficial con todos los detalles de la preinscripción a{' '}
                  <strong className="text-amber-400 font-mono">departamentoja@amapanama.org</strong> y con copia a{' '}
                  <strong className="text-slate-200">{formData.contactEmail}</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onSkipGoogle();
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            title="Guardar sólo en el sistema local sin enviar a Google"
          >
            Guardar sólo localmente
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playSuccess();
              onConfirm();
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Confirmar y Sincronizar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
