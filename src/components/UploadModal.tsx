import React, { useEffect } from 'react';
import { X, Sparkles, ShieldCheck, FilePlus2 } from 'lucide-react';
import { TurnusId } from '../types';
import { UploadZone } from './UploadZone';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTurnus: TurnusId;
  onFilesSelected: (items: { file: File; relativePath: string }[] | FileList | File[]) => void;
  isLoading: boolean;
  progressText?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  activeTurnus,
  onFilesSelected,
  isLoading,
  progressText
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-slate-50/50">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#002f5d] text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#ae9a63]" />
                {activeTurnus.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Inkrementeller Schutz aktiv
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-[#002f5d]" />
              <span>Abgaben zu {activeTurnus.toUpperCase()} nachladen</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Für Nachzüglerinnen und Nachzügler oder aktualisierte Moodle-Archive.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 disabled:opacity-40"
            title="Schließen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Safeguard banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-900">
                Bestehende Gutachten bleiben zu 100 % geschützt
              </p>
              <p className="text-amber-800/90">
                Bereits bewertete oder freigegebene Studierende in {activeTurnus.toUpperCase()} werden niemals überschrieben. Nur neue Abgaben werden ergänzt.
              </p>
            </div>
          </div>

          {/* Embedded UploadZone */}
          <UploadZone
            onItemsSelected={(items) => {
              onFilesSelected(items);
              onClose();
            }}
            isLoading={isLoading}
            progressText={progressText}
          />

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <p className="text-[11px] text-slate-400">
            Unterstützt: Einzelne PDF/DOCX-Dateien, ganze Moodle-Ordner & .zip-Archive
          </p>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Abbrechen
          </button>
        </div>

      </div>
    </div>
  );
};
