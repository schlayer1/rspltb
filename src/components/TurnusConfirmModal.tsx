import React from 'react';
import { HelpCircle, Check } from 'lucide-react';
import { TurnusId } from '../types';

interface TurnusConfirmModalProps {
  isOpen: boolean;
  detectedTurnus: TurnusId;
  onConfirm: (selectedTurnus: TurnusId) => void;
  onCancel: () => void;
}

export const TurnusConfirmModal: React.FC<TurnusConfirmModalProps> = ({
  isOpen,
  detectedTurnus,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const options: { id: TurnusId; label: string; desc: string }[] = [
    { id: 'ltb1', label: 'LTB 1', desc: 'Erste Praxistage & Rollenwechsel' },
    { id: 'ltb2', label: 'LTB 2', desc: 'Unterrichtsbeobachtung & Schulkultur' },
    { id: 'ltb3', label: 'LTB 3', desc: 'Eigene Sequenz / Einstiegsphasen' },
    { id: 'ltb4', label: 'LTB 4', desc: 'Differenzierung & Heterogenität' },
    { id: 'ltb5', label: 'LTB 5', desc: 'Beziehungsarbeit & Deeskalation' },
    { id: 'ltb6', label: 'LTB 6', desc: 'Abschlussreflexion der Praxisphase' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Abgabeturnus bestätigen
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Einige Dateien im ZIP tragen neutrale Namen (z. B. <code>Lerntagebuch.pdf</code>). Zu welchem der 6 Abgabeturnusse sollen diese Einreichungen zugeordnet werden?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {options.map(opt => {
            const isSelected = opt.id === detectedTurnus;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onConfirm(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-900" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
