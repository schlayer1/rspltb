import React from 'react';
import { Search, CheckCircle, Clock, Sparkles, AlertTriangle, CheckSquare } from 'lucide-react';
import { StudentSubmission } from '../types';

interface StatsBarProps {
  submissions: StudentSubmission[];
  currentFilter: 'all' | 'pending' | 'completed' | 'approved' | 'error';
  onFilterChange: (filter: 'all' | 'pending' | 'completed' | 'approved' | 'error') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  submissions,
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange
}) => {
  const total = submissions.length;
  const pending = submissions.filter(s => s.status === 'pending').length;
  const completed = submissions.filter(s => s.status === 'completed').length;
  const approved = submissions.filter(s => s.status === 'approved').length;
  const errors = submissions.filter(s => s.status === 'error').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-pan-x">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              currentFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Alle ({total})
          </button>

          <button
            onClick={() => onFilterChange('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 ${
              currentFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Ausstehend ({pending})
          </button>

          <button
            onClick={() => onFilterChange('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 ${
              currentFilter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Generiert ({completed})
          </button>

          <button
            onClick={() => onFilterChange('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 ${
              currentFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> Freigegeben ({approved})
          </button>

          {errors > 0 && (
            <button
              onClick={() => onFilterChange('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 ${
                currentFilter === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Fehler ({errors})
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Studierende/r suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

      </div>
    </div>
  );
};
