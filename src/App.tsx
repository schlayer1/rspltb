import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { TurnusNavigation } from './components/TurnusNavigation';
import { UploadZone } from './components/UploadZone';
import { StatsBar } from './components/StatsBar';
import { SubmissionList } from './components/SubmissionList';
import { SplitScreenWorkspace } from './components/SplitScreenWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { BatchProgressModal } from './components/BatchProgressModal';
import { ExportModal } from './components/ExportModal';
import { TurnusConfirmModal } from './components/TurnusConfirmModal';
import { BeratungsrundeDashboard } from './components/BeratungsrundeDashboard';
import { SemesterPortfolioView } from './components/SemesterPortfolioView';
import { 
  StudentSubmission, 
  EvaluationSettings, 
  ProcessingProgress, 
  SeminarDatabase, 
  TurnusId 
} from './types';
import { parseZipArchive, parseDirectFiles, parseFolderFileList } from './services/fileParser';
import { evaluateSubmissionText, checkGeminiApiHealth } from './services/geminiService';
import { pseudonymizeText, restorePersonalFeedback } from './services/pseudonymService';
import { 
  loadDatabase, 
  saveDatabase, 
  mergeIncrementalSubmissions, 
  exportDatabaseToJson, 
  importDatabaseFromJson,
  getInitialDatabase 
} from './services/dbService';
import { triggerFileDownload } from './services/exportService';
import { SAMPLE_SUBMISSIONS } from './data/sampleSubmissions';
import { Sparkles, Layers, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

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
  // Database State (IndexedDB)
  const [database, setDatabase] = useState<SeminarDatabase>(getInitialDatabase());
  const [activeTab, setActiveTab] = useState<TurnusId | 'beratung' | 'portfolio'>('ltb1');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Selective Batch Checkbox IDs
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  // Settings
  const [settings, setSettings] = useState<EvaluationSettings>(() => {
    const saved = localStorage.getItem('rsp_evaluation_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  // UI Filters
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'approved' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uncertainUploadData, setUncertainUploadData] = useState<{
    items: { file: File; relativePath: string }[] | FileList | File[];
    detected: TurnusId;
  } | null>(null);

  // API Health Status
  const [apiHealth, setApiHealth] = useState({
    ok: true,
    message: 'Verbunden (13 RPM Queue)',
    latencyMs: 120,
    isChecking: false
  });

  // Batch Progress State
  const [batchProgress, setBatchProgress] = useState<ProcessingProgress>({
    total: 0,
    current: 0,
    currentStudentName: '',
    currentStepText: '',
    isProcessing: false,
    isPaused: false,
    errorsCount: 0
  });
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState(false);

  const cancelBatchRef = useRef(false);

  // Load Database from IndexedDB on startup
  useEffect(() => {
    loadDatabase().then(loaded => {
      setDatabase(loaded);
      if (loaded.activeTurnus) {
        setActiveTab(loaded.activeTurnus);
      }
    });
  }, []);

  // Save database whenever updated
  const persistDatabase = async (updatedDb: SeminarDatabase) => {
    setDatabase(updatedDb);
    await saveDatabase(updatedDb);
  };

  // Run initial API healthcheck
  const runApiHealthCheck = async () => {
    setApiHealth(prev => ({ ...prev, isChecking: true }));
    const result = await checkGeminiApiHealth(settings.apiKey);
    setApiHealth({
      ok: result.ok,
      message: result.message,
      latencyMs: result.latencyMs,
      isChecking: false
    });
  };

  useEffect(() => {
    runApiHealthCheck();
  }, [settings.apiKey]);

  // Current submissions for active turnus
  const activeTurnus: TurnusId = activeTab === 'beratung' || activeTab === 'portfolio' ? 'ltb1' : activeTab;

  const currentTurnusSubmissions = useMemo((): StudentSubmission[] => {
    const list: StudentSubmission[] = [];
    Object.values(database.students).forEach(student => {
      const sub = student.submissions[activeTurnus];
      if (sub) {
        list.push(sub);
      }
    });
    return list;
  }, [database.students, activeTurnus]);

  // Update selectedSubIds when submissions change (pre-select unreviewed ones)
  useEffect(() => {
    const unreviewed = currentTurnusSubmissions
      .filter(s => s.status === 'pending' || s.status === 'error')
      .map(s => s.id);
    setSelectedSubIds(unreviewed);
    if (currentTurnusSubmissions.length > 0 && !selectedId) {
      setSelectedId(currentTurnusSubmissions[0].id);
    }
  }, [activeTurnus, currentTurnusSubmissions.length]);

  // Save settings
  const handleSaveSettings = (newSettings: EvaluationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rsp_evaluation_settings', JSON.stringify(newSettings));
  };

  // Upload handler with incremental sync (supports unpacked folders, ZIPs, and individual documents)
  const processUploadFiles = async (
    rawInput: { file: File; relativePath: string }[] | FileList | File[],
    targetTurnus: TurnusId
  ) => {
    setIsUploading(true);
    setUploadProgressText('Dateien werden eingelesen...');

    try {
      let parsedSubmissions: StudentSubmission[] = [];
      let hasUncertain = false;

      // Check if input is an array of scanned folder items
      const isFolderItemList = Array.isArray(rawInput) && rawInput.length > 0 && 'file' in rawInput[0];

      if (isFolderItemList) {
        setUploadProgressText('Entpackter Ordner wird eingelesen...');
        const folderItems = rawInput as { file: File; relativePath: string }[];
        const res = await parseFolderFileList(folderItems, targetTurnus, (curr: number, total: number, name: string) => {
          setUploadProgressText(`Lese Datei ${curr} von ${total}: ${name}`);
        });
        parsedSubmissions = res.submissions;
        hasUncertain = res.hasUncertainTurnus;
      } else {
        const fileArray = Array.from(rawInput as FileList | File[]);
        const isZip = fileArray.length === 1 && fileArray[0].name.toLowerCase().endsWith('.zip');

        if (isZip) {
          setUploadProgressText('Moodle-Sammelarchiv (.zip) wird analysiert...');
          const res = await parseZipArchive(fileArray[0], targetTurnus, (curr, total, name) => {
            setUploadProgressText(`Entpacke Datei ${curr} von ${total}: ${name}`);
          });
          parsedSubmissions = res.submissions;
          hasUncertain = res.hasUncertainTurnus;
        } else {
          setUploadProgressText('Dokumente werden ausgelesen...');
          const res = await parseDirectFiles(fileArray, targetTurnus, (curr, total, name) => {
            setUploadProgressText(`Lese Datei ${curr} von ${total}: ${name}`);
          });
          parsedSubmissions = res.submissions;
          hasUncertain = res.hasUncertainTurnus;
        }
      }

      // If uncertain and user dropped from another tab
      if (hasUncertain && !uncertainUploadData && parsedSubmissions.length > 0) {
        setUncertainUploadData({ items: rawInput, detected: targetTurnus });
        setIsUploading(false);
        return;
      }

      // Inkrementelles Mergen mit der IndexedDB-Datenbank
      const { updatedDb, addedCount, updatedCount, preservedCount } = mergeIncrementalSubmissions(
        database,
        parsedSubmissions,
        targetTurnus
      );

      await persistDatabase(updatedDb);

      // Select first
      if (parsedSubmissions.length > 0) {
        setSelectedId(parsedSubmissions[0].id);
      }

      alert(`Inkrementeller Moodle-Sync für ${targetTurnus.toUpperCase()} abgeschlossen:\n• ${addedCount} neue Abgaben hinzugefügt\n• ${preservedCount} bereits bewertete Feedbacks geschützt\n• ${updatedCount} aktualisiert`);
    } catch (err: any) {
      alert(`Fehler beim Einlesen: ${err.message || String(err)}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      setUncertainUploadData(null);
    }
  };

  const handleFilesSelected = (items: { file: File; relativePath: string }[] | FileList | File[]) => {
    processUploadFiles(items, activeTurnus);
  };

  // Demo Samples
  const handleLoadSamples = async () => {
    const { updatedDb } = mergeIncrementalSubmissions(database, SAMPLE_SUBMISSIONS, 'ltb1');
    await persistDatabase(updatedDb);
    setSelectedId(SAMPLE_SUBMISSIONS[0].id);
  };

  // Reset active turnus
  const handleResetCurrentTurnus = async () => {
    if (confirm(`Möchtest du wirklich alle Einreichungen für ${activeTurnus.toUpperCase()} leeren?`)) {
      const updatedStudents = { ...database.students };
      Object.keys(updatedStudents).forEach(key => {
        delete updatedStudents[key].submissions[activeTurnus];
      });
      await persistDatabase({ ...database, students: updatedStudents });
      setSelectedId(null);
    }
  };

  // Evaluate a single submission
  const evaluateSingle = async (
    sub: StudentSubmission, 
    angleIndex: number = 0,
    onStep?: (step: string) => void
  ): Promise<{ feedback: string; problemCluster?: any }> => {
    let textToSend = sub.rawText;
    const pseudonym = sub.pseudonym || 'Studierende/r';

    // 1. DSGVO Masking
    if (settings.pseudonymize) {
      if (onStep) onStep('🔒 Maskiere persönliche Daten & Namen (DSGVO)...');
      const { maskedText } = pseudonymizeText(textToSend, sub.studentName, pseudonym);
      textToSend = maskedText;
    }

    // 2. Call Gemini API Cascade with 8192 tokens
    const { feedback, problemCluster } = await evaluateSubmissionText(textToSend, settings, angleIndex, onStep);

    // 3. Restore Personal Name
    if (onStep) onStep(`✨ Setze persönliche Ansprache für ${sub.studentName.split(' ')[0]} ein...`);
    let finalFeedback = feedback;
    if (settings.pseudonymize) {
      finalFeedback = restorePersonalFeedback(feedback, sub.studentName, pseudonym);
    }

    return { feedback: finalFeedback, problemCluster };
  };

  // Evaluate single manually
  const handleEvaluateSingle = async (id: string, angleIndex: number = 0) => {
    const sub = currentTurnusSubmissions.find(s => s.id === id);
    if (!sub) return;

    setIsRegeneratingSingle(true);
    const studentKey = sub.moodleId || sub.studentName.toLowerCase().replace(/\s+/g, '_');

    try {
      const { feedback, problemCluster } = await evaluateSingle(sub, angleIndex);
      
      const updatedStudents = { ...database.students };
      if (updatedStudents[studentKey]) {
        updatedStudents[studentKey].submissions[activeTurnus] = {
          ...sub,
          status: 'completed',
          generatedFeedback: feedback,
          editedFeedback: feedback,
          problemCluster,
          angleIndex
        };
        await persistDatabase({ ...database, students: updatedStudents });
      }
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setIsRegeneratingSingle(false);
    }
  };

  // Selective Batch Evaluation
  const handleStartBatchSelected = async () => {
    const listToProcess = currentTurnusSubmissions.filter(s => selectedSubIds.includes(s.id));
    if (listToProcess.length === 0) return;

    cancelBatchRef.current = false;
    setBatchProgress({
      total: listToProcess.length,
      current: 0,
      currentStudentName: listToProcess[0].studentName,
      currentStepText: 'Starte selektive Stapelverarbeitung...',
      isProcessing: true,
      isPaused: false,
      errorsCount: 0
    });

    let currentDb = { ...database };

    for (let i = 0; i < listToProcess.length; i++) {
      if (cancelBatchRef.current) break;

      const currentSub = listToProcess[i];
      setBatchProgress(prev => ({
        ...prev,
        current: i,
        currentStudentName: currentSub.studentName,
        currentStepText: 'Lese Abgabe ein...'
      }));

      const studentKey = currentSub.moodleId || currentSub.studentName.toLowerCase().replace(/\s+/g, '_');

      try {
        const angleIndex = i;
        const { feedback, problemCluster } = await evaluateSingle(currentSub, angleIndex, (stepText) => {
          setBatchProgress(prev => ({ ...prev, currentStepText: stepText }));
        });

        if (currentDb.students[studentKey]) {
          currentDb.students[studentKey].submissions[activeTurnus] = {
            ...currentSub,
            status: 'completed',
            generatedFeedback: feedback,
            editedFeedback: feedback,
            problemCluster,
            angleIndex
          };
          await saveDatabase(currentDb);
          setDatabase({ ...currentDb });
        }
      } catch (err: any) {
        setBatchProgress(prev => ({ ...prev, errorsCount: prev.errorsCount + 1 }));
      }

      setBatchProgress(prev => ({ ...prev, current: i + 1, currentStepText: 'Abgabe fertiggestellt ✓' }));

      // Safe Free-Tier Delay (4,5 Sekunden = max. 13 RPM)
      if (i < listToProcess.length - 1 && !cancelBatchRef.current) {
        const delaySec = Math.max(1, settings.rateLimitDelaySeconds);
        for (let s = delaySec; s > 0; s--) {
          if (cancelBatchRef.current) break;
          setRateLimitSecondsLeft(s);
          setBatchProgress(prev => ({ ...prev, currentStepText: `⏳ Free-Tier Pause: Nächste Abgabe in ${s}s (Safe 13 RPM)...` }));
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

  // Feedback Editing
  const handleUpdateFeedback = async (id: string, newFeedback: string) => {
    const sub = currentTurnusSubmissions.find(s => s.id === id);
    if (!sub) return;
    const studentKey = sub.moodleId || sub.studentName.toLowerCase().replace(/\s+/g, '_');

    const updatedStudents = { ...database.students };
    if (updatedStudents[studentKey]) {
      updatedStudents[studentKey].submissions[activeTurnus] = {
        ...sub,
        editedFeedback: newFeedback
      };
      await persistDatabase({ ...database, students: updatedStudents });
    }
  };

  // Approve Feedback
  const handleApprove = async (id: string) => {
    const sub = currentTurnusSubmissions.find(s => s.id === id);
    if (!sub) return;
    const studentKey = sub.moodleId || sub.studentName.toLowerCase().replace(/\s+/g, '_');

    const updatedStudents = { ...database.students };
    if (updatedStudents[studentKey]) {
      const currentStatus = sub.status;
      updatedStudents[studentKey].submissions[activeTurnus] = {
        ...sub,
        status: currentStatus === 'approved' ? 'completed' : 'approved'
      };
      await persistDatabase({ ...database, students: updatedStudents });
    }
  };

  // Semester Summary Feedback Update
  const handleUpdateSemesterSummary = async (studentId: string, summary: string, approved: boolean) => {
    const updatedStudents = { ...database.students };
    if (updatedStudents[studentId]) {
      updatedStudents[studentId].semesterSummaryFeedback = summary;
      updatedStudents[studentId].summaryApproved = approved;
      await persistDatabase({ ...database, students: updatedStudents });
    }
  };

  // Jump from Beratungsrunde / Portfolio to a specific submission
  const handleJumpToSubmission = (studentId: string, turnus: TurnusId) => {
    setActiveTab(turnus);
    const sub = database.students[studentId]?.submissions[turnus];
    if (sub) {
      setSelectedId(sub.id);
    }
  };

  // Database Backup handlers
  const handleExportBackup = () => {
    const blob = exportDatabaseToJson(database);
    triggerFileDownload(blob, `RSP_LTB_Semester_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const imported = await importDatabaseFromJson(file);
      setDatabase(imported);
      alert('Semester-Datenbank erfolgreich wiederhergestellt!');
    } catch (err: any) {
      alert(`Fehler beim Import: ${err.message}`);
    }
  };

  // Filter Submissions
  const filteredSubmissions = currentTurnusSubmissions.filter(sub => {
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
  const selectedSubmission = currentTurnusSubmissions.find(s => s.id === selectedId) || null;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedIndex > 0) {
      setSelectedId(filteredSubmissions[selectedIndex - 1].id);
    } else if (direction === 'next' && selectedIndex < filteredSubmissions.length - 1) {
      setSelectedId(filteredSubmissions[selectedIndex + 1].id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Checkbox Selection Toggles
  const handleToggleSelectSub = (id: string) => {
    setSelectedSubIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnreviewed = () => {
    const unreviewed = currentTurnusSubmissions
      .filter(s => s.status === 'pending' || s.status === 'error')
      .map(s => s.id);
    setSelectedSubIds(unreviewed);
  };

  const handleDeselectAll = () => {
    setSelectedSubIds([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        submissions={currentTurnusSubmissions}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onReset={handleResetCurrentTurnus}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        apiHealth={apiHealth}
        onCheckApiHealth={runApiHealthCheck}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-5">
        
        {/* Turnus Navigation Tabs (LTB 1–6, Beratungsrunde, Semester-Portfolio) */}
        <TurnusNavigation
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          database={database}
        />

        {/* View 1: Beratungsrunde Dashboard */}
        {activeTab === 'beratung' && (
          <BeratungsrundeDashboard
            database={database}
            activeTurnus={activeTurnus}
            onSelectStudent={handleJumpToSubmission}
          />
        )}

        {/* View 2: Semester Portfolio View */}
        {activeTab === 'portfolio' && (
          <SemesterPortfolioView
            database={database}
            settings={settings}
            onUpdateSummary={handleUpdateSemesterSummary}
            onJumpToSubmission={handleJumpToSubmission}
          />
        )}

        {/* View 3: Standard Turnus Workbench (LTB 1 to 6) */}
        {activeTab !== 'beratung' && activeTab !== 'portfolio' && (
          <>
            {currentTurnusSubmissions.length === 0 ? (
              <div className="max-w-4xl mx-auto space-y-6 pt-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Turnus: {activeTurnus.toUpperCase()} · Inkrementeller Modus aktiv
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Moodle-Sammel-ZIP für {activeTurnus.toUpperCase()} hochladen
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Lade hier die Moodle-ZIP hoch. Bereits zuvor bewertete Studierende werden automatisch geschützt, nur neue Abgaben werden ergänzt und das Seminar-Roster wird synchronisiert.
                  </p>
                </div>

                <UploadZone
                  onItemsSelected={handleFilesSelected}
                  isLoading={isUploading}
                  progressText={uploadProgressText}
                />

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleLoadSamples}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
                  >
                    <Layers className="w-4 h-4 text-blue-800" />
                    3 Beispiel-Lerntagebücher in {activeTurnus.toUpperCase()} laden
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats Bar */}
                <StatsBar
                  submissions={currentTurnusSubmissions}
                  currentFilter={filter}
                  onFilterChange={setFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                {/* Split-Screen Workspace */}
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

                    {/* Submissions List with Selective Checkboxes */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Einreichungen in {activeTurnus.toUpperCase()} ({currentTurnusSubmissions.length})
                        </span>
                        <span className="text-xs text-slate-400">
                          Tipp: Wähle per Checkbox gezielt Studierende für den Stapellauf
                        </span>
                      </div>
                      <SubmissionList
                        submissions={filteredSubmissions}
                        selectedId={selectedId}
                        selectedSubIds={selectedSubIds}
                        onToggleSelectSub={handleToggleSelectSub}
                        onSelectAllUnreviewed={handleSelectAllUnreviewed}
                        onDeselectAll={handleDeselectAll}
                        onSelect={setSelectedId}
                        onEvaluateSingle={handleEvaluateSingle}
                        onEvaluateSelected={handleStartBatchSelected}
                        isBatchRunning={batchProgress.isProcessing}
                      />
                    </div>
                  </div>
                ) : (
                  <SubmissionList
                    submissions={filteredSubmissions}
                    selectedId={selectedId}
                    selectedSubIds={selectedSubIds}
                    onToggleSelectSub={handleToggleSelectSub}
                    onSelectAllUnreviewed={handleSelectAllUnreviewed}
                    onDeselectAll={handleDeselectAll}
                    onSelect={setSelectedId}
                    onEvaluateSingle={handleEvaluateSingle}
                    onEvaluateSelected={handleStartBatchSelected}
                    isBatchRunning={batchProgress.isProcessing}
                  />
                )}
              </div>
            )}
          </>
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
        submissions={currentTurnusSubmissions}
      />

      {/* Batch Progress Modal */}
      <BatchProgressModal
        progress={batchProgress}
        onCancel={handleCancelBatch}
        rateLimitSecondsLeft={rateLimitSecondsLeft}
      />

      {/* Turnus Confirm Modal */}
      {uncertainUploadData && (
        <TurnusConfirmModal
          isOpen={true}
          detectedTurnus={uncertainUploadData.detected}
          onConfirm={(selectedTurnus) => {
            processUploadFiles(uncertainUploadData.items, selectedTurnus);
          }}
          onCancel={() => setUncertainUploadData(null)}
        />
      )}

    </div>
  );
};
export default App;
