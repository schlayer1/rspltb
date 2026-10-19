import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Check, 
  AlertCircle, 
  X, 
  Smartphone, 
  Laptop, 
  ArrowRight,
  Database,
  FileCheck,
  Clock
} from 'lucide-react';
import { MultiSemesterDatabase } from '../types';
import { formatSemesterLabel, formatSemesterShort } from '../services/semesterService';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  multiDb: MultiSemesterDatabase;
  onExportFullBackup: () => void;
  onExportCurrentSemester: () => void;
  lastBackupTime?: number;
}

export const BackupReminderModal: React.FC<BackupReminderModalProps> = ({
  isOpen,
  onClose,
  multiDb,
  onExportFullBackup,
  onExportCurrentSemester,
  lastBackupTime
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'all' | 'single'>('all');

  if (!isOpen) return null;

  const activeSemester = multiDb.semesters[multiDb.activeSemesterId] || {
    id: multiDb.activeSemesterId,
    students: {}
  };

  const studentCount = Object.keys(activeSemester.students || {}).length;
  let completedCount = 0;
  Object.values(activeSemester.students || {}).forEach(st => {
    Object.values(st.submissions || {}).forEach(sub => {
      if (sub?.status === 'completed' || sub?.status === 'approved') {
        completedCount++;
      }
    });
  });

  const totalSemestersCount = Object.keys(multiDb.semesters || {}).length;

  const handleDownloadFull = () => {
    onExportFullBackup();
    setDownloadSuccess(true);
  };

  const handleDownloadCurrent = () => {
    onExportCurrentSemester();
    setDownloadSuccess(true);
  };

  const handleAttemptCloseTab = () => {
    window.close();
    // If browser blocks window.close()
    setTimeout(() => {
      alert('Der Tab kann nun sicher über das rote Kreuzchen deines Browsers oder die Tastenkombination Cmd+W (bzw. Strg+W) geschlossen werden.');
    }, 300);
  };

  const formatTimeAgo = (ts?: number) => {
    if (!ts) return 'Noch keine Sicherung in dieser Sitzung!';
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 1) return 'Gerade eben gesichert ✓';
    if (diffMin === 1) return 'Vor 1 Minute gesichert ✓';
    return `Vor ${diffMin} Minuten gesichert ✓`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#002f5d]/10 flex items-center justify-center text-[#002f5d] shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#002f5d]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f8f5ee] border border-[#d9ceb2] text-[10px] font-bold text-[#002f5d] uppercase tracking-wider mb-1">
                <span>Datensicherung & Gerätewechsel</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Bearbeitungsstand jetzt absichern
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status-Übersicht */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Aktives Semester:</span>
              <strong className="text-slate-900 text-sm font-bold block truncate">
                {formatSemesterLabel(multiDb.activeSemesterId)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Erfasste Studierende:</span>
              <strong className="text-slate-900 text-sm font-bold block">
                {studentCount} Studierende ({completedCount} Feedbacks)
              </strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Sicherungs-Status:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              lastBackupTime
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {formatTimeAgo(lastBackupTime)}
            </span>
          </div>
        </div>

        {/* Erfolgsmeldung nach Download */}
        {downloadSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>Sicherungsdatei erfolgreich heruntergeladen!</span>
            </div>
            <p className="leading-relaxed text-emerald-800">
              Deine Auswertungen liegen nun sicher in deinem <strong>Downloads-Ordner</strong>. Du kannst den Tab jetzt bedenkenlos schließen oder die Datei auf dein iPad übertragen.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAttemptCloseTab}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-xs transition-colors"
              >
                Tab jetzt schließen
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 rounded-xl font-semibold transition-colors"
              >
                Weiter in der App arbeiten
              </button>
            </div>
          </div>
        ) : (
          /* Download Buttons */
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDownloadFull}
              className="w-full py-3.5 px-5 bg-[#002f5d] hover:bg-[#002244] text-white rounded-2xl font-semibold text-sm shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-[#ae9a63] group-hover:translate-y-0.5 transition-transform" />
                <div className="text-left">
                  <p className="font-bold">Gesamtsicherung aller Semester (.json)</p>
                  <p className="text-xs text-white/70 font-normal">
                    Alle {totalSemestersCount} Semester inklusive {formatSemesterShort(multiDb.activeSemesterId)} sichern
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-lg">
                Empfohlen
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCurrent}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-slate-500" />
              <span>Nur aktuelles Semester ({formatSemesterShort(multiDb.activeSemesterId)}) sichern</span>
            </button>
          </div>
        )}

        {/* 3-Schritte-Gerätewechsel Info */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2.5">
            <Laptop className="w-4 h-4 text-[#002f5d]" />
            <span>Gerätewechsel leicht gemacht (iMac ↔ iPad):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-[#002f5d] block mb-0.5">1. Sichern</span>
              Lade die `.json`-Datei hier auf deinen Rechner herunter.
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-[#002f5d] block mb-0.5">2. Übertragen</span>
              Sende die Datei per AirDrop oder iCloud Drive an dein iPad.
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-[#002f5d] block mb-0.5">3. Einspielen</span>
              Klicke auf dem iPad im Header auf „Backup einspielen“. Fertig!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Alle Daten bleiben 100 % lokal auf deinem Gerät (DSGVO-konform).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
