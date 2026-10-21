import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, Image as ImageIcon, FileText, Camera, AlertCircle } from 'lucide-react';
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
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFileProcess = (file: File) => {
    if (!file) return;
    setSizeError(null);

    // Check size (< 6MB)
    if (file.size > 6 * 1024 * 1024) {
      setSizeError('El archivo supera los 6MB. Por favor sube una imagen o archivo más ligero.');
      sounds.playError();
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
      setSizeError('No se pudo leer el archivo. Intenta de nuevo.');
      sounds.playError();
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
    <div className="w-full space-y-2">
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

      {sizeError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{sizeError}</span>
        </div>
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-slate-800/80 p-3.5 sm:p-4 shadow-xl backdrop-blur-md transition-all">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shadow-inner">
              {isPDF ? (
                <div className="flex flex-col items-center justify-center text-amber-400 p-2">
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

            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Archivo cargado con éxito</span>
              </div>
              <p className="font-medium text-slate-100 truncate text-sm sm:text-base">
                {fileName || 'documento-adjunto.png'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Listo para la verificación de AMAP</p>

              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-slate-700/80 hover:bg-slate-700 px-4 py-2.5 sm:py-1.5 text-xs font-semibold text-slate-200 transition-colors min-h-[44px] sm:min-h-[36px] flex items-center justify-center cursor-pointer"
                >
                  Cambiar archivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(null, '');
                    sounds.playClick();
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2.5 sm:py-1.5 text-xs font-semibold transition-colors min-h-[44px] sm:min-h-[36px] cursor-pointer"
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
          className={`cursor-pointer group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : error
              ? 'border-red-400/80 bg-red-500/5 hover:border-red-400'
              : 'border-slate-700 hover:border-amber-400/70 bg-slate-800/40 hover:bg-slate-800/70'
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 transition-transform group-hover:scale-110 group-hover:bg-amber-500/20 shadow-inner">
            {processing ? (
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent animate-spin rounded-full" />
            ) : (
              <Camera className="w-7 h-7 sm:hidden" />
            )}
            {!processing && <Upload className="hidden sm:block w-7 h-7" />}
          </div>

          <p className="text-sm sm:text-base font-bold text-white mb-1">
            <span className="sm:hidden">Toca para tomar foto o elegir archivo</span>
            <span className="hidden sm:inline">Arrastra aquí o haz clic para subir</span>
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            Formatos admitidos: PNG, JPG, WEBP o PDF (máx. 6MB)
          </p>

          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 group-hover:text-amber-300 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors pointer-events-none min-h-[40px]"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Seleccionar desde este dispositivo</span>
          </button>
        </div>
      )}

      {helperText && !value && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}

      {error && !value && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
