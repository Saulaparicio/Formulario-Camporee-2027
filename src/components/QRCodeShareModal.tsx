import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { SubmissionRecord } from '../types/form';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionRecord;
}

export function buildConfirmationUrl(submission: SubmissionRecord): string {
  if (typeof window === 'undefined') return '';
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams({
    folio: submission.folio,
    club: submission.clubName,
    year: submission.foundationYear,
    church: submission.church,
    zone: submission.amapZone,
    pastor: submission.districtPastor,
    director: submission.directorName,
    phone: submission.contactPhone,
    email: submission.contactEmail,
    date: submission.createdAt,
  });
  return `${baseUrl}?${params.toString()}`;
}

export const QRCodeShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  submission,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrColorTheme, setQrColorTheme] = useState<'classic' | 'camporee'>('camporee');

  const shareUrl = buildConfirmationUrl(submission);

  // Generate QR Code onto canvas and as high-res Data URL
  useEffect(() => {
    if (!isOpen || !shareUrl) return;

    const darkColor = qrColorTheme === 'camporee' ? '#0f172a' : '#000000';
    const lightColor = '#ffffff';

    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });
  }, [isOpen, shareUrl, qrColorTheme]);

  if (!isOpen) return null;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPNG = () => {
    sounds.playClick();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_Preinscripcion_${submission.clubName.replace(/\s+/g, '_')}_${submission.folio}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShareWhatsApp = () => {
    sounds.playClick();
    const text = `🏕️ *Comprobante Oficial de Preinscripción VII Camporee AMAP 2027*\n\n` +
      `*Club:* ${submission.clubName}\n` +
      `*Folio:* ${submission.folio}\n` +
      `*Zona AMAP:* Zona ${submission.amapZone}\n\n` +
      `Verifica o consulta la constancia oficial aquí:\n${shareUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900 p-6 sm:p-7 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Código QR de Consulta Rápida
              </span>
              <h3 className="text-lg font-bold text-white font-display">
                Compartir Comprobante Oficial
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Presentation */}
        <div className="mt-5 flex flex-col items-center">
          {/* Card containing the QR */}
          <div className="relative p-5 rounded-3xl bg-white shadow-2xl border-4 border-amber-400/80 flex flex-col items-center text-center max-w-[280px] w-full">
            {/* Camporee small header with logo on card */}
            <div className="flex items-center justify-center gap-2 mb-2 pb-1.5 border-b border-slate-200 w-full">
              <img
                src="/assets/aistudio/logo_preparados_para_su_regreso_transparente_b4357a91.png"
                alt="Logo Camporee"
                className="h-9 w-auto object-contain drop-shadow"
              />
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight">
                  VII CAMPOREE AMAP 2027
                </div>
                <div className="text-[9px] font-extrabold text-sky-600 uppercase tracking-tight">
                  «Preparados Para Su Regreso»
                </div>
              </div>
            </div>

            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`QR Preinscripción ${submission.folio}`}
                className="w-48 h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
              </div>
            )}

            <div className="mt-2 text-xs font-mono font-black text-slate-900 tracking-wider">
              {submission.folio}
            </div>
            <div className="text-[10px] font-bold text-amber-700 truncate max-w-[220px]">
              {submission.clubName}
            </div>
          </div>

          {/* Explanation badge */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-slate-950/70 px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Escanea este código con cualquier cámara móvil para abrir la constancia directa</span>
          </div>

          {/* Quick Copy Link Box */}
          <div className="mt-4 w-full">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Enlace directo de confirmación:
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 p-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-amber-300 font-mono truncate focus:outline-none px-1"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 px-3 text-xs font-bold text-slate-200 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Descargar Imagen QR</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-3 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Modal footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Enlace permanente verificado
          </span>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-400 hover:underline font-semibold"
          >
            <span>Probar enlace</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
