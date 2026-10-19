import React, { useState } from 'react';
import { 
  FileText, 
  Check, 
  Copy, 
  Clock, 
  Sparkles, 
  CheckSquare, 
  AlertCircle, 
  ChevronRight, 
  Play, 
  Edit3,
  ShieldAlert
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface SubmissionListProps {
  submissions: StudentSubmission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEvaluateSingle: (id: string) => void;
  isProcessingId?: string;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  submissions,
  selectedId,
  onSelect,
  onEvaluateSingle,
  isProcessingId
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, sub: StudentSubmission) => {
    e.stopPropagation();
    const textToCopy = sub.editedFeedback || sub.generatedFeedback;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(sub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Keine Einreichungen gefunden, die dem aktuellen Filter entsprechen.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
      {submissions.map((sub, index) => {
        const isSelected = sub.id === selectedId;
        const isBeingProcessed = sub.id === isProcessingId;
        const feedbackAvailable = !!(sub.editedFeedback || sub.generatedFeedback);

        return (
          <div
            key={sub.id}
            onClick={() => onSelect(sub.id)}
            className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-50/70 border-l-4 border-l-blue-900'
                : 'hover:bg-slate-50/80'
            }`}
          >
            {/* Left: Index, Icon, Name & Meta */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-semibold text-slate-400 w-5 text-right shrink-0">
                {index + 1}
              </span>

              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                sub.fileType === 'pdf'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {sub.studentName}
                  </h4>
                  {sub.status === 'approved' && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Freigegeben
                    </span>
                  )}
                  {sub.status === 'completed' && (
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Feedback bereit
                    </span>
                  )}
                  {sub.status === 'pending' && (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Ausstehend
                    </span>
                  )}
                  {sub.status === 'error' && (
                    <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Fehler
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                  <span className="truncate max-w-[200px] sm:max-w-xs">{sub.rawFileName}</span>
                  <span>•</span>
                  <span>{sub.wordCount} Wörter</span>
                  {sub.pseudonym && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400 italic">{sub.pseudonym}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {feedbackAvailable && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, sub)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copiedId === sub.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 border border-slate-200'
                  }`}
                  title="Feedback direkt kopieren (für Moodle-Kommentarfeld)"
                >
                  {copiedId === sub.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Kopieren
                    </>
                  )}
                </button>
              )}

              {sub.status === 'pending' && (
                <button
                  type="button"
                  disabled={isBeingProcessed}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEvaluateSingle(sub.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
                >
                  {isBeingProcessed ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                  )}
                  Auswerten
                </button>
              )}

              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-900 translate-x-0.5' : 'text-slate-300'}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
