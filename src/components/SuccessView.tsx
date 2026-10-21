import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { SubmissionRecord } from '../types/form';
import { ConquistadoresLogo } from './ConquistadoresLogo';
import { QRCodeShareModal, buildConfirmationUrl } from './QRCodeShareModal';
import {
  Printer,
  Share2,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building,
  User,
  Phone,
  Shield,
  FileCheck,
  FileSpreadsheet,
  Mail,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  submission: SubmissionRecord;
  onNewRegistration: () => void;
  onViewAllSubmissions: () => void;
  sheetUrl?: string | null;
  googleSynced?: boolean;
  emailSent?: boolean;
  onSyncGoogleNow?: () => void;
  isSyncingGoogle?: boolean;
  onOpenEmailTest?: () => void;
}

export const SuccessView: React.FC<Props> = ({
  submission,
  onNewRegistration,
  onViewAllSubmissions,
  sheetUrl,
  googleSynced,
  emailSent,
  onSyncGoogleNow,
  isSyncingGoogle,
  onOpenEmailTest,
}) => {
  const credentialRef = useRef<HTMLDivElement>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const confirmationUrl = buildConfirmationUrl(submission);

  // Generate QR Code data URL for the confirmation page link
  useEffect(() => {
    if (confirmationUrl) {
      QRCode.toDataURL(confirmationUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating credential QR:', err));
    }
  }, [confirmationUrl]);

  // Trigger celebration confetti
  useEffect(() => {
    sounds.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#dc2626', '#3b82f6', '#10b981', '#fbbf24'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleShareWhatsApp = () => {
    sounds.playClick();
    const text = `🏕️ *¡Preinscripción Oficial VII Camporee AMAP 2027!* 🔥\n\n` +
      `*Folio:* ${submission.folio}\n` +
      `*Club:* ${submission.clubName}\n` +
      `*Zona AMAP:* Zona ${submission.amapZone}\n` +
      `*Iglesia:* ${submission.church}\n` +
      `*Director(a):* ${submission.directorName}\n` +
      `*Pastor:* ${submission.districtPastor}\n\n` +
      `Consulta o verifica la constancia oficial aquí:\n${confirmationUrl}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
      {/* Success banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-4 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          ¡Preinscripción Completada!
        </span>

        <h2 className="text-xl sm:text-3xl font-extrabold text-white font-display">
          ¡Felicidades, Club {submission.clubName}!
        </h2>

        <p className="mt-2 text-xs sm:text-base text-slate-300 max-w-xl mx-auto">
          Los datos del club y del director han sido recibidos satisfactoriamente. Su cupo preliminar para el{' '}
          <strong className="text-amber-400">VII Camporee AMAP 2027</strong> está registrado.
        </p>

        {/* Folio Badge */}
        <div className="mt-3 sm:mt-4 inline-flex flex-col items-center justify-center rounded-2xl bg-slate-900/90 border border-slate-700/80 px-4 sm:px-6 py-2.5 sm:py-3 shadow-inner">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Número de Folio Oficial
          </span>
          <span className="text-lg sm:text-2xl font-mono font-black text-amber-400 tracking-wider">
            {submission.folio}
          </span>
        </div>

        {/* Google Workspace Sync Badges */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xl mx-auto">
          {googleSynced ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs text-emerald-300 w-full sm:w-auto justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Guardado en Google Sheets</span>
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold underline hover:text-white ml-1"
                >
                  Abrir hoja <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : onSyncGoogleNow ? (
            <button
              type="button"
              onClick={onSyncGoogleNow}
              disabled={isSyncingGoogle}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-colors w-full sm:w-auto min-h-[40px] cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>{isSyncingGoogle ? 'Sincronizando...' : 'Sincronizar a Google Sheets'}</span>
            </button>
          ) : null}

          {emailSent && (
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-2.5 sm:p-3 text-xs text-emerald-300 w-full">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Registro guardado en el sistema central y notificación despachada con éxito.
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 text-center">
                Guarda tu folio oficial o comparte tu constancia digital con tu directiva.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons (Full width on mobile, thumb friendly) */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsQRModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer min-h-[46px]"
            title="Abrir generador de código QR para guardar o compartir el enlace de confirmación"
          >
            <QrCode className="w-4 h-4 text-slate-950" />
            <span>Ver / Guardar Código QR</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 shadow-md transition-all cursor-pointer min-h-[46px]"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir / Descargar</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer min-h-[46px]"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir en WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Printable Digital Credential / Official Registration Ticket */}
      <div
        ref={credentialRef}
        id="printable-credential"
        className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-slate-950 p-4 sm:p-8 shadow-2xl text-slate-100 print:border-black print:text-black print:bg-white print:p-4"
      >
        {/* Top Header Credential */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 sm:pb-5 print:border-gray-300">
          <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
            <ConquistadoresLogo size="md" className="sm:hidden" />
            <ConquistadoresLogo size="lg" className="hidden sm:block" />
            <div>
              <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-400 print:text-amber-800">
                  Asociación Metropolitana • AMAP
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase bg-sky-500/15 border border-sky-400/30 text-sky-400 px-2 py-0.5 rounded-full print:border-gray-400 print:text-black">
                  «Preparados Para Su Regreso»
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white print:text-black font-display mt-0.5">
                VII Camporee de Conquistadores 2027
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 print:text-gray-600">
                Constancia Oficial de Preinscripción de Club
              </p>
            </div>
          </div>

          {/* Interactive QR Code in Credential */}
          <div
            onClick={() => {
              sounds.playClick();
              setIsQRModalOpen(true);
            }}
            className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
            title="Haz clic para ampliar, descargar o compartir este código QR"
          >
            <div className="p-1.5 rounded-xl bg-white shadow-md border-2 border-transparent group-hover:border-amber-400 transition-colors">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${submission.folio}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white text-slate-400">
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 print:text-gray-600 mt-1 flex items-center gap-1 group-hover:text-amber-400">
              <QrCode className="w-2.5 h-2.5" />
              <span>{submission.folio}</span>
            </span>
          </div>
        </div>

        {/* Credential Body */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Club Logo & Zone Badge */}
          <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center print:bg-gray-50 print:border-gray-200">
            {submission.clubLogo ? (
              <img
                src={submission.clubLogo}
                alt={submission.clubName}
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-xl bg-slate-950 p-1 border border-slate-700/60 shadow"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            )}
            <h4 className="mt-2.5 font-bold text-white print:text-black text-sm sm:text-base">
              {submission.clubName}
            </h4>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-400 px-3 py-0.5 text-xs font-bold border border-amber-500/30 print:border-gray-400 print:text-black">
              Zona {submission.amapZone}
            </span>
            <span className="mt-1 text-[11px] sm:text-xs text-slate-400 print:text-gray-600">
              Fundado en {submission.foundationYear}
            </span>
          </div>

          {/* Center: Details */}
          <div className="sm:col-span-2 space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 print:border-gray-200 print:bg-white">
                <span className="text-[11px] sm:text-xs text-slate-400 print:text-gray-500 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  Iglesia / Congregación:
                </span>
                <span className="font-semibold text-slate-100 print:text-black block mt-0.5 text-xs sm:text-sm truncate">
                  {submission.church}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 print:border-gray-200 print:bg-white">
                <span className="text-[11px] sm:text-xs text-slate-400 print:text-gray-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Pastor Distrital:
                </span>
                <span className="font-semibold text-slate-100 print:text-black block mt-0.5 text-xs sm:text-sm truncate">
                  {submission.districtPastor}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 print:border-gray-200 print:bg-white">
                <span className="text-[11px] sm:text-xs text-slate-400 print:text-gray-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  Director(a):
                </span>
                <span className="font-semibold text-slate-100 print:text-black block mt-0.5 text-xs sm:text-sm truncate">
                  {submission.directorName}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 print:border-gray-200 print:bg-white">
                <span className="text-[11px] sm:text-xs text-slate-400 print:text-gray-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  Teléfono / WhatsApp:
                </span>
                <span className="font-semibold text-slate-100 print:text-black block mt-0.5 text-xs sm:text-sm truncate">
                  {submission.contactPhone}
                </span>
              </div>
            </div>

            {/* Email and Payment status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 print:border-gray-200 print:bg-white">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs text-slate-400 print:text-gray-500 block">
                  Correo de confirmación:
                </span>
                <span className="text-xs font-semibold text-amber-300 print:text-black truncate block">
                  {submission.contactEmail}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 print:border-gray-300 print:text-green-700">
                  <FileCheck className="w-3.5 h-3.5" />
                  Comprobante adjunto
                </span>
              </div>
            </div>

            {/* Timestamp and Stamp */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 print:text-gray-500 pt-2 border-t border-slate-800/80 print:border-gray-200">
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{new Date(submission.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
              </span>
              <span className="font-bold text-emerald-400 print:text-black shrink-0">
                ESTADO: PREINSCRITO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onNewRegistration();
          }}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors w-full sm:w-auto py-2 min-h-[44px] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar otro club</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onViewAllSubmissions();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 transition-all shadow-sm w-full sm:w-auto min-h-[44px] cursor-pointer"
        >
          <span>Ver todas las preinscripciones</span>
        </button>
      </div>

      {/* QR Code Share & Download Modal */}
      <QRCodeShareModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        submission={submission}
      />
    </div>
  );
};
