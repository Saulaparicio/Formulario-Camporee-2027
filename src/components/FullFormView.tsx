import React from 'react';
import { ClubFormData } from '../types/form';
import { FOUNDATION_YEARS, AMAP_ZONES } from '../data/formConfig';
import { FileUploadField } from './FileUploadField';
import { ConquistadoresLogo } from './ConquistadoresLogo';
import { Shield, User, FileText, Send, CheckCircle, AlertCircle, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getEmailRealtimeValidation, getPhoneRealtimeValidation } from './ConversationalForm';

interface Props {
  formData: ClubFormData;
  updateField: (field: keyof ClubFormData, val: any, fileName?: string) => void;
  onSubmit: () => void;
  errors: Record<string, string>;
}

export const FullFormView: React.FC<Props> = ({
  formData,
  updateField,
  onSubmit,
  errors,
}) => {
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <ConquistadoresLogo size="xl" className="shrink-0 drop-shadow-xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                VII Camporee AMAP 2027
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-400/30 px-3 py-1 text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                «Preparados Para Su Regreso»
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              Preinscripción del club – VII Camporee AMAP 2027
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
              Completa los datos del club y del director, verifica los documentos y envía tu preinscripción antes del{' '}
              <span className="font-bold text-amber-300 underline decoration-amber-500/50">
                30 de octubre de 2026
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      {hasErrors && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300 flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Hay campos pendientes por completar o corregir:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-red-200">
              {Object.values(errors).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SECCIÓN A: Datos del club */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Parte 1</span>
            <h3 className="text-xl font-bold text-white font-display">Sección A. Datos del club</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre oficial del club */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Nombre oficial del club <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={formData.clubName}
              onChange={(e) => updateField('clubName', e.target.value)}
              placeholder="Ej. Club de Conquistadores Orión"
              className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                errors.clubName ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.clubName && <p className="mt-1 text-xs text-red-400">{errors.clubName}</p>}
          </div>

          {/* Año de fundación del club */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Año de fundación del club <span className="text-amber-400">*</span>
            </label>
            <select
              value={formData.foundationYear}
              onChange={(e) => updateField('foundationYear', e.target.value)}
              className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                errors.foundationYear ? 'border-red-500' : 'border-slate-700'
              }`}
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Seleccione el año
              </option>
              {FOUNDATION_YEARS.map((y) => (
                <option key={y.value} value={y.value} className="bg-slate-900 text-white">
                  {y.label}
                </option>
              ))}
            </select>
            {errors.foundationYear && (
              <p className="mt-1 text-xs text-red-400">{errors.foundationYear}</p>
            )}
          </div>

          {/* Zona AMAP */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Zona AMAP <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AMAP_ZONES.map((zone) => {
                const isSelected = formData.amapZone === zone.value;
                return (
                  <button
                    key={zone.value}
                    type="button"
                    onClick={() => {
                      updateField('amapZone', zone.value);
                      sounds.playClick();
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-md'
                        : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm">Zona {zone.value}</span>
                  </button>
                );
              })}
            </div>
            {errors.amapZone && <p className="mt-1 text-xs text-red-400">{errors.amapZone}</p>}
          </div>

          {/* Iglesia / congregación */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Iglesia / congregación <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={formData.church}
              onChange={(e) => updateField('church', e.target.value)}
              placeholder="Ej. Iglesia Adventista Central"
              className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                errors.church ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.church && <p className="mt-1 text-xs text-red-400">{errors.church}</p>}
          </div>

          {/* Nombre del pastor distrital */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Nombre del pastor distrital <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={formData.districtPastor}
              onChange={(e) => updateField('districtPastor', e.target.value)}
              placeholder="Ej. Pr. Carlos Ramírez"
              className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                errors.districtPastor ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.districtPastor && (
              <p className="mt-1 text-xs text-red-400">{errors.districtPastor}</p>
            )}
          </div>

          {/* Logo del club */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Logo del club <span className="text-amber-400">*</span>
            </label>
            <FileUploadField
              value={formData.clubLogo}
              fileName={formData.clubLogoName}
              label="Logo del club"
              error={errors.clubLogo}
              onChange={(base64, name) => updateField('clubLogo', base64, name)}
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN B: Datos del director o directora */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Parte 2</span>
            <h3 className="text-xl font-bold text-white font-display">
              Sección B. Datos del director o directora
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre completo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Nombre completo del director o directora <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={formData.directorName}
              onChange={(e) => updateField('directorName', e.target.value)}
              placeholder="Ej. Roberto Sánchez Méndez"
              className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                errors.directorName ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {errors.directorName && (
              <p className="mt-1 text-xs text-red-400">{errors.directorName}</p>
            )}
          </div>

          {/* Teléfono de contacto */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Teléfono de contacto <span className="text-amber-400">*</span>
            </label>
            {(() => {
              const phoneVal = getPhoneRealtimeValidation(formData.contactPhone || '');
              return (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      placeholder="Favor ingrese un número de teléfono válido"
                      className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 pr-10 text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 ${
                        errors.contactPhone
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : phoneVal.status === 'valid'
                          ? 'border-emerald-500/70 focus:border-emerald-400 focus:ring-emerald-500/20'
                          : phoneVal.status === 'invalid'
                          ? 'border-amber-400/80 focus:border-amber-400 focus:ring-amber-500/20'
                          : 'border-slate-700 focus:border-amber-400 focus:ring-amber-500/20'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {phoneVal.status === 'valid' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {phoneVal.status === 'invalid' && (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </div>
                  {phoneVal.status === 'invalid' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{phoneVal.message}</span>
                    </div>
                  )}
                  {phoneVal.status === 'valid' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{phoneVal.message}</span>
                    </div>
                  )}
                  {phoneVal.status === 'empty' && (
                    <p className="text-xs text-slate-400">Favor ingrese un número de teléfono válido (ej. +507 6123-4567).</p>
                  )}
                  {errors.contactPhone && (
                    <p className="text-xs text-red-400">{errors.contactPhone}</p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Correo electrónico */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              Correo electrónico <span className="text-amber-400">*</span>
            </label>
            {(() => {
              const emailVal = getEmailRealtimeValidation(formData.contactEmail || '');
              return (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      placeholder="ejemplo@ejemplo.com"
                      className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 pr-10 text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 ${
                        errors.contactEmail
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : emailVal.status === 'valid'
                          ? 'border-emerald-500/70 focus:border-emerald-400 focus:ring-emerald-500/20'
                          : emailVal.status === 'invalid'
                          ? 'border-amber-400/80 focus:border-amber-400 focus:ring-amber-500/20'
                          : 'border-slate-700 focus:border-amber-400 focus:ring-amber-500/20'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {emailVal.status === 'valid' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {emailVal.status === 'invalid' && (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </div>
                  {emailVal.status === 'invalid' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{emailVal.message}</span>
                    </div>
                  )}
                  {emailVal.status === 'valid' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{emailVal.message}</span>
                    </div>
                  )}
                  {emailVal.status === 'empty' && (
                    <p className="text-xs text-slate-400">ejemplo@ejemplo.com</p>
                  )}
                  {errors.contactEmail && (
                    <p className="text-xs text-red-400">{errors.contactEmail}</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* SECCIÓN D: Documentos y pago */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Parte 3</span>
            <h3 className="text-xl font-bold text-white font-display">
              Sección D. Documentos y pago
            </h3>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
            Comprobante de pago <span className="text-amber-400">*</span>
          </label>
          <FileUploadField
            value={formData.paymentProof}
            fileName={formData.paymentProofName}
            label="Comprobante de pago"
            error={errors.paymentProof}
            helperText="Sube la foto del comprobante bancario, depósito o transferencia de preinscripción."
            onChange={(base64, name) => updateField('paymentProof', base64, name)}
          />
        </div>
      </section>

      {/* Submit Button Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Todos los datos son tratados con fines exclusivos de organización AMAP 2027.</span>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onSubmit();
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-8 py-4 text-base font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/20 cursor-pointer"
        >
          <Send className="w-5 h-5" />
          <span>Enviar preinscripción</span>
        </button>
      </div>
    </div>
  );
};
