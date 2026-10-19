import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Settings, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Database, 
  Upload, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface HeaderProps {
  submissions: StudentSubmission[];
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
      <div className="w-full max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Titel */}
          <div className="flex items-center gap-3.5">
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
                Reflexion schulischer Praxis
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Moodle Export */}
            {completedCount > 0 && (
              <button
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors"
                title="Feedback-Dateien als ZIP für Moodle exportieren"
              >
                <Download className="w-3.5 h-3.5 text-blue-800" />
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
                <span className="hidden sm:inline">Backup</span>
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Prompt & Settings */}
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Prompt, Kriterien & API-Einstellungen bearbeiten"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Einstellungen</span>
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
      </div>
    </header>
  );
};
