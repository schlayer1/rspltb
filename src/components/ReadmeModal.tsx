import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Search, 
  Check, 
  Sparkles, 
  History, 
  ShieldCheck, 
  Keyboard, 
  Smartphone, 
  Laptop, 
  GraduationCap,
  Copy,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'changelog' | 'didactics' | 'shortcuts'>('workflow');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-[#002f5d] text-white p-4 sm:p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#ae9a63] shrink-0 border border-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-[#ae9a63] uppercase tracking-wider mb-0.5">
                <span>Dozierenden-Handbuch · Version 1.9.0</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                LTB-Auswerter Handbuch & Workflow-Leitfaden
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Schließen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab-Navigation & Suchleiste */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'workflow'
                  ? 'bg-[#002f5d] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#ae9a63]" />
              <span>Praxis-Workflow</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('changelog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'changelog'
                  ? 'bg-[#002f5d] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#ae9a63]" />
              <span>Changelog (v1.0 – v1.9)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('didactics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'didactics'
                  ? 'bg-[#002f5d] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ae9a63]" />
              <span>Didaktik & Anti-KI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shortcuts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'shortcuts'
                  ? 'bg-[#002f5d] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-[#ae9a63]" />
              <span>Shortcuts & iPad</span>
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Thema oder Funktion suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002f5d]/20 focus:border-[#002f5d]"
            />
          </div>
        </div>

        {/* Modal-Inhalt (Scrollbar) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm text-slate-700 leading-relaxed space-y-6">
          
          {/* TAB 1: WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-[#f8f5ee] border border-[#d9ceb2] rounded-2xl text-xs text-slate-800 space-y-1.5">
                <p className="font-bold text-[#002f5d] text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#ae9a63]" />
                  Willkommen im Seminar „Reflexion schulischer Praxis“!
                </p>
                <p>
                  Diese Plattform unterstützt dich dabei, die Lerntagebücher deiner Lehramtsstudierenden zeitsparend, mit hoher didaktischer Tiefe und in deinem persönlichen Dozenten-Tonfall (Tim) auszuwerten.
                </p>
              </div>

              {/* 9 Schritte */}
              <div className="space-y-4">
                
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">1</span>
                    Semester wählen oder neu anlegen
                  </h4>
                  <p className="text-xs text-slate-600">
                    Klicke oben im Header auf den Semesterwähler (z. B. <strong>WS 26/27</strong>). Für jeden neuen Jahrgang kannst du über <em>„+ Neues Semester anlegen“</em> ein isoliertes Semester anlegen (das System schlägt dir automatisch <code>SS27</code>, <code>WS27/28</code> etc. vor). Vergangene Semester bleiben jederzeit im Archiv abrufbar.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">2</span>
                    Moodle-Sammelarchiv einlesen (ZIP oder Ordner)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Lade die Einreichungen in Moodle herunter. Ziehe entweder die <code>.zip</code>-Datei oder direkt den entpackten Ordner (den Safari auf dem Mac oft erzeugt) in den passenden Turnus (z. B. LTB 1). Die App extrahiert automatisch Namen, Matrikelnummern und Texte.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">3</span>
                    Inkrementeller Sync für Früh-Abgaben & Nachzügler
                  </h4>
                  <p className="text-xs text-slate-600">
                    Du musst nicht bis zum Stichtag warten! Werte 5 frühzeitige Abgaben sofort aus. Wenn du Tage später das aktualisierte Moodle-Archiv mit 20 Abgaben reinlädst, erkennt die App dies: Deine bereits geprüften Feedbacks bleiben <strong>vollständig geschützt</strong> und nur neue Abgaben werden ergänzt.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">4</span>
                    Selektiver Stapellauf & Safe Free-Tier Queue
                  </h4>
                  <p className="text-xs text-slate-600">
                    Wähle gezielt Studierende per Checkbox für den Stapellauf aus (bereits bewertete sind automatisch ausgegraut). Eine automatische 4,5s-Pause (13 RPM Safe Queue) verhindert zuverlässig Rate-Limit-Fehler im kostenlosen Gemini API Free-Tier.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">5</span>
                    KI-Abstract & didaktische Einstiegsperspektiven
                  </h4>
                  <p className="text-xs text-slate-600">
                    Über jedem Text findest du ein 2–3-sätziges Abstract und eine begründete Empfehlung für einen der 6 didaktischen Blickwinkel. Klicke auf <em>„Fokus übernehmen“</em> oder wähle im Dropdown einen anderen Schwerpunkt und klicke auf <em>„Mit neuem Fokus generieren“</em>.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">6</span>
                    Intelligente Anrede & Gender-Toggle
                  </h4>
                  <p className="text-xs text-slate-600">
                    Jedes Feedback beginnt immer persönlich mit <strong>„Lieber [Vorname],“</strong> oder <strong>„Liebe [Vorname],“</strong> – niemals mit dem Nachnamen. Bei seltenen Vornamen kannst du mit 1 Klick auf das <code>♂</code>/<code>♀</code>-Badge das Geschlecht wechseln; alle Feedbacks passen sich sofort live an.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">7</span>
                    Kollegiale Fallberatung im Seminar
                  </h4>
                  <p className="text-xs text-slate-600">
                    Im Reiter <strong>„Beratungsrunde“</strong> bündelt die App automatisch die Praxisherausforderungen deiner Studierenden (Unterrichtsstörungen, Rollenwechsel, Disziplin etc.). Klicke auf <em>„Sitzungs-Agenda kopieren“</em> für den perfekten Ablaufplan deiner nächsten Seminarsitzung.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">8</span>
                    Semester-Portfolio & Growth-Mindset Synthese
                  </h4>
                  <p className="text-xs text-slate-600">
                    Im Reiter <strong>„Semester-Portfolio“</strong> siehst du den Längsschnitt über alle 6 Lerntagebücher. Ein Klick auf <em>„Semester-Gesamtfeedback erstellen“</em> synthetisiert die Entwicklung des Studierenden mit Fokus auf Growth Mindset, positive Fehlerkultur und Dozentenstolz.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#002f5d] text-white flex items-center justify-center text-xs">9</span>
                    Datensicherung & Gerätewechsel (iMac ↔ iPad)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Klicke im Header auf <strong>„Sicherung & Gerätewechsel“</strong>, um deine <code>.json</code>-Sicherung herunterzuladen. Sende die Datei per AirDrop oder iCloud an dein iPad und klicke dort auf <em>„Backup wiederherstellen“</em>. Ein automatisches Schließen-Modal schützt dich vor versehentlichem Datenverlust.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CHANGELOG */}
          {activeTab === 'changelog' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-l-2 border-[#002f5d] pl-4 space-y-6">
                
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-[#002f5d] text-white text-[10px] font-bold">
                    v1.9.1 · Aktuell
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    iOS Safe-Area Inset & Notch-Korrektur
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Dynamisches <code>env(safe-area-inset-top)</code>-Padding: Header wird auf dem iPhone im Vollbildmodus und in Safari exakt unterhalb von Dynamic Island, Notch, Uhr und Akkuanzeige platziert.</li>
                    <li>Kein Verdecken von Buttons, Logo oder Semesterauswahl mehr durch Systemanzeigen.</li>
                    <li>Kontrastoptimierte Statusleiste (<code>status-bar-style: default</code>).</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.9.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Kompakter Mobile-Header & Interaktives In-App Dozierenden-Handbuch
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Header-Höhe auf Mobilgeräten von ~220px auf ~75px komprimiert (über 60 % Platzersparnis).</li>
                    <li>Neues Dozierenden-Handbuch-Modal mit 4 Tabs, Suchfunktion und vollständiger Dokumentation.</li>
                    <li>Archiv-Modus-Banner beim Betrachten früherer Semester inklusive 1-Klick-Rückkehr.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.8.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Mehrjährige Semesterverwaltung & Datensicherungs-Erinnerungsmodal
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Semesterrhythmus <code>WS26/27</code> ➔ <code>SS27</code> ➔ <code>WS27/28</code> mit isolierten Datenräumen.</li>
                    <li>Exit-Intent-Erkennung und BeforeUnload-Sicherheitsnetz gegen versehentliches Tab-Schließen.</li>
                    <li>1-Klick-Gesamtsicherung aller Semester zur Mitnahme auf das iPad via AirDrop.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.7.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Intelligente Namens-Engine, Gender-Toggle & KI-Abstracts
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Strikte Vornamen-Anrede (<code>Lieber</code>/<code>Liebe [Vorname]</code>) ohne Nachnamen oder Floskeln.</li>
                    <li>Manueller Gender-Toggle (<code>♂</code>/<code>♀</code>) mit sofortiger Live-Anpassung bestehender Feedbacks.</li>
                    <li>KI-Abstract (2–3 Sätze Zusammenfassung) und Fokus-Empfehlung über der Workbench.</li>
                    <li>Reaktivitäts-Fix für leere Textfelder nach der Stapelverarbeitung durch Immutability.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.6.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Selektive Stapelverarbeitung & Safe Free-Tier Rate-Limiter
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Gezielte Checkbox-Auswahl unbewerteter Studierender für den Stapellauf.</li>
                    <li>Automatischer 13-RPM Safe Delay (4,5 Sekunden) mit Live-Sekundenzähler gegen API-Quota-Fehler.</li>
                    <li>Diskreter API-Health-Indikator im Header mit Latenzprüfung.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.5.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    FSU Jena Corporate Design & iPad Progressive Web App (PWA)
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Designsystem mit FSU-Presseset-Tokens (Dunkelblau <code>#002f5d</code>, Gold <code>#ae9a63</code>).</li>
                    <li>PWA-Manifest, universitäres App-Icon und Retina-Styling für Homescreen-Installation.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.4.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Semester-Portfolio & didaktische Längsschnitt-Synthese
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Übersicht aller 6 LTB-Turnusse in einer persönlichen Studierenden-Akte.</li>
                    <li>KI-Synthese mit Fokus auf Growth Mindset, positive Fehlerkultur und Dozentenstolz.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.3.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Inkrementeller Moodle-Sync für ZIP-Archive & entpackte Safari-Ordner
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Unterstützung ganzer entpackter Ordnerstrukturen aus macOS Safari.</li>
                    <li>Schutz bestehender Bewertungen beim Hinzufügen späterer Einreichungen.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.2.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Kollegiale Fallberatung & automatische Themen-Clusterung
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>Automatische Erkennung von Unterrichtsstörungen, Rollenwechsel, Disziplin etc.</li>
                    <li>1-Klick-Agenda für deine Seminarsitzung zum Kopieren und Ausdrucken.</li>
                  </ul>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    v1.1.0 – v1.0.0
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Grundstein: Anti-KI-Engine & Split-Screen Workbench
                  </h4>
                  <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                    <li>6 rotierende didaktische Einstiegsperspektiven gegen stereotype Antworten.</li>
                    <li>Strikte 10-Sätze-Begrenzung, DSGVO-Maskierung und lokaler IndexedDB-Speicher.</li>
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DIDAKTIK & ANTI-KI */}
          {activeTab === 'didactics' && (
            <div className="space-y-4 animate-fadeIn text-xs text-slate-700">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-[#002f5d] text-sm">Die Philosophie der Anti-KI-Engine</h4>
                <p>
                  Herkömmliche KI-Modelle neigen zu inhaltsleeren Schmeicheleien (*„Es ist beachtlich, wie du die Situation gemeistert hast“*). In einem universitären Lehramtsseminar ist dies kontraproduktiv. Die Plattform erzwingt daher:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Maximal 10 Sätze</strong>: Verhindert langatmige Textwüsten. Studierende lesen das Feedback aufmerksam.</li>
                  <li><strong>Dozenten-Tonfall Tim</strong>: Kollegial, reflektiert, auf Augenhöhe („Du“-Form).</li>
                  <li><strong>Konkrete Textzitate</strong>: Mindestens 2 bis 3 reale Unterrichtsszenen aus dem Text werden analysiert.</li>
                  <li><strong>Gesperrte Phrasen</strong>: Eine interne Blacklist blockiert gängige KI-Stereotypen.</li>
                </ul>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <h4 className="font-bold text-slate-900 text-sm">Die 6 didaktischen Einstiegsperspektiven</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-[#002f5d] block">1. Unterrichtsdynamik & Schülerverhalten</strong>
                    Steigt bei einer konkreten Unterrichtsszene oder Schülerreaktion ein.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-[#002f5d] block">2. Rollenwechsel & Lehrkraft-Selbstverständnis</strong>
                    Fokussiert den Übergang von der Studierenden- zur Lehrkraftrolle.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-[#002f5d] block">3. Theorie-Praxis-Transfer & Fachdidaktik</strong>
                    Bestärkt den Brückenschlag zwischen Fachwissenschaft und Schulwirklichkeit.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-[#002f5d] block">4. Klassenführung & Beziehungsarbeit</strong>
                    Greift Körpersprache, Präsenz und Deeskalation auf.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-[#002f5d] block">5. Umgang mit Belastung & Selbstfürsorge</strong>
                    Würdigt das Meistern von Misserfolgen und Belastungsgrenzen.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-[#002f5d] block">6. Differenzierung & Heterogenität</strong>
                    Betrachtet den Umgang mit unterschiedlichen Lerngeschwindigkeiten.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHORTCUTS & IPAD */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4 animate-fadeIn text-xs text-slate-700">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[#002f5d]" />
                  Tastatur-Kurzbefehle für schnelles Arbeiten
                </h4>
                <div className="divide-y divide-slate-100">
                  <div className="py-2 flex items-center justify-between">
                    <span>Zur vorherigen Abgabe springen</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-slate-700">← Pfeil links</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span>Zur nächsten Abgabe springen</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-slate-700">→ Pfeil rechts</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span>Aktives Feedback in die Zwischenablage kopieren</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-slate-700">Button „Feedback kopieren“</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span>Modalfenster / Dialoge schließen</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-slate-700">Esc</kbd>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#f8f5ee] border border-[#d9ceb2] rounded-2xl space-y-2">
                <h4 className="font-bold text-[#002f5d] text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#ae9a63]" />
                  Tipp für die iPad-Nutzung (Homescreen-App)
                </h4>
                <p className="text-slate-600">
                  Du kannst die Plattform wie eine echte App auf deinem iPad installieren:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Öffne <code>rspltb.vercel.app</code> in Safari auf deinem iPad.</li>
                  <li>Tippe oben rechts auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil nach oben).</li>
                  <li>Wähle <strong>„Zum Home-Bildschirm“</strong>.</li>
                  <li>Die App startet ab sofort ohne Browser-Leisten im bildschirmfüllenden Vollbildmodus mit dem FSU Jena Logo!</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500">
            FSU Jena · Zentrum für Lehrerbildung · Dozent Tim · Stand: WS 2026/27
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#002f5d] hover:bg-[#002244] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Verstanden & Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
