import React from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface BatchProgressModalProps {
  progress: ProcessingProgress;
  onCancel: () => void;
  rateLimitSecondsLeft: number;
}

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  progress,
  onCancel,
  rateLimitSecondsLeft
}) => {
  if (!progress.isProcessing) return null;

  const percentage = Math.round((progress.current / Math.max(1, progress.total)) * 100);
  const remainingCount = progress.total - progress.current;
  const estimatedSeconds = remainingCount * 5;
  const estMinutes = Math.floor(estimatedSeconds / 60);
  const estSecs = estimatedSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Stapelauswertung läuft...
              </h3>
              <p className="text-xs text-slate-500">
                Lerntagebücher werden mit Gemini Flash & Diversity Engine beurteilt
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Stapelverarbeitung abbrechen"
          >
            <XCircle className="w-5 h-5 text-rose-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">
              {progress.current} von {progress.total} Abgaben fertiggestellt
            </span>
            <span className="text-blue-900">{percentage}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-blue-900 via-indigo-700 to-amber-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Current Info */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Aktuelle Abgabe:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[200px]">
              {progress.currentStudentName || 'Wird vorbereitet...'}
            </span>
          </div>

          {progress.currentStepText && (
            <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 font-medium flex items-center gap-2 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-blue-700 animate-ping shrink-0" />
              <span className="truncate">{progress.currentStepText}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600">
            <span>Geschätzte Restzeit:</span>
            <span className="font-mono text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              ca. {estMinutes > 0 ? `${estMinutes}m ` : ''}{estSecs}s
            </span>
          </div>

          {rateLimitSecondsLeft > 0 && (
            <div className="pt-2 border-t border-slate-200 text-amber-700 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Free-Tier Pause: Nächste Abgabe in {rateLimitSecondsLeft}s...</span>
            </div>
          )}

          {progress.errorsCount > 0 && (
            <div className="pt-1 text-rose-600 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{progress.errorsCount} Einreichung(en) mit Warnung / Fehler</span>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
          >
            Abbrechen & Zwischenstand behalten
          </button>
        </div>

      </div>
    </div>
  );
};
