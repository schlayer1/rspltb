# LTB-Auswerter: Reflexion schulischer Praxis (ZfL Uni Jena)

Moderne, DSGVO-konforme Web-App zur kriteriengeleiteten, zeitsparenden Auswertung digital eingereichter Lerntagebücher für das Lehramtsseminar *Reflexion schulischer Praxis / Einführung in die Schulwirklichkeit* an der Friedrich-Schiller-Universität Jena.

---

## 🚀 Highlights & Kernfunktionen

1. **Kein manuelles Copy & Paste mehr:**
   - Direktes Hochladen der aus Moodle heruntergeladenen Sammel-`.zip` (oder einzelner PDF/Word-Dateien).
   - Automatisches Entpacken und Auslesen der Texte clientseitig direkt im Browser.

2. **Anti-KI Diversity Engine:**
   - Verhindert, dass die ca. 30 Feedbacks gleich oder nach KI klingen (da Studierende sich austauschen!).
   - **Rotierende Einstiegs-Perspektiven:** Jede Abgabe erhält automatisch einen anderen Fokus (z. B. *Unterrichtsdynamik*, *Lehrkraft-Selbstverständnis*, *Didaktische Planung vs. Realität*, *Detailbeobachtungen*, *Störungen & Spontaneität*, *Beziehungsarbeit*).
   - **Pflicht-Zitate & Szenenanker:** Erzwingt 2–3 konkrete Textpassagen aus der jeweiligen Abgabe.
   - **Blacklist:** Typische KI-Floskeln (*"Es ist beachtlich..."*, *"Du legst ein solides Fundament..."*, etc.) sind strikt verboten.

3. **DSGVO-Datenschutzmodus (Lokale Pseudonymisierung):**
   - Namen, Matrikelnummern und Kontaktdaten werden vor dem Senden an Gemini lokal maskiert.
   - Beim fertigen Feedback wird die persönliche Ansprache (Vorname) automatisch wieder eingesetzt.

4. **Split-Screen Dozenten-Arbeitsplatz:**
   - Links: Vollständiger Originaltext des Lerntagebuchs (mit Wortzählung und Seitenschätzung).
   - Rechts: Tims Dozenten-Feedback mit Live-Satz-Zähler (max. 10 Sätze), Anti-KI-Prüfung und freiem Texteditor.
   - Schnelle Tastaturnavigation (Pfeiltasten links/rechts) zum zügigen Durchgehen aller Einreichungen.

5. **Moodle-Rückübertragung (Hybrid):**
   - **1-Klick-Kopierbutton:** Für die manuelle Direktübernahme ins Moodle-Bewertungsfeld.
   - **Moodle-Feedback-ZIP:** Generiert ein ZIP mit der exakten Moodle-Ordnerstruktur (`Feedback_Tim.txt` pro Studierendem), das direkt über *„Feedback-Dateien in Zip-Datei hochladen“* in Moodle importiert werden kann.
   - **Excel/CSV & Markdown-Report:** Vollständige Übersichtstabellen für deine Seminarunterlagen.

---

## 🛠️ Schnellstart auf dem Mac

### Variante A: 1-Klick-Starter (Doppelklick im Finder)
Doppelklicke einfach auf die Datei **`start.command`** im Projektordner. Der Browser öffnet sich automatisch unter `http://localhost:5173`.

### Variante B: Terminal
```bash
npm install
npm run dev
```

---

## 📋 Der ideale Moodle-Workflow

### 1. Aus Moodle herunterladen
1. Gehe in deinem Moodle-Kurs auf die Aufgabe **"Lerntagebuch Abgabe"**.
2. Klicke auf **"Alle Abgaben anzeigen"**.
3. Wähle oben im Dropdown **Bewertungsaktion** den Punkt **"Alle Abgaben herunterladen"**.
4. Moodle lädt eine `.zip`-Datei herunter.

### 2. Im LTB-Auswerter bearbeiten
1. Ziehe die `.zip`-Datei per Drag & Drop in die Web-App.
2. Klicke auf **"Alle auswerten (30)"** für den automatischen Stapellauf mit Free-Tier-Pausen (ca. 2–3 Minuten Gesamtdauer) oder werte einzelne gezielt aus.
3. Lies die Entwürfe im Split-Screen kurz gegen, passe bei Bedarf Nuancen an und setze den Haken **"Freigegeben"**.

### 3. Zurück nach Moodle
- **Weg 1 (Schnellster Weg):** Klicke oben auf **"Moodle-Export"** $\rightarrow$ **"Moodle-Feedback-ZIP herunterladen"**. Gehe in Moodle auf *Bewertungsaktion* $\rightarrow$ **"Feedback-Dateien in Zip-Datei hochladen"** und lade die ZIP hoch. Moodle verteilt jedes Feedback sekundenschnell an den richtigen Studierenden.
- **Weg 2:** Klicke bei jeder Abgabe auf **"Feedback kopieren"** und füge es direkt in Moodles Kommentarfeld ein.

---

## 🔑 Gemini API & Vercel-Hosting

Die App nutzt die verifizierten Modelle (`gemini-flash-lite-latest`, `gemini-3-flash-preview`, `gemini-flash-latest`) mit automatischer Ausfall-Kaskade.

### Eigener API-Key
Du kannst deinen eigenen kostenlosen API-Key von [aistudio.google.com](https://aistudio.google.com/) jederzeit in der App unter **"Prompt & Einstellungen"** hinterlegen. Er wird rein lokal im `localStorage` deines Browsers gespeichert.

### Optional: Auf Vercel hosten
Wenn du die App online von überall ohne lokales Terminal nutzen möchtest:
1. Projekt auf GitHub hochladen.
2. Auf [vercel.com](https://vercel.com) importieren.
3. Unter **Settings** $\rightarrow$ **Environment Variables** hinzufügen:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** `[Dein Gemini API-Schlüssel]`
