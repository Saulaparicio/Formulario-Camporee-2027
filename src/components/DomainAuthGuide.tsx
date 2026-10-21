import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_SETTINGS_URL,
  signInWithGIS,
  setManualAccessToken,
} from '../services/googleAuth';
import { User } from 'firebase/auth';
import { sounds } from '../utils/audio';

interface Props {
  onSuccess?: (user: User, token: string) => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const DomainAuthGuide: React.FC<Props> = ({
  onSuccess,
  onRetry,
  isRetrying = false,
}) => {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const [copied, setCopied] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isApplyingToken, setIsApplyingToken] = useState(false);
  const [isAttemptingGIS, setIsAttemptingGIS] = useState(false);
  const [gisError, setGisError] = useState<string | null>(null);

  const handleCopy = () => {
    sounds.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleAttemptGIS = async () => {
    try {
      sounds.playClick();
      setIsAttemptingGIS(true);
      setGisError(null);
      const res = await signInWithGIS();
      if (res && onSuccess) {
        sounds.playSuccess();
        onSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.warn('GIS attempt error:', err);
      setGisError(err.message || 'No se pudo completar la autenticación con GIS.');
    } finally {
      setIsAttemptingGIS(false);
    }
  };

  const handleApplyManualToken = async () => {
    if (!manualToken.trim()) return;
    try {
      sounds.playClick();
      setIsApplyingToken(true);
      const res = await setManualAccessToken(manualToken.trim());
      if (onSuccess) {
        sounds.playSuccess();
        onSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      alert('Error con el token ingresado: ' + err.message);
    } finally {
      setIsApplyingToken(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-slate-900 to-amber-950/20 p-4 sm:p-5 text-left text-xs shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30 mb-1">
            <AlertOctagon className="w-3 h-3 text-amber-400" />
            Acción requerida: auth/unauthorized-domain
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white font-display">
            Autorizar Dominio en Firebase Console
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
            Por seguridad, Google Firebase bloquea la ventana emergente de inicio de sesión si el dominio no está registrado en los <strong>Dominios Autorizados</strong> del proyecto.
          </p>
        </div>
      </div>

      {/* Copy Hostname Box */}
      <div className="rounded-xl bg-slate-950/90 border border-amber-500/40 p-3 space-y-2">
        <label className="block text-[11px] font-bold text-slate-300">
          1. Copia el dominio actual de la aplicación:
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-slate-900 px-3 py-2 border border-slate-700 text-amber-300 font-mono text-xs select-all break-all">
            {currentHost || 'ais-dev-...run.app'}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Dominio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step by step */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 space-y-2 text-[11px] text-slate-300">
        <span className="font-bold text-white block">2. Pasos para autorizarlo (toma 20 segundos):</span>
        <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
          <li>
            Haz clic en el botón naranja de abajo para abrir la configuración del proyecto{' '}
            <strong className="text-amber-300 font-mono">{FIREBASE_PROJECT_ID}</strong>.
          </li>
          <li>
            En la pestaña <strong className="text-white">Settings (Configuración)</strong>, baja hasta la sección{' '}
            <strong className="text-white">"Dominios autorizados" (Authorized domains)</strong>.
          </li>
          <li>
            Haz clic en <strong className="text-amber-300">"Agregar dominio" (Add domain)</strong>, pega el dominio copiado y pulsa <strong className="text-white">Guardar</strong>.
          </li>
          <li>
            Regresa a esta ventana y pulsa <strong className="text-emerald-400">"Reintentar Conexión y Envío"</strong>.
          </li>
        </ol>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <a
          href={FIREBASE_SETTINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-center"
        >
          <span>Abrir Firebase Console en Dominios Autorizados</span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Verificando...' : 'Reintentar Conexión'}</span>
          </button>
        )}
      </div>

      {/* Alternative Options (GIS / Manual Token) */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>¿Prefieres una alternativa inmediata?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAttemptGIS}
              disabled={isAttemptingGIS}
              className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isAttemptingGIS ? 'Probando GIS...' : 'Probar vía Google Identity (GIS)'}</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowManualToken(!showManualToken)}
              className="text-slate-400 hover:text-white underline font-semibold flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>Token manual</span>
            </button>
          </div>
        </div>

        {gisError && (
          <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-500/30 p-2 rounded-lg">
            {gisError}
          </p>
        )}

        {showManualToken && (
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-2 mt-2">
            <label className="block text-[11px] font-semibold text-slate-300">
              Ingresar Access Token de Google OAuth (Playground o terminal):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyManualToken}
                disabled={isApplyingToken || !manualToken.trim()}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
              >
                {isApplyingToken ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Permite validar el envío de prueba de inmediato con un token temporal de Google APIs sin modificar la consola.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
