import React, { useState } from 'react';
import { SubmissionRecord } from '../types/form';
import { QRCodeShareModal } from './QRCodeShareModal';
import {
  X,
  Download,
  Search,
  Trash2,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  Building,
  Calendar,
  FileSpreadsheet,
  CheckCircle,
  QrCode,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  submissions: SubmissionRecord[];
  onDeleteSubmission: (id: string) => void;
  onSelectSubmission: (record: SubmissionRecord) => void;
  sheetUrl?: string | null;
  onSyncAllToSheet?: () => void;
  isSyncingAll?: boolean;
}

export const SubmissionsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  submissions,
  onDeleteSubmission,
  onSelectSubmission,
  sheetUrl,
  onSyncAllToSheet,
  isSyncingAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [selectedQRSubmission, setSelectedQRSubmission] = useState<SubmissionRecord | null>(null);

  if (!isOpen) return null;

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.directorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.church.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.folio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesZone = zoneFilter === 'ALL' || sub.amapZone === zoneFilter;

    return matchesSearch && matchesZone;
  });

  const exportToCSV = () => {
    sounds.playClick();
    if (submissions.length === 0) return;

    const headers = [
      'Folio',
      'Fecha Registro',
      'Nombre Oficial del Club',
      'Año de Fundación',
      'Iglesia / Congregación',
      'Zona AMAP',
      'Pastor Distrital',
      'Director o Directora',
      'Teléfono de Contacto',
      'Correo Electrónico',
      'Tiene Logo',
      'Tiene Comprobante Pago',
      'Estado',
    ];

    const rows = submissions.map((s) => [
      `"${s.folio}"`,
      `"${new Date(s.createdAt).toLocaleString('es-ES')}"`,
      `"${(s.clubName || '').replace(/"/g, '""')}"`,
      `"${s.foundationYear || ''}"`,
      `"${(s.church || '').replace(/"/g, '""')}"`,
      `"Zona ${s.amapZone || ''}"`,
      `"${(s.districtPastor || '').replace(/"/g, '""')}"`,
      `"${(s.directorName || '').replace(/"/g, '""')}"`,
      `"${(s.contactPhone || '').replace(/"/g, '""')}"`,
      `"${(s.contactEmail || '').replace(/"/g, '""')}"`,
      `"${s.clubLogo ? 'Sí' : 'No'}"`,
      `"${s.paymentProof ? 'Sí' : 'No'}"`,
      `"${s.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Preinscripciones_Camporee_AMAP_2027_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-slate-900 border-l border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Bandeja de Preinscripciones
              </h3>
              <p className="text-xs text-slate-400">
                {submissions.length} clubes registrados para el VII Camporee AMAP 2027
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors"
                title="Abrir hoja de cálculo oficial en Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Abrir Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {onSyncAllToSheet && (
              <button
                type="button"
                onClick={onSyncAllToSheet}
                disabled={isSyncingAll || submissions.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-40 transition-colors"
                title="Sincronizar todos los registros locales a Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar todo'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportToCSV}
              disabled={submissions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-40 shadow transition-all cursor-pointer"
              title="Descargar tabla en formato CSV compatible con Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por club, director, iglesia o folio..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Zones tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Zona:</span>
            {['ALL', '1', '2', '3', '4'].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoneFilter(z)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  zoneFilter === z
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {z === 'ALL' ? 'Todas' : `Zona ${z}`}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
              <Shield className="w-12 h-12 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No se encontraron preinscripciones</p>
              <p className="text-xs text-slate-500 mt-1">
                {submissions.length === 0
                  ? 'Completa el formulario para registrar el primer club.'
                  : 'Intenta con otro término de búsqueda o filtro de zona.'}
              </p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-amber-500/50 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {sub.clubLogo ? (
                      <img
                        src={sub.clubLogo}
                        alt={sub.clubName}
                        className="h-12 w-12 rounded-xl object-contain bg-slate-900 border border-slate-700 p-1 shrink-0 shadow"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
                        <Shield className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{sub.clubName}</h4>
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          Zona {sub.amapZone}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-500" />
                        {sub.church} • Fundado en {sub.foundationYear}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-amber-400 block">
                      {sub.folio}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(sub.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                {/* Sub details */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80 text-slate-300">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Director(a):</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {sub.directorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Pastor Distrital:</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {sub.districtPastor}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 truncate text-slate-400">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{sub.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate text-slate-400">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{sub.contactEmail}</span>
                  </div>
                </div>

                {/* Footer card actions */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    {sub.paymentProof ? (
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(sub.paymentProof)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Ver comprobante</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Sin comprobante</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedQRSubmission(sub);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-bold text-slate-200 transition-colors"
                      title="Generar y descargar código QR para este club"
                    >
                      <QrCode className="w-3 h-3 text-amber-400" />
                      <span>QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectSubmission(sub);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition-colors"
                      title="Ver credencial y ficha oficial"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ver Credencial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar la preinscripción del club ${sub.clubName}?`)) {
                          onDeleteSubmission(sub.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal viewer for receipt */}
        {viewingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-xl w-full bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-bold text-white">Comprobante de Pago Adjunto</span>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 max-h-[70vh] overflow-auto flex items-center justify-center">
                <img
                  src={viewingReceipt}
                  alt="Comprobante de pago"
                  className="max-h-[65vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal viewer for QR Code */}
        {selectedQRSubmission && (
          <QRCodeShareModal
            isOpen={!!selectedQRSubmission}
            onClose={() => setSelectedQRSubmission(null)}
            submission={selectedQRSubmission}
          />
        )}
      </div>
    </div>
  );
};
