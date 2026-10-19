import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FolderDown, 
  FileArchive, 
  FileText, 
  CheckCircle2, 
  HelpCircle,
  Laptop
} from 'lucide-react';
import { getFilesFromDataTransfer } from '../services/fileParser';

interface UploadZoneProps {
  onItemsSelected: (items: { file: File; relativePath: string }[] | FileList | File[]) => void;
  isLoading: boolean;
  progressText?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onItemsSelected,
  isLoading,
  progressText
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMoodleHelp, setShowMoodleHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      // Recursively extract all files and relative folder paths (works for dropped macOS folders & ZIPs)
      const scannedItems = await getFilesFromDataTransfer(e.dataTransfer);
      if (scannedItems.length > 0) {
        onItemsSelected(scannedItems);
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onItemsSelected(e.dataTransfer.files);
      }
    } catch (err) {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onItemsSelected(e.dataTransfer.files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onItemsSelected(e.target.files);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const items = files.map(f => ({
        file: f,
        relativePath: f.webkitRelativePath || f.name
      }));
      onItemsSelected(items);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          isDragOver
            ? 'border-[#002f5d] bg-[#002f5d]/5 scale-[1.005]'
            : 'border-slate-300 hover:border-[#002f5d]/60 bg-white hover:bg-slate-50/60 shadow-xs'
        }`}
      >
        {/* Hidden File Input for ZIPs / Documents */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.pdf,.docx,.txt"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />

        {/* Hidden File Input for entire unzipped Folder (macOS Safari & Chrome) */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={handleFolderInputChange}
          disabled={isLoading}
        />

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            isDragOver ? 'bg-[#002f5d] text-white' : 'bg-[#002f5d]/10 text-[#002f5d] border border-[#002f5d]/15'
          }`}>
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-[#002f5d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-[#002f5d]" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
            {isLoading ? 'Dokumente werden analysiert...' : 'Ordner oder Moodle-ZIP hier ablegen'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
            {isLoading
              ? (progressText || 'Dateien werden eingelesen...')
              : 'Ziehe den automatisch entpackten Moodle-Ordner (iMac), die .zip-Datei (iPad) oder einzelne PDF/Word-Dokumente einfach hier hinein.'}
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#002f5d] hover:bg-[#001f3f] text-white shadow-xs transition-colors"
            >
              <FolderDown className="w-4 h-4 text-[#cfbe88]" />
              <span>Ganzen Ordner wählen (iMac)</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors"
            >
              <FileArchive className="w-4 h-4 text-blue-700" />
              <span>ZIP oder Dateien wählen (iPad)</span>
            </button>
          </div>

          {/* Formats info */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              <Laptop className="w-3.5 h-3.5 text-slate-700" /> Entpackter Ordner
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              <FileArchive className="w-3.5 h-3.5 text-blue-700" /> Moodle .ZIP
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF & DOCX
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowMoodleHelp(!showMoodleHelp)}
              className="inline-flex items-center gap-1 text-xs text-blue-800 hover:text-blue-950 font-medium hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Tipp: Safari entpackt ZIPs auf dem Mac automatisch
            </button>
          </div>
        </div>
      </div>

      {showMoodleHelp && (
        <div className="mt-3 p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-slate-700 space-y-2 animate-fadeIn">
          <p className="font-semibold text-blue-950 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-800" />
            Warum beides unterstützt wird:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
            <li><strong>Auf dem Mac/iMac:</strong> Safari entpackt ZIP-Downloads standardmäßig direkt in einen Ordner im Download-Verzeichnis. Diesen Ordner kannst du einfach komplett auf das Uploadfeld ziehen oder über <em>„Ganzen Ordner wählen“</em> auswählen.</li>
            <li><strong>Auf dem iPad / iPhone:</strong> Dort bleibt der Download als <code>.zip</code>-Datei erhalten. Diese kannst du direkt auswählen oder hineinziehen.</li>
            <li>In beiden Fällen erkennt die App alle Studierendennamen und Moodle-IDs automatisch!</li>
          </ul>
        </div>
      )}
    </div>
  );
};
