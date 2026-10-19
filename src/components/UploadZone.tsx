import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, FileText, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isLoading: boolean;
  progressText?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  isLoading,
  progressText
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMoodleHelp, setShowMoodleHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/70 scale-[1.005]'
            : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-slate-50/60 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.pdf,.docx,.txt"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            isDragOver ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-900 border border-blue-100'
          }`}>
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
            {isLoading ? 'Dokumente werden entpackt & eingelesen...' : 'Moodle-ZIP oder Lerntagebücher hier ablegen'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
            {isLoading
              ? (progressText || 'Texte aus PDF und DOCX werden extrahiert...')
              : 'Ziehe die heruntergeladene Sammel-ZIP aus Moodle oder einzelne PDF- / Word-Dateien per Drag & Drop hierher, oder klicke zum Auswählen.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
              <FileArchive className="w-3.5 h-3.5 text-blue-700" /> Moodle .ZIP Sammeldownload
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
              <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> DOCX (Word)
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 w-full flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoodleHelp(!showMoodleHelp);
              }}
              className="inline-flex items-center gap-1 text-xs text-blue-800 hover:text-blue-950 font-medium hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Wie lade ich alle Lerntagebücher auf einmal aus Moodle herunter?
            </button>
          </div>
        </div>
      </div>

      {showMoodleHelp && (
        <div className="mt-3 p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-slate-700 space-y-2 animate-fadeIn">
          <p className="font-semibold text-blue-950 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-800" />
            Schritt-für-Schritt-Anleitung für Moodle:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
            <li>Öffne in deinem Moodle-Kurs die Aufgabe <strong>"Lerntagebuch Abgabe"</strong>.</li>
            <li>Klicke auf den Button <strong>"Alle Abgaben anzeigen"</strong>.</li>
            <li>Wähle oben im Dropdown-Menü <em>"Bewertungsaktion"</em> den Punkt <strong>"Alle Abgaben herunterladen"</strong>.</li>
            <li>Moodle speichert eine <code>.zip</code>-Datei auf deinem Computer.</li>
            <li>Ziehe genau diese ZIP-Datei einfach oben in das Upload-Feld!</li>
          </ol>
        </div>
      )}
    </div>
  );
};
