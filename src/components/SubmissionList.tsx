import React, { useState } from 'react';
import { 
  FileText, 
  Check, 
  Copy, 
  ChevronRight, 
  Play, 
  CheckSquare, 
  Square, 
  Sparkles,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface SubmissionListProps {
  submissions: StudentSubmission[];
  selectedId: string | null;
  selectedSubIds: string[];
  onToggleSelectSub: (id: string) => void;
  onSelectAllUnreviewed: () => void;
  onDeselectAll: () => void;
  onSelect: (id: string) => void;
  onEvaluateSingle: (id: string) => void;
  onEvaluateSelected: () => void;
  isProcessingId?: string;
  isBatchRunning?: boolean;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  submissions,
  selectedId,
  selectedSubIds,
  onToggleSelectSub,
  onSelectAllUnreviewed,
  onDeselectAll,
  onSelect,
  onEvaluateSingle,
  onEvaluateSelected,
  isProcessingId,
  isBatchRunning
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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Keine Einreichungen für diesen Turnus oder Filter vorhanden.
      </div>
    );
  }

  const selectedCount = selectedSubIds.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      
      {/* Selective Batch Selection Toolbar */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAllUnreviewed}
            className="font-medium text-blue-900 hover:text-blue-950 hover:underline"
          >
            Alle Unbewerteten auswählen
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-slate-500 hover:text-slate-800 hover:underline"
          >
            Auswahl aufheben
          </button>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-semibold">
            {selectedCount} von {submissions.length} ausgewählt
          </span>
        </div>

        <button
          type="button"
          disabled={selectedCount === 0 || isBatchRunning}
          onClick={onEvaluateSelected}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCount === 0 || isBatchRunning
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
          Ausgewählte auswerten ({selectedCount})
        </button>
      </div>

      {/* Submissions List */}
      <div className="divide-y divide-slate-100">
        {submissions.map((sub, index) => {
          const isSelected = sub.id === selectedId;
          const isChecked = selectedSubIds.includes(sub.id);
          const isBeingProcessed = sub.id === isProcessingId;
          const feedbackAvailable = !!(sub.editedFeedback || sub.generatedFeedback);
          const isAlreadyReviewed = sub.status === 'completed' || sub.status === 'approved';

          return (
            <div
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50/70 border-l-4 border-l-blue-900'
                  : isAlreadyReviewed && !isChecked
                  ? 'bg-slate-50/40 opacity-75 hover:opacity-100 hover:bg-slate-50'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              {/* Left: Checkbox, Index, Icon, Name & Meta */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Selective Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectSub(sub.id);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-900 rounded transition-colors"
                  title={isChecked ? 'Abwählen' : 'Für Stapelauswertung auswählen'}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-blue-900" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>

                <span className="text-xs font-semibold text-slate-400 w-5 text-right shrink-0">
                  {index + 1}
                </span>

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Freigegeben ✓
                      </span>
                    )}
                    {sub.status === 'completed' && (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Feedback bereit
                      </span>
                    )}
                    {sub.status === 'pending' && (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Ausstehend
                      </span>
                    )}
                    {sub.status === 'error' && (
                      <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Fehler
                      </span>
                    )}

                    {sub.problemCluster && (
                      <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {sub.problemCluster.category}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                    <span className="truncate max-w-[200px] sm:max-w-xs">{sub.rawFileName}</span>
                    <span>•</span>
                    <span>{sub.wordCount} Wörter</span>
                    {sub.moodleId && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 font-mono">ID: {sub.moodleId}</span>
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
    </div>
  );
};
