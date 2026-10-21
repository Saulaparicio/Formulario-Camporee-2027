import React, { useState, useEffect, useRef } from 'react';
import { FormStepConfig, ClubFormData } from '../types/form';
import { FORM_STEPS } from '../data/formConfig';
import { FileUploadField } from './FileUploadField';
import { sounds } from '../utils/audio';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Flame,
  Volume2,
  Shield,
  Eye,
  RotateCcw,
  Compass,
  MapPin,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  Receipt,
  FileCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  formData: ClubFormData;
  updateField: (field: keyof ClubFormData, val: any, fileName?: string) => void;
  onComplete: () => void;
  onOpenReview: () => void;
  onReset: () => void;
}

export function getEmailRealtimeValidation(email: string): {
  status: 'empty' | 'invalid' | 'valid';
  message: string;
} {
  const trimmed = email.trim();
  if (!trimmed) {
    return { status: 'empty', message: '' };
  }
  if (!trimmed.includes('@')) {
    return {
      status: 'invalid',
      message: 'Falta incluir el símbolo "@" (ej. director@club.org)',
    };
  }
  const parts = trimmed.split('@');
  if (parts.length > 2) {
    return {
      status: 'invalid',
      message: 'El correo no puede tener más de un símbolo "@"',
    };
  }
  const [local, domain] = parts;
  if (!local) {
    return {
      status: 'invalid',
      message: 'Falta el nombre de usuario antes del "@"',
    };
  }
  if (!domain) {
    return {
      status: 'invalid',
      message: 'Escribe el dominio después del "@" (ej. gmail.com)',
    };
  }
  if (!domain.includes('.')) {
    return {
      status: 'invalid',
      message: 'Falta la extensión del dominio (ej. .com, .org, .pa)',
    };
  }
  const ext = domain.split('.').pop() || '';
  if (ext.length < 2) {
    return {
      status: 'invalid',
      message: 'La extensión del dominio debe tener al menos 2 letras (ej. .com)',
    };
  }
  const fullEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!fullEmailRegex.test(trimmed)) {
    return {
      status: 'invalid',
      message: 'Verifica los caracteres del correo electrónico',
    };
  }
  return {
    status: 'valid',
    message: 'Formato de correo electrónico válido',
  };
}

export function getPhoneRealtimeValidation(phone: string): {
  status: 'empty' | 'invalid' | 'valid';
  message: string;
} {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { status: 'empty', message: '' };
  }
  if (!/^[0-9+\s\-()]+$/.test(trimmed)) {
    return {
      status: 'invalid',
      message: 'Solo se admiten números, espacios, guiones y el signo "+"',
    };
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 0) {
    return {
      status: 'invalid',
      message: 'Ingresa los números del teléfono de contacto',
    };
  }
  if (digitsOnly.length < 7) {
    return {
      status: 'invalid',
      message: `Número incompleto (${digitsOnly.length} de mín. 7 u 8 dígitos requeridos)`,
    };
  }
  if (digitsOnly.length > 15) {
    return {
      status: 'invalid',
      message: 'El número supera la longitud estándar recomendada (máx. 15 dígitos)',
    };
  }
  return {
    status: 'valid',
    message: 'Número de teléfono con formato válido',
  };
}

export const ConversationalForm: React.FC<Props> = ({
  formData,
  updateField,
  onComplete,
  onOpenReview,
  onReset,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep: FormStepConfig = FORM_STEPS[currentStepIndex];
  const totalSteps = FORM_STEPS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Auto-focus input on step change
  useEffect(() => {
    setError(null);
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [currentStepIndex]);

  // Read prompt aloud using Web Speech API
  const speakCurrentPrompt = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${currentStep.questionTitle}. ${currentStep.conversationalPrompt}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const validateCurrentStep = (): boolean => {
    const value = formData[currentStep.id];
    if (currentStep.validationFn) {
      const err = currentStep.validationFn(value);
      if (err) {
        setError(err);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    sounds.playStepForward();
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed all steps
      sounds.playSuccess();
      onComplete();
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStepIndex > 0) {
      sounds.playClick();
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep.type !== 'select') {
      e.preventDefault();
      handleNext();
    }
  };

  // Section badge color
  const getSectionBadge = () => {
    switch (currentStep.section) {
      case 'A':
        return { label: 'Datos del Club', color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30' };
      case 'B':
        return { label: 'Datos del Director(a)', color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30' };
      case 'D':
        return { label: 'Documentos y Pago', color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30' };
    }
  };

  const sectionMeta = getSectionBadge();

  // Helper icons for each step
  const getStepIcon = () => {
    switch (currentStep.id) {
      case 'clubName':
        return <Shield className="w-5 h-5 text-amber-400" />;
      case 'foundationYear':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'clubLogo':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'church':
        return <Building className="w-5 h-5 text-amber-400" />;
      case 'amapZone':
        return <MapPin className="w-5 h-5 text-amber-400" />;
      case 'districtPastor':
        return <User className="w-5 h-5 text-amber-400" />;
      case 'directorName':
        return <User className="w-5 h-5 text-blue-400" />;
      case 'contactPhone':
        return <Phone className="w-5 h-5 text-blue-400" />;
      case 'contactEmail':
        return <Mail className="w-5 h-5 text-blue-400" />;
      case 'paymentProof':
        return <Receipt className="w-5 h-5 text-emerald-400" />;
      default:
        return <Compass className="w-5 h-5 text-amber-400" />;
    }
  };

  // Quick email domain buttons for fast input
  const emailDomains = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com'];

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Decorative celestial sky & golden glow backdrop from official logo */}
      <div className="absolute -top-16 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/20 via-sky-500/15 to-yellow-500/10 blur-3xl pointer-events-none" />

      {/* Progress & Top Navigation */}
      <div className="mb-6 rounded-2xl bg-slate-900/85 p-4 border border-amber-500/25 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${sectionMeta.color}`}>
              {getStepIcon()}
              <span>{sectionMeta.label}</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Paso {currentStepIndex + 1} de {totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenReview}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
              title="Ver resumen de respuestas cargadas"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Resumen</span>
            </button>
            <span className="text-xs font-black text-amber-400">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar with Gold to Celestial Sky gradient */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90 border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-sky-400 transition-all duration-300 ease-out shadow-sm shadow-amber-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Interactive Conversational Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Guía Conversacional Header with official Camporee emblem */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-sky-500/15 to-slate-900 p-1 border-2 border-amber-400/50 shadow-lg shadow-amber-500/20">
              <img
                src="/assets/aistudio/logo_preparados_para_su_regreso_transparente_b4357a91.png"
                alt="Logo Oficial Camporee"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold ring-2 ring-slate-900 shadow">
              ✓
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Guía Camporee AMAP 2027
                </span>
                <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                  «Preparados Para Su Regreso»
                </span>
              </div>

              {/* TTS Audio narration button */}
              {'speechSynthesis' in window && (
                <button
                  type="button"
                  onClick={speakCurrentPrompt}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                    isSpeaking
                      ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Escuchar pregunta en voz alta"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{isSpeaking ? 'Leyendo...' : 'Escuchar'}</span>
                </button>
              )}
            </div>

            {/* Conversational Speech Bubble */}
            <div className="mt-1.5 rounded-2xl rounded-tl-sm bg-slate-800/80 p-4 border border-slate-700/60 shadow-inner">
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                {currentStep.conversationalPrompt}
              </p>
            </div>
          </div>
        </div>

        {/* Question Title & Input Zone */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            {currentStep.questionTitle}{' '}
            {currentStep.required && <span className="text-amber-400 font-bold">*</span>}
          </label>

          {/* Render Controls by Type */}
          {currentStep.type === 'text' && (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={formData[currentStep.id] || ''}
                onChange={(e) => updateField(currentStep.id, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentStep.placeholder}
                className="w-full rounded-2xl border-2 border-slate-700 bg-slate-950/70 px-4 py-3.5 text-base sm:text-lg text-white placeholder-slate-500 shadow-inner transition-all focus:border-amber-400 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-500/20"
              />
            </div>
          )}

          {currentStep.type === 'email' && (() => {
            const emailValidation = getEmailRealtimeValidation(formData.contactEmail || '');
            return (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="email"
                    value={formData[currentStep.id] || ''}
                    onChange={(e) => {
                      updateField(currentStep.id, e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep.placeholder}
                    className={`w-full rounded-2xl border-2 bg-slate-950/70 px-4 py-3.5 pr-11 text-base sm:text-lg text-white placeholder-slate-500 shadow-inner transition-all focus:bg-slate-900 focus:outline-none focus:ring-4 ${
                      emailValidation.status === 'valid'
                        ? 'border-emerald-500/70 focus:border-emerald-400 focus:ring-emerald-500/20'
                        : emailValidation.status === 'invalid'
                        ? 'border-amber-400/80 focus:border-amber-400 focus:ring-amber-500/25'
                        : 'border-slate-700 focus:border-amber-400 focus:ring-amber-500/20'
                    }`}
                  />

                  {/* Real-time status icon indicator */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {emailValidation.status === 'valid' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 transition-opacity" />
                    )}
                    {emailValidation.status === 'invalid' && (
                      <AlertCircle className="w-5 h-5 text-amber-400 transition-opacity" />
                    )}
                  </div>
                </div>

                {/* Subtle Real-time Notification Banner */}
                {emailValidation.status === 'invalid' && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-300 transition-all">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{emailValidation.message}</span>
                  </div>
                )}

                {emailValidation.status === 'valid' && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{emailValidation.message}</span>
                  </div>
                )}

                {/* Quick domain autofill tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-xs text-slate-400 font-medium mr-1">Rápido:</span>
                  {emailDomains.map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => {
                        const cur = formData.contactEmail || '';
                        if (!cur.includes('@')) {
                          updateField('contactEmail', cur + dom);
                        } else {
                          const name = cur.split('@')[0];
                          updateField('contactEmail', name + dom);
                        }
                        if (error) setError(null);
                        sounds.playClick();
                      }}
                      className="rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-semibold text-amber-300/90 transition-colors cursor-pointer"
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {currentStep.type === 'phone' && (() => {
            const phoneValidation = getPhoneRealtimeValidation(formData.contactPhone || '');
            return (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="tel"
                    value={formData[currentStep.id] || ''}
                    onChange={(e) => {
                      updateField(currentStep.id, e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep.placeholder}
                    className={`w-full rounded-2xl border-2 bg-slate-950/70 px-4 py-3.5 pr-11 text-base sm:text-lg text-white placeholder-slate-500 shadow-inner transition-all focus:bg-slate-900 focus:outline-none focus:ring-4 ${
                      phoneValidation.status === 'valid'
                        ? 'border-emerald-500/70 focus:border-emerald-400 focus:ring-emerald-500/20'
                        : phoneValidation.status === 'invalid'
                        ? 'border-amber-400/80 focus:border-amber-400 focus:ring-amber-500/25'
                        : 'border-slate-700 focus:border-amber-400 focus:ring-amber-500/20'
                    }`}
                  />

                  {/* Real-time status icon indicator */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {phoneValidation.status === 'valid' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 transition-opacity" />
                    )}
                    {phoneValidation.status === 'invalid' && (
                      <AlertCircle className="w-5 h-5 text-amber-400 transition-opacity" />
                    )}
                  </div>
                </div>

                {/* Subtle Real-time Notification Banner */}
                {phoneValidation.status === 'invalid' && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-300 transition-all">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{phoneValidation.message}</span>
                  </div>
                )}

                {phoneValidation.status === 'valid' && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{phoneValidation.message}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Select: Zona AMAP interactive cards */}
          {currentStep.id === 'amapZone' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentStep.options?.map((opt) => {
                const isSelected = formData.amapZone === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateField('amapZone', opt.value);
                      sounds.playClick();
                      // Auto advance with tiny pleasant delay
                      setTimeout(() => {
                        if (currentStepIndex < totalSteps - 1) {
                          setCurrentStepIndex((prev) => prev + 1);
                        }
                      }, 250);
                    }}
                    className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/15'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-base transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      Z{opt.value}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-base">{opt.label}</span>
                        {isSelected && <Check className="w-5 h-5 text-amber-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Select: Foundation Year with Quick Filter presets */}
          {currentStep.id === 'foundationYear' && (
            <div className="space-y-4">
              {/* Popular quick chips */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-400">Años sugeridos:</span>
                {['2026', '2025', '2024', '2020', '2015', '2010', '2005', '2000', '1995', '1990'].map(
                  (yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        updateField('foundationYear', yr);
                        sounds.playClick();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        formData.foundationYear === yr
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {yr}
                    </button>
                  )
                )}
              </div>

              {/* Full select dropdown */}
              <div>
                <select
                  value={formData.foundationYear || ''}
                  onChange={(e) => {
                    updateField('foundationYear', e.target.value);
                    sounds.playClick();
                  }}
                  className="w-full rounded-2xl border-2 border-slate-700 bg-slate-950/80 px-4 py-3.5 text-base sm:text-lg text-white shadow-inner transition-all focus:border-amber-400 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-500/20"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- Selecciona el año de fundación (1950 - 2026) --
                  </option>
                  {currentStep.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                      Año {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* File Upload for Club Logo */}
          {currentStep.id === 'clubLogo' && (
            <FileUploadField
              value={formData.clubLogo}
              fileName={formData.clubLogoName}
              label="Logo del club"
              helperText={currentStep.helperText}
              error={error}
              onChange={(base64, name) => updateField('clubLogo', base64, name)}
            />
          )}

          {/* File Upload for Payment Proof */}
          {currentStep.id === 'paymentProof' && (
            <FileUploadField
              value={formData.paymentProof}
              fileName={formData.paymentProofName}
              label="Comprobante de pago"
              helperText={currentStep.helperText}
              error={error}
              onChange={(base64, name) => updateField('paymentProof', base64, name)}
            />
          )}

          {/* Helper instructions */}
          {currentStep.helperText && currentStep.type !== 'file' && (
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
              {currentStep.helperText}
            </p>
          )}

          {/* Validation error message */}
          {error && currentStep.type !== 'file' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-2 text-sm text-red-400">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Bottom Actions: Previous / Next buttons */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                title="Limpiar formulario"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentStepIndex === totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-6 py-3.5 text-base font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <FileCheck className="w-5 h-5 text-slate-950" />
                <span>Revisar y Enviar Preinscripción</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3.5 text-base font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </button>
            )}
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="mt-4 hidden sm:flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span>Pulsa</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300 border border-slate-700">
            Enter ↵
          </kbd>
          <span>para avanzar</span>
        </div>
      </div>
    </div>
  );
};
