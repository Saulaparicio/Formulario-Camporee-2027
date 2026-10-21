import React from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, googleSignOut } from '../services/googleAuth';
import { FileSpreadsheet, Mail, LogOut, CheckCircle, ExternalLink } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthClear: () => void;
  sheetUrl?: string | null;
}

export const GoogleWorkspaceStatus: React.FC<Props> = ({
  user,
  accessToken,
  onAuthSuccess,
  onAuthClear,
  sheetUrl,
}) => {
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      sounds.playClick();
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        sounds.playSuccess();
      }
    } catch (err: any) {
      console.error('No se pudo conectar con Google:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    sounds.playClick();
    await googleSignOut();
    onAuthClear();
  };

  if (!user || !accessToken) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition-all cursor-pointer disabled:opacity-50 min-h-[36px]"
          title="Conectar con Google para sincronizar automáticamente con Google Sheets y enviar copia a departamentoja@amapanama.org"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="truncate">{isSigningIn ? 'Conectando...' : 'Conectar Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
      {/* Connected indicator badge */}
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-slate-300 min-h-[36px]">
        <div className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Google:</span>
        </div>
        <span className="font-semibold text-white max-w-[90px] sm:max-w-[120px] truncate" title={user.email || ''}>
          {user.displayName || user.email?.split('@')[0]}
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          <span title="Google Sheets activado">
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
          </span>
          <span title="Gmail activado">
            <Mail className="w-3 h-3 text-blue-400" />
          </span>
        </div>
      </div>

      {sheetUrl && (
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2 sm:px-2.5 py-1 text-xs font-bold text-emerald-300 transition-colors min-h-[36px]"
          title="Abrir hoja de cálculo oficial en Google Sheets"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Hoja</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
        title="Desconectar cuenta de Google"
        aria-label="Desconectar cuenta de Google"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
