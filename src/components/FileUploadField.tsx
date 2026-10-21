import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, Image as ImageIcon, FileText } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  value: string | null;
  fileName?: string;
  onChange: (base64: string | null, fileName?: string) => void;
  accept?: string;
  label: string;
  helperText?: string;
  error?: string | null;
}

export const FileUploadField: React.FC<Props> = ({
  value,
  fileName,
  onChange,
  accept = 'image/png,image/jpeg,image/webp,application/pdf',
  label,
  helperText,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileProcess = (file: File) => {
    if (!file) return;

    // Check size (< 6MB)
    if (file.size > 6 * 1024 * 1024) {
      alert('El archivo supera los 6MB. Por favor sube una imagen o archivo más ligero.');
      return;
    }

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChange(result, file.name);
      setProcessing(false);
      sounds.playClick();
    };
    reader.onerror = () => {
      setProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const isPDF = fileName?.toLowerCase().endsWith('.pdf') || value?.startsWith('data:application/pdf');

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-slate-800/80 p-4 shadow-xl backdrop-blur-md transition-all">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center">
              {isPDF ? (
                <div className="flex flex-col items-center justify-center text-amber-400">
                  <FileText className="w-10 h-10 mb-1" />
                  <span className="text-xs font-semibold uppercase">PDF</span>
                </div>
              ) : (
                <img
                  src={value}
                  alt={label}
                  className="h-full w-full object-contain p-1"
                />
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Archivo cargado con éxito</span>
              </div>
              <p className="font-medium text-slate-100 truncate text-sm sm:text-base">
                {fileName || 'documento-adjunto.png'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Listo para la verificación de AMAP</p>

              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-slate-700/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                >
                  Cambiar archivo
                </button>
                <button
                  type="button"
                  onClick={() => onChange(null, '')}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 text-xs font-medium transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Quitar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : error
              ? 'border-red-400/80 bg-red-500/5 hover:border-red-400'
              : 'border-slate-700 hover:border-amber-400/70 bg-slate-800/40 hover:bg-slate-800/70'
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 transition-transform group-hover:scale-110 group-hover:bg-amber-500/20 shadow-inner">
            {processing ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            ) : (
              <Upload className="h-7 w-7" />
            )}
          </div>

          <h4 className="text-base font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
            Haz clic para subir o arrastra tu archivo aquí
          </h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {helperText || 'Formatos admitidos: PNG, JPG o WEBP (máx. 5MB)'}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-300/90 border border-slate-700 shadow-sm">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Seleccionar desde este dispositivo</span>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
};
