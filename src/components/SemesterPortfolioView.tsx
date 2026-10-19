import React, { useState } from 'react';
import { SeminarDatabase, StudentProfile, TurnusId, EvaluationSettings } from '../types';
import { 
  Users, 
  Sparkles, 
  Copy, 
  Check, 
  CheckSquare, 
  FileText, 
  Search, 
  Calendar, 
  GraduationCap, 
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { generateSemesterSummaryFeedback } from '../services/geminiService';

interface SemesterPortfolioViewProps {
  database: SeminarDatabase;
  settings: EvaluationSettings;
  onUpdateSummary: (studentId: string, summary: string, approved: boolean) => void;
  onJumpToSubmission: (studentId: string, turnus: TurnusId) => void;
}

export const SemesterPortfolioView: React.FC<SemesterPortfolioViewProps> = ({
  database,
  settings,
  onUpdateSummary,
  onJumpToSubmission
}) => {
  const studentsList = Object.values(database.students);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    studentsList[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');
  const [copied, setCopied] = useState(false);

  const turnuses: TurnusId[] = ['ltb1', 'ltb2', 'ltb3', 'ltb4', 'ltb5', 'ltb6'];

  const filteredStudents = studentsList.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matr = (s.matrikelnummer || s.moodleId || '').toLowerCase();
    return s.fullName.toLowerCase().includes(q) || matr.includes(q);
  });

  const selectedStudent = database.students[selectedStudentId || ''] || filteredStudents[0] || null;

  const handleGenerateSummary = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    setGeneratingStep('Bereite Gesamtauswertung vor...');

    try {
      const summary = await generateSemesterSummaryFeedback(selectedStudent, settings, (step) => {
        setGeneratingStep(step);
      });
      onUpdateSummary(selectedStudent.id, summary, false);
    } catch (err: any) {
      alert(`Fehler bei der Gesamtfeedback-Generierung: ${err.message || String(err)}`);
    } finally {
      setIsGenerating(false);
      setGeneratingStep('');
    }
  };

  const handleCopySummary = () => {
    if (!selectedStudent?.semesterSummaryFeedback) return;
    navigator.clipboard.writeText(selectedStudent.semesterSummaryFeedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" /> Semester-Portfolio & Längsschnitt-Reflexion
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Seminar-Teilnehmer & Gesamtfeedback
          </h2>
          <p className="text-xs text-slate-500">
            {studentsList.length} synchronisierte Studierende · Verlauf über alle 6 Lerntagebücher hinweg.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Teilnehmer/in suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {studentsList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          Noch keine Teilnehmerdaten synchronisiert. Lade einfach eine Moodle-ZIP-Datei in einen Turnus hoch.
        </div>
      ) : (
        /* 2-Spaltiges Layout: Teilnehmerliste links, Portfolio-Akte rechts */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Linke Spalte: Teilnehmerliste (4 Spalten auf großem Screen) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Seminar-Roster ({filteredStudents.length})</span>
              <span>LTB 1–6</span>
            </div>

            {filteredStudents.map(student => {
              const isSelected = selectedStudent?.id === student.id;
              const subCount = Object.keys(student.submissions).length;

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-indigo-50/80 border-l-4 border-l-indigo-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {student.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Matr.-Nr.: {student.matrikelnummer || student.moodleId || 'Moodle-Sync'} • {subCount}/6 Abgaben
                    </p>
                  </div>

                  {/* 6 Mini-Pills */}
                  <div className="flex items-center gap-1 shrink-0">
                    {turnuses.map(t => {
                      const sub = student.submissions[t];
                      let dotColor = 'bg-slate-200 text-slate-400';
                      if (sub?.status === 'approved') dotColor = 'bg-emerald-600 text-white';
                      else if (sub?.status === 'completed') dotColor = 'bg-blue-600 text-white';
                      else if (sub?.status === 'pending') dotColor = 'bg-amber-500 text-white';

                      return (
                        <span
                          key={t}
                          className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${dotColor}`}
                          title={`${t.toUpperCase()}: ${sub ? sub.status : 'Nicht abgegeben'}`}
                        >
                          {t.replace('ltb', '')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rechte Spalte: Persönliche Semester-Akte (8 Spalten auf großem Screen) */}
          {selectedStudent && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profil-Header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedStudent.fullName}</h3>
                    <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                      Matr.-Nr.: {selectedStudent.matrikelnummer || selectedStudent.moodleId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Lehramtsseminar Reflexion schulischer Praxis (FSU Jena · ZLB) · Dozent Tim
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGenerating || Object.keys(selectedStudent.submissions).length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white shadow-xs transition-all disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {isGenerating ? (generatingStep || 'Generiere Synthese...') : 'Semester-Gesamtfeedback erstellen'}
                </button>
              </div>

              {/* Gesamtfeedback Bereich */}
              {(selectedStudent.semesterSummaryFeedback || isGenerating) && (
                <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-2xl border border-indigo-200 p-6 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-900" />
                      <h4 className="font-bold text-indigo-950 text-sm">
                        Offizielles Semester-Gesamtfeedback (Growth Mindset & Fehlerkultur)
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopySummary}
                        disabled={!selectedStudent.semesterSummaryFeedback}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-2xs'
                        }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-indigo-800" />}
                        {copied ? 'Kopiert!' : 'Kopieren für Moodle'}
                      </button>

                      <button
                        onClick={() => onUpdateSummary(
                          selectedStudent.id, 
                          selectedStudent.semesterSummaryFeedback || '', 
                          !selectedStudent.summaryApproved
                        )}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedStudent.summaryApproved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                        {selectedStudent.summaryApproved ? 'Freigegeben ✓' : 'Freigeben'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={selectedStudent.semesterSummaryFeedback || ''}
                    onChange={(e) => onUpdateSummary(selectedStudent.id, e.target.value, selectedStudent.summaryApproved || false)}
                    placeholder="Hier entsteht das 3-teilige Dozenten-Gesamtfeedback mit Würdigung der Lernkurve, Growth Mindset und positiver Fehlerkultur..."
                    className="w-full p-4 bg-white/90 focus:bg-white border border-indigo-200 focus:border-indigo-500 rounded-xl text-sm leading-relaxed text-slate-900 font-sans shadow-2xs"
                  />
                </div>
              )}

              {/* Chronologische Feedbacks LTB 1 bis LTB 6 */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Chronologischer Semesterverlauf (LTB 1 bis LTB 6)
                </h4>

                <div className="space-y-3">
                  {turnuses.map(t => {
                    const sub = selectedStudent.submissions[t];

                    return (
                      <div
                        key={t}
                        className={`bg-white rounded-xl border p-4 transition-all ${
                          sub ? 'border-slate-200 shadow-2xs' : 'border-dashed border-slate-200 bg-slate-50/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                              {t.toUpperCase()}
                            </span>
                            {sub ? (
                              <span className="text-xs font-medium text-slate-700">
                                {sub.rawFileName} ({sub.wordCount} Wörter)
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Keine Einreichung vorhanden
                              </span>
                            )}
                          </div>

                          {sub && (
                            <button
                              onClick={() => onJumpToSubmission(selectedStudent.id, t)}
                              className="text-xs text-blue-900 hover:text-blue-950 font-semibold inline-flex items-center gap-1 hover:underline"
                            >
                              Im Arbeitsplatz öffnen <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {sub && (sub.editedFeedback || sub.generatedFeedback) ? (
                          <div className="space-y-2 mt-2">
                            {sub.problemCluster && (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                                <span className="font-bold">Praxisschwerpunkt:</span> {sub.problemCluster.category}
                              </div>
                            )}
                            <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/80 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                              {sub.editedFeedback || sub.generatedFeedback}
                            </p>
                          </div>
                        ) : sub ? (
                          <p className="text-xs text-amber-700 font-medium">
                            Status: {sub.status === 'pending' ? 'Ausstehend (Noch nicht ausgewertet)' : sub.status}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
