import React from 'react';
import { TurnusId, SeminarDatabase } from '../types';
import { BookOpen, Users, MessageSquare, Sparkles } from 'lucide-react';

interface TurnusNavigationProps {
  currentTab: TurnusId | 'beratung' | 'portfolio';
  onSelectTab: (tab: TurnusId | 'beratung' | 'portfolio') => void;
  database: SeminarDatabase;
}

export const TurnusNavigation: React.FC<TurnusNavigationProps> = ({
  currentTab,
  onSelectTab,
  database
}) => {
  const turnuses: { id: TurnusId; label: string }[] = [
    { id: 'ltb1', label: 'LTB 1' },
    { id: 'ltb2', label: 'LTB 2' },
    { id: 'ltb3', label: 'LTB 3' },
    { id: 'ltb4', label: 'LTB 4' },
    { id: 'ltb5', label: 'LTB 5' },
    { id: 'ltb6', label: 'LTB 6' }
  ];

  const studentsList = Object.values(database.students);
  const totalStudents = studentsList.length;

  // Count submissions per turnus
  const countSubmissions = (turnus: TurnusId) => {
    return studentsList.filter(s => s.submissions[turnus] !== undefined).length;
  };

  // Count problem cases in active or all turnuses
  const countProblemCases = () => {
    let count = 0;
    studentsList.forEach(s => {
      Object.values(s.submissions).forEach(sub => {
        if (sub?.problemCluster?.category) count++;
      });
    });
    return count;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* 6 Turnus Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 touch-pan-x">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
          Turnus:
        </span>
        {turnuses.map(t => {
          const count = countSubmissions(t.id);
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
              }`}
            >
              <span>{t.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Special Views: Beratungsrunde & Semester-Portfolio */}
      <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 shrink-0">
        <button
          onClick={() => onSelectTab('beratung')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
            currentTab === 'beratung'
              ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80'
          }`}
          title="Cluster-Übersicht für deine Seminarsitzung"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-950" />
          <span>Beratungsrunde</span>
          {countProblemCases() > 0 && (
            <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.2 rounded-full">
              {countProblemCases()}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('portfolio')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
            currentTab === 'portfolio'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80'
          }`}
          title="Alle Seminarteilnehmer & Gesamtfeedback"
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Semester-Portfolio</span>
          {totalStudents > 0 && (
            <span className="text-[10px] bg-indigo-200 text-indigo-950 font-bold px-1.5 py-0.2 rounded-full">
              {totalStudents}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
