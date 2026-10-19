import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckSquare, 
  Download, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { StudentSubmission, EvaluationSettings } from '../types';
import { DIVERSITY_ANGLES, ANTI_AI_BLACKLIST } from '../services/geminiService';

interface SplitScreenWorkspaceProps {
  submission: StudentSubmission;
  settings: EvaluationSettings;
  onUpdateFeedback: (id: string, newFeedback: string) => void;
  onApprove: (id: string) => void;
  onRegenerate: (id: string, angleIndex: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
  isRegenerating: boolean;
}

export const SplitScreenWorkspace: React.FC<SplitScreenWorkspaceProps> = ({
  submission,
  settings,
  onUpdateFeedback,
  onApprove,
  onRegenerate,
  onNavigate,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
  isRegenerating
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedAngle, setSelectedAngle] = useState(submission.angleIndex ?? 0);
  const [showAngleMenu, setShowAngleMenu] = useState(false);

  const currentFeedback = submission.editedFeedback || submission.generatedFeedback || '';

  // Calculate sentence count
  const countSentences = (text: string) => {
    if (!text.trim()) return 0;
    // Matches sentences ending with . ! ? followed by space or newline
    const matches = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    return matches ? matches.length : 1;
  };

  const sentenceCount = countSentences(currentFeedback);

  // Check for anti-AI blacklist triggers
  const detectedCliches = ANTI_AI_BLACKLIST.filter(cliche => 
    currentFeedback.toLowerCase().includes(cliche.toLowerCase())
  );

  const handleCopy = () => {
    if (!currentFeedback) return;
    navigator.clipboard.writeText(currentFeedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateFeedback(submission.id, e.target.value);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Bar: Navigation & Student Title */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => onNavigate('prev')}
              disabled={!hasPrev}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                hasPrev ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Vorherige Abgabe (Pfeiltaste links)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-600">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              onClick={() => onNavigate('next')}
              disabled={!hasNext}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                hasNext ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Nächste Abgabe (Pfeiltaste rechts)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              {submission.studentName}
              {submission.status === 'approved' && (
                <span className="text-xs font-normal bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Freigegeben
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {submission.rawFileName} • {submission.wordCount} Wörter
            </p>
          </div>
        </div>

        {/* Action Controls for Workbench */}
        <div className="flex items-center gap-2">
          {currentFeedback && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'In Moodle kopiert!' : 'Feedback kopieren'}
              </button>

              <button
                type="button"
                onClick={() => onApprove(submission.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  submission.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                {submission.status === 'approved' ? 'Freigegeben ✓' : 'Als geprüft markieren'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Split-Screen Workspace (Responsive: Stacks on mobile, 50:50 on tablet/laptop, wide on 2xl) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Linke Spalte: Originaltext der Abgabe */}
        <div className="lg:col-span-6 xl:col-span-6 p-4 sm:p-6 flex flex-col bg-slate-50/40">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Originaltext des Lerntagebuchs
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ca. {Math.max(1, Math.round(submission.wordCount / 350))} Seiten
            </span>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto max-h-[550px] shadow-2xs font-serif text-sm leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-amber-100">
            {submission.rawText || (
              <span className="text-slate-400 italic font-sans">
                (Kein Text extrahiert oder Dokument war leer.)
              </span>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Tims Dozenten-Feedback */}
        <div className="lg:col-span-6 xl:col-span-6 p-4 sm:p-6 flex flex-col bg-white">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Dozenten-Feedback (Tim)
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                sentenceCount <= settings.maxSentences
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {sentenceCount} / max. {settings.maxSentences} Sätze
              </span>
            </div>

            {/* Diversity Angle Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAngleMenu(!showAngleMenu)}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                title="Einstiegsperspektive variieren"
              >
                <SlidersHorizontal className="w-3 h-3 text-blue-700" />
                <span>{DIVERSITY_ANGLES[selectedAngle]?.name.split('&')[0]}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showAngleMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-20 space-y-1 animate-fadeIn">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                    Einstiegs-Perspektive wählen:
                  </div>
                  {DIVERSITY_ANGLES.map((angle, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAngle(idx);
                        setShowAngleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedAngle === idx
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <p className="font-medium">{angle.name}</p>
                      <p className="text-[10px] text-slate-500 font-normal truncate">{angle.instruction}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Editor Textarea */}
          <div className="flex-1 flex flex-col relative">
            <textarea
              value={currentFeedback}
              onChange={handleTextChange}
              placeholder="Hier erscheint Tims persönliches Feedback zur Abgabe. Du kannst den Text vor dem Kopieren jederzeit frei bearbeiten..."
              className="w-full flex-1 p-4 bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl resize-none text-sm leading-relaxed text-slate-900 font-sans transition-all min-h-[380px]"
            />

            {/* Diversity & Anti-AI Live Audit */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {detectedCliches.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Natürlich (Keine KI-Floskeln)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Floskel erkannt: "{detectedCliches[0]}"
                  </span>
                )}

                {currentFeedback.includes(settings.signOff) && (
                  <span className="text-slate-400 font-medium">
                    ✓ Signatur vorhanden
                  </span>
                )}
              </div>

              {/* Neu generieren Button */}
              <button
                type="button"
                disabled={isRegenerating}
                onClick={() => onRegenerate(submission.id, selectedAngle)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-900 hover:text-blue-950 font-medium hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Generiert neue Variante...' : 'Mit neuem Fokus generieren'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
