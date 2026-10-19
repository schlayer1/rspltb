import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Settings, 
  Download, 
  ShieldCheck, 
  Database, 
  Upload, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { StudentSubmission, MultiSemesterDatabase } from '../types';
import { SemesterSelector } from './SemesterSelector';

interface HeaderProps {
  submissions: StudentSubmission[];
  multiDb?: MultiSemesterDatabase;
  activeSemesterId?: string;
  onSelectSemester?: (semesterId: string) => void;
  onCreateSemester?: (semesterId: string) => void;
  onOpenBackupModal?: () => void;
  onOpenReadme?: () => void;
  lastBackupTime?: number;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onReset: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  apiHealth: { ok: boolean; message: string; latencyMs: number; isChecking: boolean };
  onCheckApiHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  submissions,
  multiDb,
  activeSemesterId,
  onSelectSemester,
  onCreateSemester,
  onOpenBackupModal,
  onOpenReadme,
  lastBackupTime,
  onOpenSettings,
  onOpenExport,
  onReset,
  onExportBackup,
  onImportBackup,
  apiHealth,
  onCheckApiHealth
}) => {
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completedCount = submissions.filter(s => s.status === 'completed' || s.status === 'approved').length;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportBackup(e.target.files[0]);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full max-w-[2100px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-3.5">
        
        {/* DESKTOP VIEW (md:flex, hidden on mobile) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          
          {/* Logo, Titel & Semester-Wähler */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <img 
              src="/icon.svg" 
              alt="FSU Jena LTB Auswerter" 
              className="w-10 h-10 rounded-xl shadow-xs shrink-0 object-cover border border-[#002f5d]/10" 
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  LTB-Auswerter <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#002f5d]/10 text-[#002f5d] border border-[#002f5d]/20">FSU Jena - ZLB</span>
                </h1>

                {/* Semester-Auswahl & Neuanlage */}
                {multiDb && activeSemesterId && onSelectSemester && onCreateSemester && (
                  <SemesterSelector
                    multiDb={multiDb}
                    activeSemesterId={activeSemesterId}
                    onSelectSemester={onSelectSemester}
                    onCreateSemester={onCreateSemester}
                  />
                )}
                
                {/* Discrete API Health Indicator */}
                <button
                  type="button"
                  onClick={onCheckApiHealth}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                    apiHealth.isChecking
                      ? 'bg-slate-50 text-slate-500 border-slate-200'
                      : apiHealth.ok
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                  title={`${apiHealth.message} (Klicken zum Verbindungstest)`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    apiHealth.isChecking
                      ? 'bg-amber-400 animate-ping'
                      : apiHealth.ok
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`} />
                  <span className="text-[11px] font-medium">
                    {apiHealth.isChecking ? 'Prüfe API...' : apiHealth.ok ? 'Gemini API' : 'API getrennt'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Reflexion schulischer Praxis · Universität Jena
              </p>
            </div>
          </div>

          {/* Action Toolbar Desktop */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Readme / Anleitung Button */}
            {onOpenReadme && (
              <button
                type="button"
                onClick={onOpenReadme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f8f5ee] hover:bg-[#f0ead8] text-[#002f5d] border border-[#d9ceb2] transition-colors shadow-2xs"
                title="Dozierenden-Handbuch & Workflow-Anleitung öffnen"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#ae9a63]" />
                <span>Anleitung & Hilfe</span>
              </button>
            )}

            {/* Datensicherung & Gerätewechsel Button */}
            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs ${
                  lastBackupTime
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                }`}
                title="Sicherungsdatei (.json) erstellen oder für iPad-Wechsel herunterladen"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${lastBackupTime ? 'text-emerald-700' : 'text-amber-600'}`} />
                <span>Sicherung & Gerätewechsel</span>
                {!lastBackupTime && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            )}

            {/* Moodle Export */}
            {completedCount > 0 && (
              <button
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors"
                title="Feedback-Dateien als ZIP für Moodle exportieren"
              >
                <Download className="w-3.5 h-3.5 text-[#002f5d]" />
                Moodle-Export ({completedCount})
              </button>
            )}

            {/* Database Backup Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBackupMenu(!showBackupMenu)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Lokale Datenbank & Semester-Backup"
              >
                <Database className="w-3.5 h-3.5 text-slate-600" />
                <span>Backup</span>
              </button>

              {showBackupMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-40 space-y-1 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      onExportBackup();
                      setShowBackupMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-700" />
                    <span>Semester-Backup sichern (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowBackupMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Backup wiederherstellen (.json)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Prompt & Settings */}
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Prompt, Kriterien & API-Einstellungen bearbeiten"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Einstellungen</span>
            </button>

            {submissions.length > 0 && (
              <button
                onClick={onReset}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Diesen Turnus zurücksetzen"
              >
                Zurücksetzen
              </button>
            )}
          </div>
        </div>

        {/* MOBILE VIEW (md:hidden, ultra-compact 2 rows <= 75px) */}
        <div className="md:hidden space-y-1.5">
          {/* Zeile 1: Brand + Semester-Pill + API Dot + Schnellicons */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <img 
                src="/icon.svg" 
                alt="FSU Jena" 
                className="w-7 h-7 rounded-lg shadow-2xs shrink-0 object-cover" 
              />
              <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                LTB-Auswerter
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#002f5d]/10 text-[#002f5d] shrink-0">
                ZLB
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {multiDb && activeSemesterId && onSelectSemester && onCreateSemester && (
                <SemesterSelector
                  multiDb={multiDb}
                  activeSemesterId={activeSemesterId}
                  onSelectSemester={onSelectSemester}
                  onCreateSemester={onCreateSemester}
                />
              )}

              {/* API Status Dot */}
              <button
                type="button"
                onClick={onCheckApiHealth}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title={`${apiHealth.message} (Klicken zum Testen)`}
              >
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                  apiHealth.isChecking
                    ? 'bg-amber-400 animate-ping'
                    : apiHealth.ok
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`} />
              </button>

              {/* Settings Icon Button */}
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Einstellungen"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zeile 2: Horizontale Schnell-Aktionsleiste */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 pt-0.5 text-xs scrollbar-none">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Sichern Button */}
              {onOpenBackupModal && (
                <button
                  type="button"
                  onClick={onOpenBackupModal}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    lastBackupTime
                      ? 'bg-white text-slate-700 border-slate-300'
                      : 'bg-amber-50 text-amber-950 border-amber-300'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${lastBackupTime ? 'text-emerald-700' : 'text-amber-600'}`} />
                  <span>Sichern</span>
                  {!lastBackupTime && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                </button>
              )}

              {/* Moodle Export Button */}
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#002f5d] text-white shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#ae9a63]" />
                  <span>Export ({completedCount})</span>
                </button>
              )}

              {/* Anleitung Button */}
              {onOpenReadme && (
                <button
                  type="button"
                  onClick={onOpenReadme}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f8f5ee] text-[#002f5d] border border-[#d9ceb2] shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#ae9a63]" />
                  <span>Anleitung</span>
                </button>
              )}
            </div>

            {/* Backup Restore Trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0"
              title="Backup (.json) einspielen"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileInputChange}
        />

      </div>
    </header>
  );
};
