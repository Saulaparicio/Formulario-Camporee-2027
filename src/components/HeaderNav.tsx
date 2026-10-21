import React from 'react';
import { User } from 'firebase/auth';
import { ConquistadoresLogo } from './ConquistadoresLogo';
import { GoogleWorkspaceStatus } from './GoogleWorkspaceStatus';
import {
  Volume2,
  VolumeX,
  MessageSquareText,
  FileSpreadsheet,
  Sparkles,
  Layers,
  MailCheck,
} from 'lucide-react';
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
  onOpenEmailTest: () => void;
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
  onOpenEmailTest,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.enabled = next;
    setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 space-y-2 sm:space-y-3">
        {/* Top Bar: Brand, Quick Icons & Sound */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Camporee Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <ConquistadoresLogo size="sm" className="sm:hidden shrink-0" />
            <ConquistadoresLogo size="md" className="hidden sm:block shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-300 shadow-sm shadow-amber-500/10">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 animate-pulse" />
                  VII Camporee AMAP 2027
                </span>
                <span className="hidden xs:inline-flex items-center text-[10px] sm:text-[11px] font-bold text-sky-400 bg-sky-500/10 px-1.5 sm:px-2 py-0.5 rounded-full border border-sky-500/30 truncate">
                  «Preparados Para Su Regreso»
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-white font-display truncate mt-0.5">
                Preinscripción Oficial de Clubes
              </h1>
            </div>
          </div>

          {/* Quick Header Actions: Sound & Preinscripciones Drawer */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl border min-h-[38px] min-w-[38px] flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
              aria-label={soundEnabled ? 'Silenciar efectos' : 'Activar efectos'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Submissions Drawer Button with Count Badge */}
            <button
              type="button"
              onClick={() => {
                onOpenSubmissions();
                sounds.playClick();
              }}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm min-h-[38px] cursor-pointer"
              title="Ver preinscripciones guardadas y exportar a CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Preinscripciones</span>
              {submissionsCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                  {submissionsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Row: Mode Switcher & Google Integration Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
          {/* Segmented View Mode Switcher (Touch friendly, full width on mobile) */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner sm:w-auto sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => {
                setViewMode('conversational');
                sounds.playClick();
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px] sm:min-h-[32px] ${
                viewMode === 'conversational'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
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
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px] sm:min-h-[32px] ${
                viewMode === 'full'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista Completa</span>
            </button>
          </div>

          {/* Quick Integration & Test Badges (Google + Email Test) */}
          <div className="flex items-center gap-2 justify-between sm:justify-end overflow-x-auto pb-0.5 scrollbar-none">
            {/* Google Workspace Connection */}
            <GoogleWorkspaceStatus
              user={googleUser}
              accessToken={googleAccessToken}
              onAuthSuccess={onGoogleAuthSuccess}
              onAuthClear={onGoogleAuthClear}
              sheetUrl={sheetUrl}
            />

            {/* Direct Email Test to sapaser@gmail.com */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenEmailTest();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-sm hover:border-amber-400 shrink-0 min-h-[36px]"
              title="Probar envío de correo de prueba a sapaser@gmail.com"
            >
              <MailCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Prueba:</span>
              <span className="font-mono text-[11px] text-white">sapaser@gmail.com</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
