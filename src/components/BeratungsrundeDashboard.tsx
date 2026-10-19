import React, { useState } from 'react';
import { SeminarDatabase, TurnusId } from '../types';
import { MessageSquare, Copy, Check, Printer, Sparkles, User, ChevronRight, Filter } from 'lucide-react';

interface BeratungsrundeDashboardProps {
  database: SeminarDatabase;
  activeTurnus: TurnusId;
  onSelectStudent: (studentId: string, turnus: TurnusId) => void;
}

export const BeratungsrundeDashboard: React.FC<BeratungsrundeDashboardProps> = ({
  database,
  activeTurnus,
  onSelectStudent
}) => {
  const [filterTurnus, setFilterTurnus] = useState<TurnusId | 'all'>(activeTurnus);
  const [copied, setCopied] = useState(false);

  // Collect all problem cases
  const studentsList = Object.values(database.students);
  const cases: {
    studentName: string;
    studentId: string;
    turnus: TurnusId;
    category: string;
    snippet: string;
  }[] = [];

  studentsList.forEach(student => {
    Object.entries(student.submissions).forEach(([turnusKey, sub]) => {
      const t = turnusKey as TurnusId;
      if (filterTurnus === 'all' || filterTurnus === t) {
        if (sub?.problemCluster?.category) {
          cases.push({
            studentName: student.fullName,
            studentId: student.id,
            turnus: t,
            category: sub.problemCluster.category,
            snippet: sub.problemCluster.snippet
          });
        }
      }
    });
  });

  // Group by category
  const clusters: Record<string, typeof cases> = {};
  cases.forEach(c => {
    const cat = c.category.trim();
    if (!clusters[cat]) {
      clusters[cat] = [];
    }
    clusters[cat].push(c);
  });

  const sortedCategories = Object.entries(clusters).sort((a, b) => b[1].length - a[1].length);

  // Generate clean Agenda Text for the seminar session
  const generateAgendaText = (): string => {
    const lines: string[] = [
      `# Beratungsrunden-Agenda (Reflexion schulischer Praxis)`,
      `**Dozent:** Tim · **Turnus:** ${filterTurnus === 'all' ? 'Gesamtes Semester' : filterTurnus.toUpperCase()}`,
      `**Datum:** ${new Date().toLocaleDateString('de-DE')}`,
      `**Zentrale Problemfelder aus den Lerntagebüchern:**`,
      ''
    ];

    sortedCategories.forEach(([cat, items], idx) => {
      lines.push(`## ${idx + 1}. ${cat} (${items.length} ${items.length === 1 ? 'Fall' : 'Fälle'})`);
      items.forEach(item => {
        lines.push(`- **${item.studentName}** (${item.turnus.toUpperCase()}): „${item.snippet}“`);
      });
      lines.push('');
    });

    lines.push('---');
    lines.push('Leitfragen für die kollegiale Fallberatung im Seminar:');
    lines.push('1. Welche Handlungsalternativen hätte es in der akuten Situation gegeben?');
    lines.push('2. Welche pädagogische Haltung liegt der Reaktion zugrunde?');
    lines.push('3. Wie lässt sich das Phänomen theoriegeleitet (z.B. nach Kounin oder Lohmann) einordnen?');

    return lines.join('\n');
  };

  const handleCopyAgenda = () => {
    const text = generateAgendaText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" /> Kollegiale Fallberatung im Seminar
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Themen-Cluster der Beratungsrunde
          </h2>
          <p className="text-xs text-slate-500">
            Aus den Lerntagebüchern extrahierte Praxisherausforderungen, gebündelt für deine Seminarsitzung.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Turnus Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={filterTurnus}
              onChange={(e) => setFilterTurnus(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none pr-2"
            >
              <option value="ltb1">Nur LTB 1</option>
              <option value="ltb2">Nur LTB 2</option>
              <option value="ltb3">Nur LTB 3</option>
              <option value="ltb4">Nur LTB 4</option>
              <option value="ltb5">Nur LTB 5</option>
              <option value="ltb6">Nur LTB 6</option>
              <option value="all">Alle Turnusse (Gesamtübersicht)</option>
            </select>
          </div>

          <button
            onClick={handleCopyAgenda}
            disabled={cases.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Agenda kopiert!' : 'Sitzungs-Agenda kopieren'}
          </button>

          <button
            onClick={handlePrint}
            disabled={cases.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
            title="Druckansicht öffnen"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Drucken
          </button>
        </div>
      </div>

      {/* Empty State */}
      {cases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Noch keine Problemfelder erfasst
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Sobald du Lerntagebücher im aktuellen Turnus auswertest, analysiert Gemini automatisch die zentralen Praxisherausforderungen und fasst sie hier in Themen-Clustern zusammen.
          </p>
        </div>
      ) : (
        /* Cluster Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedCategories.map(([category, items]) => (
            <div
              key={category}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    {category}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {items.length} {items.length === 1 ? 'Fall' : 'Fälle'}
                  </span>
                </div>

                <div className="space-y-2.5 divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectStudent(item.studentId, item.turnus)}
                      className="pt-2.5 first:pt-0 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 group-hover:text-blue-900">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          {item.studentName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.turnus.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-sans italic mt-1 leading-relaxed pl-4 border-l-2 border-[#ae9a63] group-hover:border-[#002f5d]">
                        „{item.snippet}“
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Klick auf Studierende/n öffnet Abgabe</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
