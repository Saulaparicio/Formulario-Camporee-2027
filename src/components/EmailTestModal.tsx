import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  PRIMARY_TEST_EMAIL,
  OFFICIAL_NOTIFICATION_EMAIL,
  sendDirectTestEmail,
} from '../services/gmail';
import { googleSignIn } from '../services/googleAuth';
import {
  sendDirectResendTest,
  checkResendStatus,
  ResendStatus,
} from '../services/resendService';
import { sounds } from '../utils/audio';
import { DomainAuthGuide } from './DomainAuthGuide';
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
  ShieldAlert,
  RotateCcw,
  KeyRound,
  Info,
  Zap,
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
  const [providerMode, setProviderMode] = useState<'resend' | 'gmail'>('resend');
  const [targetEmail, setTargetEmail] = useState(PRIMARY_TEST_EMAIL);
  const [isSending, setIsSending] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [resendStatus, setResendStatus] = useState<ResendStatus | null>(null);

  const [result, setResult] = useState<{
    success: boolean;
    provider?: 'resend' | 'gmail';
    messageId?: string;
    recipient?: string;
    timestamp?: string;
    error?: string;
    isPermissionError?: boolean;
    isUnauthorizedDomain?: boolean;
    isResendMissingKey?: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkResendStatus().then(setResendStatus);
    }
  }, [isOpen]);

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
      const isUnauth =
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('auth/unauthorized-domain');
      setResult({
        success: false,
        provider: 'gmail',
        error: err.message || 'Error al solicitar autorización con Google',
        isUnauthorizedDomain: isUnauth,
      });
    } finally {
      setIsReauthorizing(false);
    }
  };

  const handleResendSend = async () => {
    try {
      sounds.playClick();
      setIsSending(true);
      setResult(null);

      const sendResult = await sendDirectResendTest(targetEmail);
      setResult({
        success: true,
        provider: 'resend',
        messageId: sendResult.messageId,
        recipient: sendResult.recipient,
        timestamp: new Date().toISOString(),
      });
      sounds.playSuccess();
    } catch (err: any) {
      console.error('Error enviando con Resend:', err);
      const isMissing =
        err.message?.includes('RESEND_API_KEY') ||
        err.message?.includes('missing') ||
        err.message?.includes('variable');

      setResult({
        success: false,
        provider: 'resend',
        error: isMissing
          ? 'Para enviar con Resend, agrega la variable RESEND_API_KEY en la configuración del servidor.'
          : err.message || 'Error al despachar correo vía Resend',
        isResendMissingKey: isMissing,
      });
      sounds.playError();
    } finally {
      setIsSending(false);
    }
  };

  const handleConnectAndSendGmail = async (overrideToken?: string, overrideUser?: User) => {
    try {
      sounds.playClick();
      let token = overrideToken || googleAccessToken;
      let user = overrideUser || googleUser;

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
        provider: 'gmail',
        messageId: sendResult.messageId,
        recipient: sendResult.recipient,
        timestamp: sendResult.timestamp,
      });
      sounds.playSuccess();
    } catch (err: any) {
      console.error('Error enviando prueba vía Gmail API:', err);
      const isUnauth =
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('auth/unauthorized-domain');

      const isPerm =
        err.message?.includes('Permiso insuficiente') ||
        err.message?.includes('insufficient') ||
        err.message?.includes('403') ||
        err.message?.includes('401') ||
        err.message?.includes('expirado');

      setResult({
        success: false,
        provider: 'gmail',
        error: err.message || 'Error desconocido al enviar correo vía Gmail API',
        isPermissionError: isPerm,
        isUnauthorizedDomain: isUnauth,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitSend = () => {
    if (providerMode === 'resend') {
      handleResendSend();
    } else {
      handleConnectAndSendGmail();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/40 bg-slate-900 p-4 sm:p-7 shadow-2xl my-4 sm:my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Provider selector tabs */}
          <div className="rounded-2xl bg-slate-950 p-1.5 border border-slate-800 flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setProviderMode('resend');
                setResult(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                providerMode === 'resend'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Resend (Sin login de Google)</span>
              <span className="text-[10px] bg-slate-950/30 text-slate-900 px-1.5 py-0.2 rounded-full font-extrabold uppercase hidden sm:inline">
                Recomendado
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setProviderMode('gmail');
                setResult(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                providerMode === 'gmail'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail API (Google Workspace)</span>
            </button>
          </div>

          {/* Mode explanation card */}
          {providerMode === 'resend' ? (
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 p-3.5 border border-amber-500/30 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Envío 100% Automático desde el Servidor</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Con Resend, los correos de preinscripción se despachan de forma instantánea y directa sin que nadie tenga que presionar «Conectar Google» ni autorizar dominios emergentes.
              </p>
              {resendStatus && (
                <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                  <span>Estado del servidor:</span>
                  {resendStatus.configured ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Clave de Resend detectada y activa
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Variable RESEND_API_KEY lista para vincularse en Secrets
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cuenta de Google Administrador:</span>
                {googleAccessToken ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conectado ({googleUser?.email || 'Cuenta Google'})
                    </span>
                    <button
                      type="button"
                      onClick={handleReauthorize}
                      disabled={isReauthorizing}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      {isReauthorizing ? 'Renovando...' : 'Reautorizar'}
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Requiere conexión en el navegador
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Email input */}
          <div className="rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Bandeja de destino para la prueba:
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-3.5 py-2 text-sm text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="sapaser@gmail.com"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Bandeja oficial predeterminada en AMAP:{' '}
              <span className="text-slate-300 font-mono">{OFFICIAL_NOTIFICATION_EMAIL}</span>
            </p>
          </div>

          {/* Results Box */}
          {result && (
            <div
              className={`rounded-2xl p-4 border transition-all ${
                result.success
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : result.isUnauthorizedDomain
                  ? 'bg-slate-950/90 border-amber-500/60 text-amber-200'
                  : 'bg-red-950/40 border-red-500/50 text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : result.isUnauthorizedDomain ? (
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-2 flex-1">
                  <strong className="block text-sm font-bold text-white">
                    {result.success
                      ? `¡Correo enviado con éxito vía ${result.provider === 'resend' ? 'Resend' : 'Google Gmail'}!`
                      : result.isUnauthorizedDomain
                      ? 'Dominio pendiente de autorización en Firebase (auth/unauthorized-domain)'
                      : 'Error al enviar correo de prueba'}
                  </strong>

                  {result.success ? (
                    <>
                      <p>
                        El mensaje fue aceptado por los servidores de correo y enviado con destino a{' '}
                        <strong className="font-mono text-amber-300">{result.recipient}</strong>.
                      </p>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/30 font-mono text-[11px] text-slate-300 space-y-1">
                        <div>
                          ID de Entrega:{' '}
                          <span className="text-emerald-400 font-bold">{result.messageId}</span>
                        </div>
                        <div>
                          Canal:{' '}
                          <span className="text-amber-300">
                            {result.provider === 'resend' ? 'Resend API (Servidor)' : 'Gmail API'}
                          </span>
                        </div>
                      </div>

                      {/* Reminder for spam folder */}
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-amber-200 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>¿Revisaste tu carpeta de Spam / Correo no deseado?</span>
                        </div>
                        <p className="leading-relaxed">
                          Al ser el primer envío desde un nuevo servicio a <strong className="font-mono text-amber-300">{result.recipient}</strong>, Gmail puede colocarlo en <strong>Spam</strong> o <strong>Promociones</strong>. Abre tu Gmail, búscalo y marca «No es spam».
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
                  ) : result.isUnauthorizedDomain ? (
                    <div className="pt-1">
                      <DomainAuthGuide
                        onSuccess={(newUser, newToken) => {
                          onGoogleAuthSuccess(newUser, newToken);
                          handleConnectAndSendGmail(newToken, newUser);
                        }}
                        onRetry={() => handleConnectAndSendGmail()}
                        isRetrying={isSending}
                      />
                    </div>
                  ) : result.isResendMissingKey ? (
                    <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-3 space-y-2 text-slate-200">
                      <p className="text-amber-200 font-bold">
                        ¿Cómo activar Resend en 1 minuto gratis?
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                        <li>Crea una cuenta gratuita en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">resend.com</a>.</li>
                        <li>Copia tu API Key (comienza con <code className="text-amber-300 font-mono">re_...</code>).</li>
                        <li>Agrégala como variable de entorno <code className="text-amber-300 font-mono">RESEND_API_KEY</code> en AI Studio.</li>
                      </ol>
                      <p className="text-[10px] text-slate-400">
                        Una vez configurada, todas las preinscripciones se enviarán automáticamente a <strong className="text-white">sapaser@gmail.com</strong> sin necesidad de que nadie inicie sesión.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-300 font-medium">{result.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-colors min-h-[44px] cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleSubmitSend}
            disabled={isSending || isReauthorizing || !targetEmail}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isSending ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Enviando prueba vía {providerMode === 'resend' ? 'Resend' : 'Gmail'}...</span>
              </>
            ) : result?.success ? (
              <>
                <RotateCcw className="w-4 h-4 text-slate-950" />
                <span>Reenviar otra prueba ({providerMode === 'resend' ? 'Resend' : 'Gmail'})</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-950" />
                <span>Enviar prueba vía {providerMode === 'resend' ? 'Resend' : 'Gmail'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
