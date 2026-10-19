import React from 'react';
import { BookOpen, Settings, Play, Download, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { StudentSubmission } from '../types';

interface HeaderProps {
  submissions: StudentSubmission[];
  onOpenSettings: () => void;
  onStartBatch: () => void;
  onOpenExport: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  submissions,
  onOpenSettings,
  onStartBatch,
  onOpenExport,
  onReset,
  isProcessing
}) => {
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const completedCount = submissions.filter(s => s.status === 'completed' || s.status === 'approved').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Titel */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-800 text-amber-400 flex items-center justify-center shadow-sm font-semibold shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  LTB-Auswerter <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">Uni Jena · ZfL</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> DSGVO Pseudonymisiert
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5" /> Anti-KI Diversity Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reflexion schulischer Praxis / Schulwirklichkeit · Dozent Tim · Moodle Feedback-Automation
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-end md:self-auto">
            {submissions.length > 0 && (
              <>
                <button
                  onClick={onReset}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                  title="Aktuelle Einreichungen leeren und neues Paket laden"
                >
                  Zurücksetzen
                </button>

                <button
                  onClick={onStartBatch}
                  disabled={isProcessing || pendingCount === 0}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium shadow-xs transition-all ${
                    isProcessing || pendingCount === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-blue-900 hover:bg-blue-800 text-white shadow-blue-900/10 active:scale-98'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      Wird ausgewertet...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                      Alle auswerten ({pendingCount})
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenExport}
                  disabled={completedCount === 0}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    completedCount === 0
                      ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                  title="Feedback-Dateien als ZIP oder Tabelle exportieren"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  Moodle-Export ({completedCount})
                </button>
              </>
            )}

            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              title="Prompt, Kriterien & API-Einstellungen bearbeiten"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Prompt & Einstellungen</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
