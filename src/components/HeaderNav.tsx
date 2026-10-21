import React from 'react';
import { User } from 'firebase/auth';
import { ConquistadoresLogo } from './ConquistadoresLogo';
import { GoogleWorkspaceStatus } from './GoogleWorkspaceStatus';
import { Volume2, VolumeX, MessageSquareText, FileSpreadsheet, Sparkles, Calendar, Layers } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  viewMode: 'conversational' | 'full';
  setViewMode: (mode: 'conversational' | 'full') => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenSubmissions: () => void;
  submissionsCount: number;
  googleUser: User | null;
  googleAccessToken: string | null;
  onGoogleAuthSuccess: (user: User, token: string) => void;
  onGoogleAuthClear: () => void;
  sheetUrl?: string | null;
}

export const HeaderNav: React.FC<Props> = ({
  viewMode,
  setViewMode,
  soundEnabled,
  setSoundEnabled,
  onOpenSubmissions,
  submissionsCount,
  googleUser,
  googleAccessToken,
  onGoogleAuthSuccess,
  onGoogleAuthClear,
  sheetUrl,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.enabled = next;
    setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Camporee Brand */}
          <div className="flex items-center gap-3">
            <ConquistadoresLogo size="md" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 shadow-sm shadow-amber-500/10">
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                  VII Camporee AMAP 2027
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                  «Preparados Para Su Regreso»
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  Cierre: 30 Oct 2026
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-display flex items-center gap-2">
                <span>Preinscripción Oficial de Clubes</span>
              </h1>
            </div>
          </div>

          {/* Controls: Google Workspace Status, Mode switcher, sound, submissions drawer */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
            {/* Google Workspace Account Connection */}
            <GoogleWorkspaceStatus
              user={googleUser}
              accessToken={googleAccessToken}
              onAuthSuccess={onGoogleAuthSuccess}
              onAuthClear={onGoogleAuthClear}
              sheetUrl={sheetUrl}
            />

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setViewMode('conversational');
                  sounds.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'conversational'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo interactivo y conversacional paso a paso"
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>Conversacional</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('full');
                  sounds.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'full'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo formulario completo en una sola vista"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Vista Completa</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Submissions Drawer / Records Button */}
            <button
              type="button"
              onClick={() => {
                onOpenSubmissions();
                sounds.playClick();
              }}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
              title="Ver preinscripciones guardadas y exportar a CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Preinscripciones</span>
              {submissionsCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                  {submissionsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
