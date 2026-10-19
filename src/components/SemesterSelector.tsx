import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  ChevronDown, 
  Plus, 
  Check, 
  Archive, 
  Calendar,
  Sparkles,
  X
} from 'lucide-react';
import { MultiSemesterDatabase } from '../types';
import { 
  formatSemesterLabel, 
  formatSemesterShort, 
  getNextSemesterId,
  PRECONFIGURED_SEMESTERS 
} from '../services/semesterService';

interface SemesterSelectorProps {
  multiDb: MultiSemesterDatabase;
  activeSemesterId: string;
  onSelectSemester: (semesterId: string) => void;
  onCreateSemester: (semesterId: string) => void;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  multiDb,
  activeSemesterId,
  onSelectSemester,
  onCreateSemester
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSemesterInput, setNewSemesterInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const existingSemesters = Object.values(multiDb.semesters || {});
  // Sort reverse chronologically if possible or by createdAt
  const sortedSemesters = [...existingSemesters].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const activeSemester = multiDb.semesters[activeSemesterId] || {
    id: activeSemesterId,
    label: formatSemesterLabel(activeSemesterId),
    students: {}
  };

  const studentCount = Object.keys(activeSemester.students || {}).length;

  const handleOpenCreateModal = () => {
    const suggested = getNextSemesterId(activeSemesterId);
    setNewSemesterInput(suggested);
    setIsCreateModalOpen(true);
    setIsOpen(false);
  };

  const handleConfirmCreate = () => {
    const clean = newSemesterInput.trim().toUpperCase();
    if (!clean) return;
    onCreateSemester(clean);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button im FSU Jena Design */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#002f5d] hover:bg-[#002244] text-white shadow-xs transition-all border border-[#002f5d]/30"
        title="Semester wechseln oder neues anlegen"
      >
        <GraduationCap className="w-3.5 h-3.5 text-[#ae9a63]" />
        <span className="font-bold">{formatSemesterShort(activeSemesterId) || activeSemesterId}</span>
        
        {studentCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-normal">
            {studentCount} TN
          </span>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-auto sm:left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Verfügbare Semester</span>
            <span className="text-[10px] font-normal text-slate-400 font-mono">
              {sortedSemesters.length} im Archiv
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {sortedSemesters.map(sem => {
              const isSelected = sem.id === activeSemesterId;
              const count = Object.keys(sem.students || {}).length;

              return (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => {
                    onSelectSemester(sem.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#002f5d] text-white font-semibold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{formatSemesterLabel(sem.id)}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                      {count} {count === 1 ? 'Studierende/r' : 'Studierende'}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-[#ae9a63]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#002f5d] hover:bg-slate-100 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#ae9a63]" />
              <span>Neues Semester anlegen...</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Neues Semester anlegen */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#002f5d]/10 flex items-center justify-center text-[#002f5d]">
                  <Calendar className="w-5 h-5 text-[#002f5d]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Neues Semester anlegen</h3>
                  <p className="text-xs text-slate-500">Separater Datensatz für den neuen Jahrgang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Semesterkürzel (z. B. SS27, WS27/28):
              </label>
              <input
                type="text"
                value={newSemesterInput}
                onChange={(e) => setNewSemesterInput(e.target.value.toUpperCase())}
                placeholder="z. B. SS27 oder WS27/28"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002f5d]/20 focus:border-[#002f5d] font-mono font-semibold text-slate-900"
                autoFocus
              />

              {newSemesterInput && (
                <div className="p-3 rounded-xl bg-[#f8f5ee] border border-[#d9ceb2] text-xs text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ae9a63] shrink-0" />
                  <span>
                    Vorschau: <strong>{formatSemesterLabel(newSemesterInput)}</strong>
                  </span>
                </div>
              )}

              {/* Schnellauswahl Vorschläge */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Vorschläge:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRECONFIGURED_SEMESTERS.slice(2, 8).map(sem => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setNewSemesterInput(sem)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors border ${
                        newSemesterInput === sem
                          ? 'bg-[#002f5d] text-white border-[#002f5d]'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!newSemesterInput.trim()}
                className="px-4 py-2 text-xs font-semibold bg-[#002f5d] hover:bg-[#002244] text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                Semester anlegen & wechseln
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
