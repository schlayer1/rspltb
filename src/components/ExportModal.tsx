import React, { useState } from 'react';
import { 
  X, 
  FileArchive, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { StudentSubmission } from '../types';
import { 
  generateMoodleFeedbackZip, 
  generateFeedbackCsv, 
  generateFeedbackSummaryMarkdown, 
  triggerFileDownload 
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: StudentSubmission[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  submissions
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [showMoodleUploadGuide, setShowMoodleUploadGuide] = useState(false);

  if (!isOpen) return null;

  const validFeedbacks = submissions.filter(s => s.editedFeedback || s.generatedFeedback);

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      const blob = await generateMoodleFeedbackZip(submissions);
      triggerFileDownload(blob, `Moodle_Feedback_Paket_${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (err: any) {
      alert(`Fehler beim Erstellen der ZIP-Datei: ${err.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadCsv = () => {
    const blob = generateFeedbackCsv(submissions);
    triggerFileDownload(blob, `Lerntagebuecher_Feedback_Tabelle_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleDownloadMarkdown = () => {
    const blob = generateFeedbackSummaryMarkdown(submissions);
    triggerFileDownload(blob, `Lerntagebuecher_Feedback_Uebersicht_${new Date().toISOString().slice(0, 10)}.md`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Moodle & Sammel-Export</h3>
              <p className="text-xs text-slate-500">
                {validFeedbacks.length} fertige Feedbacks für deine Studierenden bereit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-6 space-y-4">
          
          {/* Option 1: Moodle Feedback ZIP */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-colors flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-blue-900 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Moodle-Feedback-ZIP (Empfohlen)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Erstellt ein ZIP-Archiv mit der exakten Moodle-Ordnerstruktur. Moodle ordnet die Feedback-Dateien (<code>Feedback_Tim.txt</code>) beim Hochladen automatisch jedem Studierenden zu.
              </p>
              <button
                type="button"
                onClick={() => setShowMoodleUploadGuide(!showMoodleUploadGuide)}
                className="text-xs text-blue-800 hover:underline inline-flex items-center gap-1 font-medium pt-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Wie lade ich das in Moodle hoch?
              </button>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip || validFeedbacks.length === 0}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              {isExportingZip ? 'Packt ZIP...' : 'ZIP herunterladen'}
            </button>
          </div>

          {showMoodleUploadGuide && (
            <div className="p-3.5 bg-blue-100/60 rounded-xl border border-blue-300 text-xs text-slate-800 space-y-1.5 animate-fadeIn">
              <p className="font-semibold text-blue-950">So importierst du die Feedbacks mit 1 Klick zurück in Moodle:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>Öffne in Moodle wieder die Aufgabe <strong>"Lerntagebuch Abgabe"</strong>.</li>
                <li>Klicke auf <strong>"Alle Abgaben anzeigen"</strong>.</li>
                <li>Wähle oben im Dropdown <em>"Bewertungsaktion"</em> den Punkt <strong>"Feedback-Dateien in Zip-Datei hochladen"</strong>.</li>
                <li>Lade die gerade heruntergeladene ZIP-Datei hoch $\rightarrow$ Fertig! Alle Studierenden haben ihr individuelles Feedback.</li>
              </ol>
            </div>
          )}

          {/* Option 2: Excel / CSV */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Excel / CSV Tabelle
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Tabelle mit Name, Wortanzahl, Status und vollem Feedback-Text (inkl. Umlaut-Optimierung für deutsches Excel).
              </p>
            </div>

            <button
              onClick={handleDownloadCsv}
              disabled={validFeedbacks.length === 0}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors"
            >
              CSV herunterladen
            </button>
          </div>

          {/* Option 3: Markdown / Dokument */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-700 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Sammel-Dokument (.md)
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Ein einziges formatiertes Textdokument mit allen Feedbacks nacheinander zur Archivierung oder zum Ausdrucken.
              </p>
            </div>

            <button
              onClick={handleDownloadMarkdown}
              disabled={validFeedbacks.length === 0}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors"
            >
              Bericht herunterladen
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
