import React, { useState } from 'react';
import { X, Key, Sliders, ShieldCheck, Sparkles, HelpCircle, RotateCcw, Check } from 'lucide-react';
import { EvaluationSettings } from '../types';
import { CANDIDATE_FLASH_MODELS, decodeDefaultKey } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EvaluationSettings;
  onSave: (newSettings: EvaluationSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<EvaluationSettings>({ ...settings });
  const [savedToast, setSavedToast] = useState(false);
  const [showKeyHelp, setShowKeyHelp] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Save API key to localStorage
    if (formData.apiKey) {
      localStorage.setItem('rsp_gemini_api_key', formData.apiKey.trim());
    } else {
      localStorage.removeItem('rsp_gemini_api_key');
    }
    onSave(formData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 700);
  };

  const handleResetPrompt = () => {
    setFormData(prev => ({
      ...prev,
      basePrompt: `Du bist Dozent an einer Universität und leitest ein Seminar zur Schulwirklichkeit. Deine Studenten sollen dir Lerntagebücher zu ihren Erfahrungen aus dem Schulalltag abgeben. Gib eine differenzierte, wertschätzende und motivierende Rückmeldung ohne zu übertreiben zu folgendem Text in maximal 10 Sätzen. Ihr duzt euch. Benutze Haupt- und Nebensätze für einen organischen Stil. Beziehe dich dabei intensiv auf die Inhalte des folgenden Textes. Beende den Text mit: Viele Grüße sendet Dir Tim`,
      maxSentences: 10,
      signOff: 'Viele Grüße sendet Dir Tim',
      lecturerName: 'Tim'
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Auswertungs- & Prompt-Einstellungen</h3>
              <p className="text-xs text-slate-500">Konfiguration für Dozent Tim · Seminar RSP Uni Jena</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* 1. Basis-Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-700" />
                Dozenten-Prompt (Basis-Instruktion)
              </label>
              <button
                type="button"
                onClick={handleResetPrompt}
                className="text-xs text-slate-500 hover:text-blue-900 inline-flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Standard-Prompt wiederherstellen
              </button>
            </div>
            <textarea
              rows={5}
              value={formData.basePrompt}
              onChange={(e) => setFormData({ ...formData, basePrompt: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* 2. Formatierungsregeln */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800">Maximale Satzanzahl</label>
              <input
                type="number"
                min={3}
                max={20}
                value={formData.maxSentences}
                onChange={(e) => setFormData({ ...formData, maxSentences: parseInt(e.target.value) || 10 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <p className="text-[11px] text-slate-500">Striktes Limit (Standard: 10 Sätze)</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800">Verbindliche Signatur</label>
              <input
                type="text"
                value={formData.signOff}
                onChange={(e) => setFormData({ ...formData, signOff: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <p className="text-[11px] text-slate-500">Schlussformel (Standard: Viele Grüße sendet Dir Tim)</p>
            </div>
          </div>

          {/* 3. Anti-AI Diversity & DSGVO Switches */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Automations- & Qualitätsmodule
            </h4>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.antiAiMode}
                onChange={(e) => setFormData({ ...formData, antiAiMode: e.target.checked })}
                className="mt-0.5 rounded text-blue-900 focus:ring-blue-800"
              />
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  Anti-KI Diversity Engine aktiv
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">
                  Rotiert automatisch zwischen 6 didaktischen Einstiegs-Perspektiven, erzwingt Zitate aus dem Text und blockiert Standard-KI-Floskeln.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pseudonymize}
                onChange={(e) => setFormData({ ...formData, pseudonymize: e.target.checked })}
                className="mt-0.5 rounded text-blue-900 focus:ring-blue-800"
              />
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  DSGVO-Datenschutzmodus (Lokale Pseudonymisierung)
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">
                  Maskiert Namen und Matrikelnummern vor dem Senden an Gemini. Nach der Generierung wird der persönliche Name automatisch wieder eingesetzt.
                </span>
              </div>
            </label>
          </div>

          {/* 4. Gemini API Konfiguration & Free Tier Taktung */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                Google Gemini API-Key
              </label>
              <button
                type="button"
                onClick={() => setShowKeyHelp(!showKeyHelp)}
                className="text-xs text-blue-800 hover:underline inline-flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" /> Key erstellen (Kostenlos)
              </button>
            </div>

            <input
              type="password"
              placeholder="Eigener AI Studio API-Key (optional – Schul-Schlüssel ist aktiv)"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
            />

            {showKeyHelp && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1 animate-fadeIn">
                <p className="font-semibold">So erhältst du deinen kostenlosen Gemini-Schlüssel:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                  <li>Öffne <strong>aistudio.google.com</strong> mit deinem Google-Account.</li>
                  <li>Klicke auf <strong>"Get API key"</strong> $\rightarrow$ <strong>"Create API key"</strong>.</li>
                  <li>Kopiere den Schlüssel und füge ihn hier ein. Er bleibt rein lokal in deinem Browser gespeichert.</li>
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 text-xs">Modell-Priorität</label>
                <select
                  value={formData.selectedModel}
                  onChange={(e) => setFormData({ ...formData, selectedModel: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {CANDIDATE_FLASH_MODELS.map(m => (
                    <option key={m} value={m}>{m} (Automatische Kaskade)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 text-xs">Pause im Free-Tier (Sekunden)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.rateLimitDelaySeconds}
                  onChange={(e) => setFormData({ ...formData, rateLimitDelaySeconds: parseInt(e.target.value) || 4 })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <p className="text-[10px] text-slate-500">Verhindert 429 Rate-Limits bei 30 Abgaben (Empfohlen: 4s)</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            {savedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            {savedToast ? 'Gespeichert!' : 'Einstellungen speichern'}
          </button>
        </div>

      </div>
    </div>
  );
};
