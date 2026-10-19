import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { StatsBar } from './components/StatsBar';
import { SubmissionList } from './components/SubmissionList';
import { SplitScreenWorkspace } from './components/SplitScreenWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { BatchProgressModal } from './components/BatchProgressModal';
import { ExportModal } from './components/ExportModal';
import { StudentSubmission, EvaluationSettings, ProcessingProgress } from './types';
import { parseZipArchive, parseDirectFiles } from './services/fileParser';
import { evaluateSubmissionText } from './services/geminiService';
import { pseudonymizeText, restorePersonalFeedback } from './services/pseudonymService';
import { SAMPLE_SUBMISSIONS } from './data/sampleSubmissions';
import { Sparkles, FileText, ArrowLeft, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

const DEFAULT_SETTINGS: EvaluationSettings = {
  apiKey: localStorage.getItem('rsp_gemini_api_key') || '',
  selectedModel: 'gemini-flash-lite-latest',
  lecturerName: 'Tim',
  basePrompt: `Du bist Dozent an einer Universität und leitest ein Seminar zur Schulwirklichkeit. Deine Studenten sollen dir Lerntagebücher zu ihren Erfahrungen aus dem Schulalltag abgeben. Gib eine differenzierte, wertschätzende und motivierende Rückmeldung ohne zu übertreiben zu folgendem Text in maximal 10 Sätzen. Ihr duzt euch. Benutze Haupt- und Nebensätze für einen organischen Stil. Beziehe dich dabei intensiv auf die Inhalte des folgenden Textes. Beende den Text mit: Viele Grüße sendet Dir Tim`,
  antiAiMode: true,
  pseudonymize: true,
  maxSentences: 10,
  tone: 'collegial_reflective',
  signOff: 'Viele Grüße sendet Dir Tim',
  rateLimitDelaySeconds: 4,
  criteria: {
    observeAction: true,
    selfReflection: true,
    theoryPractice: true,
    constructivePerspective: true
  }
};

export const App: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<EvaluationSettings>(() => {
    const saved = localStorage.getItem('rsp_evaluation_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'approved' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Batch Processing State
  const [batchProgress, setBatchProgress] = useState<ProcessingProgress>({
    total: 0,
    current: 0,
    currentStudentName: '',
    isProcessing: false,
    isPaused: false,
    errorsCount: 0
  });
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState(false);

  const cancelBatchRef = useRef(false);

  // Save settings when changed
  const handleSaveSettings = (newSettings: EvaluationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rsp_evaluation_settings', JSON.stringify(newSettings));
  };

  // Upload Handler (ZIP or Files)
  const handleFilesSelected = async (files: FileList | File[]) => {
    setIsUploading(true);
    setUploadProgressText('Dateien werden analysiert...');

    try {
      const fileArray = Array.from(files);
      const isZip = fileArray.length === 1 && fileArray[0].name.toLowerCase().endsWith('.zip');

      let parsed: StudentSubmission[] = [];

      if (isZip) {
        setUploadProgressText('Moodle-ZIP-Archiv wird entpackt...');
        parsed = await parseZipArchive(fileArray[0], (curr, total, name) => {
          setUploadProgressText(`Entpacke Datei ${curr} von ${total}: ${name}`);
        });
      } else {
        setUploadProgressText('Dokumente werden ausgelesen...');
        parsed = await parseDirectFiles(fileArray, (curr, total, name) => {
          setUploadProgressText(`Lese Datei ${curr} von ${total}: ${name}`);
        });
      }

      setSubmissions(parsed);
      if (parsed.length > 0) {
        setSelectedId(parsed[0].id);
      }
    } catch (err: any) {
      alert(`Fehler beim Einlesen: ${err.message || String(err)}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  const handleLoadSamples = () => {
    setSubmissions(SAMPLE_SUBMISSIONS);
    setSelectedId(SAMPLE_SUBMISSIONS[0].id);
  };

  const handleReset = () => {
    if (confirm('Möchtest du alle aktuellen Einreichungen wirklich leeren?')) {
      setSubmissions([]);
      setSelectedId(null);
    }
  };

  // Evaluate a single submission
  const evaluateSingle = async (
    sub: StudentSubmission, 
    angleIndex: number = 0,
    onStep?: (step: string) => void
  ): Promise<string> => {
    let textToSend = sub.rawText;
    const pseudonym = sub.pseudonym || 'Studierende/r';

    // 1. DSGVO Masking
    if (settings.pseudonymize) {
      if (onStep) onStep('🔒 Maskiere persönliche Daten & Namen (DSGVO)...');
      const { maskedText } = pseudonymizeText(textToSend, sub.studentName, pseudonym);
      textToSend = maskedText;
    }

    // 2. Call Gemini API Cascade with 8192 tokens & finishReason check
    const { feedback } = await evaluateSubmissionText(textToSend, settings, angleIndex, onStep);

    // 3. Restore Personal Name
    if (onStep) onStep(`✨ Setze persönliche Ansprache für ${sub.studentName.split(' ')[0]} ein...`);
    let finalFeedback = feedback;
    if (settings.pseudonymize) {
      finalFeedback = restorePersonalFeedback(feedback, sub.studentName, pseudonym);
    }

    return finalFeedback;
  };

  // Trigger evaluation for one submission manually
  const handleEvaluateSingle = async (id: string, angleIndex: number = 0) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    setIsRegeneratingSingle(true);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'processing', errorMessage: undefined } : s));

    try {
      const result = await evaluateSingle(sub, angleIndex);
      setSubmissions(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'completed',
        generatedFeedback: result,
        editedFeedback: result,
        angleIndex
      } : s));
    } catch (err: any) {
      setSubmissions(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'error',
        errorMessage: err.message || 'Auswertungsfehler'
      } : s));
    } finally {
      setIsRegeneratingSingle(false);
    }
  };

  // Start Batch Evaluation for all pending submissions
  const handleStartBatch = async () => {
    const pendingList = submissions.filter(s => s.status === 'pending');
    if (pendingList.length === 0) return;

    cancelBatchRef.current = false;
    setBatchProgress({
      total: pendingList.length,
      current: 0,
      currentStudentName: pendingList[0].studentName,
      currentStepText: 'Initialisiere Stapelauswertung...',
      isProcessing: true,
      isPaused: false,
      errorsCount: 0
    });

    for (let i = 0; i < pendingList.length; i++) {
      if (cancelBatchRef.current) break;

      const currentSub = pendingList[i];
      setBatchProgress(prev => ({
        ...prev,
        current: i,
        currentStudentName: currentSub.studentName,
        currentStepText: 'Lese Abgabe ein...'
      }));

      // Set item to processing
      setSubmissions(prev => prev.map(s => s.id === currentSub.id ? { ...s, status: 'processing' } : s));

      try {
        // Diverse angle index per student
        const angleIndex = i;
        const feedback = await evaluateSingle(currentSub, angleIndex, (stepText) => {
          setBatchProgress(prev => ({ ...prev, currentStepText: stepText }));
        });

        setSubmissions(prev => prev.map(s => s.id === currentSub.id ? {
          ...s,
          status: 'completed',
          generatedFeedback: feedback,
          editedFeedback: feedback,
          angleIndex
        } : s));
      } catch (err: any) {
        setBatchProgress(prev => ({ ...prev, errorsCount: prev.errorsCount + 1 }));
        setSubmissions(prev => prev.map(s => s.id === currentSub.id ? {
          ...s,
          status: 'error',
          errorMessage: err.message || 'Auswertungsfehler'
        } : s));
      }

      setBatchProgress(prev => ({ ...prev, current: i + 1, currentStepText: 'Abgabe abgeschlossen ✓' }));

      // Rate limit delay between items to stay well within 15 RPM
      if (i < pendingList.length - 1 && !cancelBatchRef.current) {
        const delaySec = Math.max(1, settings.rateLimitDelaySeconds);
        for (let s = delaySec; s > 0; s--) {
          if (cancelBatchRef.current) break;
          setRateLimitSecondsLeft(s);
          setBatchProgress(prev => ({ ...prev, currentStepText: `⏳ Free-Tier Pause: Nächste Abgabe in ${s}s...` }));
          await new Promise(r => setTimeout(r, 1000));
        }
        setRateLimitSecondsLeft(0);
      }
    }

    setBatchProgress(prev => ({ ...prev, isProcessing: false, currentStepText: '' }));
  };

  const handleCancelBatch = () => {
    cancelBatchRef.current = true;
    setBatchProgress(prev => ({ ...prev, isProcessing: false }));
    setRateLimitSecondsLeft(0);
  };

  // Feedback Edit
  const handleUpdateFeedback = (id: string, newFeedback: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, editedFeedback: newFeedback } : s));
  };

  // Approve
  const handleApprove = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? {
      ...s,
      status: s.status === 'approved' ? 'completed' : 'approved'
    } : s));
  };

  // Navigation in Split-Screen
  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending' && sub.status !== 'pending') return false;
    if (filter === 'completed' && sub.status !== 'completed') return false;
    if (filter === 'approved' && sub.status !== 'approved') return false;
    if (filter === 'error' && sub.status !== 'error') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sub.studentName.toLowerCase().includes(q) ||
        sub.rawFileName.toLowerCase().includes(q) ||
        sub.rawText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedIndex = filteredSubmissions.findIndex(s => s.id === selectedId);
  const selectedSubmission = submissions.find(s => s.id === selectedId) || null;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedIndex > 0) {
      setSelectedId(filteredSubmissions[selectedIndex - 1].id);
    } else if (direction === 'next' && selectedIndex < filteredSubmissions.length - 1) {
      setSelectedId(filteredSubmissions[selectedIndex + 1].id);
    }
  };

  // Keyboard navigation (Arrow keys left/right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only navigate if not actively typing in an input/textarea
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedId(filteredSubmissions[selectedIndex - 1].id);
      } else if (e.key === 'ArrowRight' && selectedIndex < filteredSubmissions.length - 1) {
        setSelectedId(filteredSubmissions[selectedIndex + 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredSubmissions]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        submissions={submissions}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onStartBatch={handleStartBatch}
        onOpenExport={() => setIsExportOpen(true)}
        onReset={handleReset}
        isProcessing={batchProgress.isProcessing}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-5">
        
        {/* If no submissions loaded yet */}
        {submissions.length === 0 ? (
          <div className="max-w-4xl mx-auto space-y-6 pt-4">
            
            {/* Hero Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Reflexion schulischer Praxis (RSP) · Dozent Tim
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lerntagebücher zeitsparend, kriteriengeleitet & individuell auswerten
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Schluss mit manuellem Copy & Paste zwischen Moodle und KI. Lade die gesammelte ZIP-Datei aus Moodle hoch. Die App maskiert automatisch Namen (DSGVO), variiert den Dozentenstil gegen KI-Gleichklang und generiert differenzierte Rückmeldungen in maximal 10 Sätzen.
              </p>
            </div>

            {/* Upload Box */}
            <UploadZone
              onFilesSelected={handleFilesSelected}
              isLoading={isUploading}
              progressText={uploadProgressText}
            />

            {/* Demo / Sample Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleLoadSamples}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
              >
                <Layers className="w-4 h-4 text-blue-800" />
                App sofort testen: 3 Beispiel-Lerntagebücher laden
              </button>
            </div>

          </div>
        ) : (
          /* Active Workflow Layout */
          <div className="space-y-4">
            
            {/* Stats & Search */}
            <StatsBar
              submissions={submissions}
              currentFilter={filter}
              onFilterChange={setFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Main Workbench: Split-Screen View */}
            {selectedSubmission ? (
              <div className="space-y-4">
                <SplitScreenWorkspace
                  submission={selectedSubmission}
                  settings={settings}
                  onUpdateFeedback={handleUpdateFeedback}
                  onApprove={handleApprove}
                  onRegenerate={handleEvaluateSingle}
                  onNavigate={handleNavigate}
                  hasPrev={selectedIndex > 0}
                  hasNext={selectedIndex < filteredSubmissions.length - 1}
                  currentIndex={selectedIndex}
                  totalCount={filteredSubmissions.length}
                  isRegenerating={isRegeneratingSingle}
                />

                {/* Submissions Drawer / Mini List */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Alle Einreichungen der Gruppe ({submissions.length})
                    </span>
                    <span className="text-xs text-slate-400">
                      Tipp: Wechsle mit den Pfeiltasten links/rechts schnell zwischen Studierenden
                    </span>
                  </div>
                  <SubmissionList
                    submissions={filteredSubmissions}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onEvaluateSingle={handleEvaluateSingle}
                  />
                </div>
              </div>
            ) : (
              <SubmissionList
                submissions={filteredSubmissions}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEvaluateSingle={handleEvaluateSingle}
              />
            )}

          </div>
        )}

      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        submissions={submissions}
      />

      {/* Batch Progress Modal */}
      <BatchProgressModal
        progress={batchProgress}
        onCancel={handleCancelBatch}
        rateLimitSecondsLeft={rateLimitSecondsLeft}
      />

    </div>
  );
};
export default App;
