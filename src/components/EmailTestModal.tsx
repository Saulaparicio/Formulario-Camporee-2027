import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  PRIMARY_TEST_EMAIL,
  OFFICIAL_NOTIFICATION_EMAIL,
  sendDirectTestEmail,
} from '../services/gmail';
import { googleSignIn } from '../services/googleAuth';
import { sounds } from '../utils/audio';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  KeyRound,
  Info,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  googleAccessToken: string | null;
  onGoogleAuthSuccess: (user: User, token: string) => void;
}

export const EmailTestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  googleUser,
  googleAccessToken,
  onGoogleAuthSuccess,
}) => {
  const [targetEmail, setTargetEmail] = useState(PRIMARY_TEST_EMAIL);
  const [isSending, setIsSending] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    recipient?: string;
    timestamp?: string;
    error?: string;
    isPermissionError?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleReauthorize = async () => {
    try {
      sounds.playClick();
      setIsReauthorizing(true);
      setResult(null);
      const res = await googleSignIn(true);
      if (res) {
        onGoogleAuthSuccess(res.user, res.accessToken);
        sounds.playSuccess();
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Error al solicitar autorización con Google',
      });
    } finally {
      setIsReauthorizing(false);
    }
  };

  const handleConnectAndSend = async () => {
    try {
      sounds.playClick();
      let token = googleAccessToken;
      let user = googleUser;

      if (!token || !user) {
        setIsSending(true);
        const res = await googleSignIn(true);
        if (!res) {
          setIsSending(false);
          return;
        }
        token = res.accessToken;
        user = res.user;
        onGoogleAuthSuccess(res.user, res.accessToken);
      }

      setIsSending(true);
      setResult(null);

      const sendResult = await sendDirectTestEmail(token, targetEmail, {
        email: user.email,
        displayName: user.displayName,
      });

      setResult({
        success: true,
        messageId: sendResult.messageId,
        recipient: sendResult.recipient,
        timestamp: sendResult.timestamp,
      });
      sounds.playSuccess();
    } catch (err: any) {
      console.error('Error enviando prueba:', err);
      const isPerm =
        err.message?.includes('Permiso insuficiente') ||
        err.message?.includes('insufficient') ||
        err.message?.includes('403') ||
        err.message?.includes('401') ||
        err.message?.includes('expirado');

      setResult({
        success: false,
        error: err.message || 'Error desconocido al enviar correo vía Gmail API',
        isPermissionError: isPerm,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/40 bg-slate-900 p-6 sm:p-7 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Verificación de Entrega
                </span>
                <span className="text-xs text-slate-400">• VII Camporee</span>
              </div>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                Prueba de Envío a <span className="text-amber-400 font-mono">sapaser@gmail.com</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description & instructions */}
        <div className="mt-4 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            Realiza una prueba inmediata para verificar que las notificaciones del VII Camporee AMAP 2027 lleguen directamente a la bandeja de entrada de{' '}
            <strong className="text-amber-300 font-mono">sapaser@gmail.com</strong>.
          </p>

          {/* Account connection status */}
          <div className="rounded-2xl bg-slate-950/70 p-4 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Estado de Google Workspace:</span>
              {googleAccessToken ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conectado ({googleUser?.email || 'Cuenta de Google'})
                  </span>
                  <button
                    type="button"
                    onClick={handleReauthorize}
                    disabled={isReauthorizing}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5"
                    title="Renovar token y reautorizar permisos de Gmail"
                  >
                    <KeyRound className="w-3 h-3" />
                    {isReauthorizing ? 'Renovando...' : 'Reautorizar'}
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  No conectado (Se solicitará al enviar)
                </span>
              )}
            </div>

            {/* Email destination input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destinatario de la prueba:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-3.5 py-2 text-sm text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="sapaser@gmail.com"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Bandeja oficial predeterminada en AMAP:{' '}
                <span className="text-slate-300 font-mono">{OFFICIAL_NOTIFICATION_EMAIL}</span>
              </p>
            </div>
          </div>

          {/* Test results banner */}
          {result && (
            <div
              className={`rounded-2xl p-4 border transition-all ${
                result.success
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/50 text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-2 flex-1">
                  <strong className="block text-sm font-bold text-white">
                    {result.success
                      ? '¡Correo de prueba enviado con éxito por Google!'
                      : 'Error al enviar correo de prueba'}
                  </strong>
                  {result.success ? (
                    <>
                      <p>
                        Google API ha aceptado el correo y lo ha despachado con destino a{' '}
                        <strong className="font-mono text-amber-300">{result.recipient}</strong>.
                      </p>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/30 font-mono text-[11px] text-slate-300 space-y-1">
                        <div>
                          ID de mensaje Google:{' '}
                          <span className="text-emerald-400 font-bold">{result.messageId}</span>
                        </div>
                        <div>
                          Hora:{' '}
                          <span className="text-slate-400">
                            {new Date(result.timestamp || '').toLocaleString('es-PA')}
                          </span>
                        </div>
                      </div>

                      {/* Instructions for finding it in Gmail */}
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-amber-200 text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>¿No lo ves en tu bandeja de Recibidos?</span>
                        </div>
                        <p className="leading-relaxed">
                          Cuando una aplicación web envía un correo automático por primera vez a una dirección de Gmail, los filtros de Google suelen enviarlo a la carpeta{' '}
                          <strong className="text-white underline">Spam (Correo no deseado)</strong> o a la pestaña{' '}
                          <strong className="text-white underline">Notificaciones / Promociones</strong> de <span className="font-mono text-amber-300">{result.recipient}</span>.
                        </p>
                        <p className="leading-relaxed text-amber-100 font-medium">
                          👉 Abre tu Gmail, busca en <em>Spam</em> el asunto <strong>"[PRUEBA DE VERIFICACIÓN] VII Camporee AMAP 2027"</strong> y haz clic en <strong>"No es spam"</strong> para que las futuras confirmaciones lleguen directo a tu bandeja principal.
                        </p>
                      </div>

                      <div className="pt-1 flex items-center gap-3">
                        <a
                          href="https://mail.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Abrir Gmail <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-300 font-medium">{result.error}</p>
                      {result.isPermissionError && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleReauthorize}
                            disabled={isReauthorizing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-200 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{isReauthorizing ? 'Conectando...' : 'Reautorizar permisos de Gmail ahora'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics summary */}
          <div className="rounded-2xl bg-slate-950/50 p-3.5 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Garantías de entrega RFC 2822 / Gmail API:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400 pl-1">
              <li>Formato MIME estándar con separación CRLF estricta de encabezados y cuerpo</li>
              <li>Codificación Base64 en bloques de 76 caracteres (evita filtros antispam)</li>
              <li>Asunto codificado con RFC 2047 UTF-8</li>
              <li>Atribución de remitente autorizado por Google Workspace</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleConnectAndSend}
            disabled={isSending || isReauthorizing || !targetEmail}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Enviando prueba a {targetEmail}...</span>
              </>
            ) : result?.success ? (
              <>
                <RotateCcw className="w-4 h-4 text-slate-950" />
                <span>Reenviar otra prueba a {targetEmail}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-950" />
                <span>Enviar prueba a {targetEmail}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
