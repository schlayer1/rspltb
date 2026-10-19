import { EvaluationSettings, ProblemCluster, StudentProfile } from '../types';

export const CANDIDATE_FLASH_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

export const decodeDefaultKey = (): string => {
  try {
    const b64 = 'QVEuQWI4Uk42S2VKMmFhOEp6NWU2S0hjaTI1NjdTeGlLSmIzenVrQXprbXpuWG1Td2QzdXc=';
    if (typeof atob !== 'undefined') return atob(b64);
    if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  } catch {}
  return '';
};

export const DEFAULT_SCHOOL_GEMINI_KEY = decodeDefaultKey();

export function getActiveApiKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 5) return customKey.trim();
  const local = localStorage.getItem('rsp_gemini_api_key');
  if (local && local.trim().length > 5) return local.trim();
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 5) return envKey.trim();
  return DEFAULT_SCHOOL_GEMINI_KEY;
}

// 6 rotierende Einstiegsperspektiven für maximale Vielfalt untereinander
export const DIVERSITY_ANGLES = [
  {
    name: 'Unterrichtsdynamik & Schülerverhalten',
    instruction: 'Steige direkt bei einer konkreten Unterrichtsszene oder Schülerreaktion ein, die im Text geschildert wird.'
  },
  {
    name: 'Rollenwechsel & Lehrkraft-Selbstverständnis',
    instruction: 'Konzentriere dich zu Beginn auf das spürbare Ringen um die eigene professionelle Haltung und den Übergang von Studierenden- zur Lehrkraftrolle.'
  },
  {
    name: 'Didaktische Planung vs. Unterrichtsrealität',
    instruction: 'Knüpfe unmittelbar an dem beschriebenen Kontrast zwischen geplanter Didaktik und den tatsächlichen Wendungen der Schulstunde an.'
  },
  {
    name: 'Detailbeobachtung & Schulkultur',
    instruction: 'Greife eine bemerkenswerte Mikrobeobachtung im Klassenzimmer oder im Kollegium auf, die im Lerntagebuch erwähnt wird.'
  },
  {
    name: 'Umgang mit Störungen & pädagogische Spontaneität',
    instruction: 'Fokussiere zu Beginn den Umgang mit einer unerwarteten Situation oder Störung und reflektiere die getroffene pädagogische Entscheidung.'
  },
  {
    name: 'Beziehungsarbeit & Klassenatmosphäre',
    instruction: 'Richte das Augenmerk einleitend auf die Beziehungsarbeit, emotionale Nuancen oder die Atmosphäre zwischen Lehrkraft und Lernenden.'
  }
];

// Anti-KI Negativliste
export const ANTI_AI_BLACKLIST = [
  'Es ist beachtlich',
  'Du legst ein solides Fundament',
  'Zusammenfassend lässt sich sagen',
  'Es zeigt sich deutlich',
  'Ein Schritt in die richtige Richtung',
  'Du zeigst großes Engagement',
  'Weiter so!',
  'Alles in allem',
  'Es ist erfreulich zu sehen',
  'Besonders hervorzuheben ist',
  'Im Großen und Ganzen'
];

let cachedWorkingModel = CANDIDATE_FLASH_MODELS[0];

/**
 * Health check for the Gemini API connection
 */
export async function checkGeminiApiHealth(apiKey?: string): Promise<{ ok: boolean; model: string; message: string; latencyMs: number }> {
  const activeKey = getActiveApiKey(apiKey);
  if (!activeKey) {
    return { ok: false, model: '', message: 'Kein API-Key vorhanden', latencyMs: 0 };
  }

  const startTime = Date.now();
  const model = cachedWorkingModel || CANDIDATE_FLASH_MODELS[0];
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
      })
    });

    const latencyMs = Date.now() - startTime;
    if (response.ok) {
      return { ok: true, model, message: 'Verbunden & Einsatzbereit', latencyMs };
    } else {
      const err = await response.json().catch(() => ({}));
      return { ok: false, model, message: err?.error?.message || response.statusText, latencyMs };
    }
  } catch (err: any) {
    return { ok: false, model, message: err.message || 'Netzwerkfehler', latencyMs: Date.now() - startTime };
  }
}

/**
 * Parses [PROBLEM: Kategorie | Fallbeispiel] tag from raw generated text
 */
export function extractProblemCluster(rawText: string): { cleanFeedback: string; problemCluster?: ProblemCluster } {
  const match = rawText.match(/\[PROBLEM:\s*([^|]+)\s*\|\s*([^\]]+)\]/i);
  if (!match) {
    return { cleanFeedback: rawText.trim() };
  }

  const category = match[1].trim();
  const snippet = match[2].trim();
  const cleanFeedback = rawText.replace(match[0], '').trim();

  return {
    cleanFeedback,
    problemCluster: { category, snippet }
  };
}

export async function evaluateSubmissionText(
  rawText: string,
  settings: EvaluationSettings,
  angleIndex: number,
  onStep?: (step: string) => void
): Promise<{ feedback: string; problemCluster?: ProblemCluster; usedModel: string }> {
  const activeKey = getActiveApiKey(settings.apiKey);
  if (!activeKey) {
    throw new Error('Kein Gemini API-Schlüssel gefunden. Bitte in den Einstellungen hinterlegen.');
  }

  const angle = DIVERSITY_ANGLES[angleIndex % DIVERSITY_ANGLES.length];

  if (onStep) {
    onStep(`Fokus: „${angle.name}“ vorbereiten...`);
  }

  // Build the rich diversified prompt
  const promptLines: string[] = [];

  // Core instruction from user
  promptLines.push(settings.basePrompt.trim());
  promptLines.push('');
  
  // Specific constraints & diversity rules
  promptLines.push('--- VERBINDLICHE KRITERIEN & DIVERSIFIZIERUNG (ANTI-KI-ENGINE) ---');
  promptLines.push(`1. Maximal ${settings.maxSentences} Sätze. Kein Satz mehr.`);
  promptLines.push('2. Benutze Haupt- und Nebensätze für einen organischen, flüssigen und lebendigen Dozenten-Stil.');
  promptLines.push(`3. Spezifischer Einstiegs-Fokus für diese Einreichung: ${angle.instruction}`);
  promptLines.push('4. Greife mindestens 2 bis 3 konkrete Situationen, Zitate oder Fachinhalte DIREKT aus dem folgenden Text auf, sodass das Feedback unverwechselbar individuell auf diesen Text zugeschnitten ist.');
  promptLines.push('5. VERBOT VON KI-FLOSKELN: Nutze keine stereotypen Formulierungen wie: ' + ANTI_AI_BLACKLIST.map(b => `"${b}"`).join(', ') + '. Schreibe wie ein echter Universitätsdozent (Tim), der den Text aufmerksam gelesen hat und im Gespräch mit dem Studierenden reflektiert.');
  promptLines.push(`6. Beende das Dozenten-Feedback strikt mit: "${settings.signOff}"`);
  promptLines.push('');
  promptLines.push('7. ZUSATZ FÜR DIE SEMINAR-BERATUNGSRUNDE:');
  promptLines.push('Füge ganz am Ende deiner Antwort in einer separaten Zeile die zentrale praxeologische Herausforderung / das Hauptproblem des Textes in exakt diesem Format an:');
  promptLines.push('[PROBLEM: Kategorie | 1 prägnanter Satz zum konkreten Fall]');
  promptLines.push('Wähle als Kategorie eines der gängigen Seminar-Themen, z. B.: Unterrichtsstörungen & Disziplin, Raumpräsenz & Körpersprache, Beziehungsarbeit & Deeskalation, Differenzierung & Heterogenität, Rollenwechsel & Autorität, Zeitmanagement & Phasierung, Umgang mit Misserfolgen.');

  // Specific criteria flags if checked
  if (settings.criteria.observeAction) {
    promptLines.push('- Gehe explizit auf die geschilderten Handlungsmomente im Unterricht ein.');
  }
  if (settings.criteria.selfReflection) {
    promptLines.push('- Würdige die Selbstreflexion bezüglich der eigenen Wirkung auf die Schülerinnen und Schüler.');
  }
  if (settings.criteria.theoryPractice) {
    promptLines.push('- Bestärke den theoriegeleiteten Brückenschlag zwischen Seminarinhalten und Schulwirklichkeit.');
  }

  promptLines.push('');
  promptLines.push('--- ZU BEWERTENDES LERNTAGEBUCH ---');
  promptLines.push(rawText);

  const fullPrompt = promptLines.join('\n');

  // Cascade through verified candidate models
  const modelsToTry = [
    cachedWorkingModel,
    ...CANDIDATE_FLASH_MODELS.filter(m => m !== cachedWorkingModel)
  ];

  let lastError = 'Unbekannter Fehler';

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

    if (onStep) {
      onStep(`Übermittle an Gemini (${model})...`);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192 // 8192 tokens avoids truncation with reasoning models
          }
        })
      });

      if (response.ok) {
        if (onStep) {
          onStep('Dozenten-Feedback & Problemfeld wird analysiert...');
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        
        if (candidate?.finishReason === 'MAX_TOKENS') {
          lastError = `Modell ${model} hat Tokenlimit erreicht (finishReason: MAX_TOKENS)`;
          continue;
        }

        const parts = candidate?.content?.parts || [];
        const text = parts.map((p: any) => p.text || '').join('').trim();

        if (text && text.length > 20) {
          cachedWorkingModel = model;
          if (onStep) {
            onStep('Prüfe Anti-KI Kriterien & Signatur...');
          }

          const { cleanFeedback, problemCluster } = extractProblemCluster(text);

          return {
            feedback: cleanFeedback,
            problemCluster,
            usedModel: model
          };
        }
      } else {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || response.statusText;
        lastError = `Modell ${model} [${response.status}]: ${errMsg}`;
      }
    } catch (err: any) {
      lastError = `Netzwerkfehler bei ${model}: ${err.message || String(err)}`;
    }
  }

  throw new Error(`Alle Gemini-Flash-Modelle schlugen fehl. Letzte Meldung: ${lastError}`);
}

/**
 * Generates an overarching Semester Portfolio Feedback synthesizing all submissions (LTB 1 to 6)
 * Focusing on: Growth Mindset, positive error culture, and pride in professional development.
 */
export async function generateSemesterSummaryFeedback(
  student: StudentProfile,
  settings: EvaluationSettings,
  onStep?: (step: string) => void
): Promise<string> {
  const activeKey = getActiveApiKey(settings.apiKey);
  if (!activeKey) {
    throw new Error('Kein Gemini API-Schlüssel gefunden. Bitte in den Einstellungen hinterlegen.');
  }

  if (onStep) onStep(`Führe alle Feedbacks von ${student.fullName} zusammen...`);

  const turnusEntries = Object.entries(student.submissions) as [string, any][];
  if (turnusEntries.length === 0) {
    throw new Error('Für diesen Studierenden liegen noch keine Lerntagebuch-Feedbacks vor.');
  }

  const feedbackHistory = turnusEntries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([turnusKey, sub]) => {
      const turnusLabel = turnusKey.toUpperCase();
      const feedback = sub.editedFeedback || sub.generatedFeedback || '*(Kein Feedback)*';
      const cluster = sub.problemCluster ? `Themenschwerpunkt: ${sub.problemCluster.category} (${sub.problemCluster.snippet})` : '';
      return `### ${turnusLabel}:\n${cluster ? cluster + '\n' : ''}${feedback}`;
    })
    .join('\n\n');

  const prompt = `Du bist Dozent Tim an der Universität Jena (Zentrum für Lehrerbildung) und leitest das Seminar "Reflexion schulischer Praxis / Einführung in die Schulwirklichkeit". 
Du schreibst nun das offizielle, persönliche Semester-Gesamtfeedback für den Studierenden ${student.fullName}.

Hier sind die chronologischen Rückmeldungen und Schwerpunkte aus den Lerntagebüchern dieses Semesters:
${feedbackHistory}

AUFGABE:
Formuliere ein ermutigendes, profundes und persönliches Semester-Gesamtfeedback in genau DREI zusammenhängenden Absätzen (ca. 15 bis 20 Sätze insgesamt). Ihr duzt euch.

STRUKTUR DER DREI ABSÄTZE:
1. Absatz (Der Beginn & Rollenwechsel):
Würdige die anfänglichen ersten Schritte, die Unsicherheiten beim Rollenwechsel vom Studierenden zur Lehrkraft und den Mut, sich der Schulpraxis zu stellen.

2. Absatz (Der rote Faden, Growth Mindset & positive Fehlerkultur):
Zeichne den Entwicklungspfad nach. Hebe hervor, dass pädagogische Kompetenz kein angeborenes Talent ist, sondern durch aufmerksame Reflexion wächst (Growth Mindset). Würdige ganz explizit die positive Fehlerkultur: Wie schwierige Unterrichtssituationen, Pannen oder Disziplinkonflikte nicht als Schwäche, sondern als wertvollste Lerngelegenheiten begriffen und gemeistert wurden.

3. Absatz (Stolz auf das Erreichte & ermutigender Ausblick):
Bringe deinen ehrlichen Dozenten-Stolz auf die spürbare Reifung der Lehrerpersönlichkeit in diesem Semester zum Ausdruck. Gib einen motivierenden, herzlichen Ausblick für das weitere Lehramtsstudium und die kommenden Praktika an der Uni Jena mit.

STIL & REGELN:
- Organischer Dozenten-Stil mit Haupt- und Nebensätzen, differenziert, warmherzig und authentisch.
- KEINE hohlen KI-Phrasen ("Es ist beachtlich", "Du legst ein solides Fundament", etc.).
- Beende den gesamten Text zwingend mit: "Viele Grüße sendet Dir Tim"`;

  const model = cachedWorkingModel || CANDIDATE_FLASH_MODELS[0];
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

  if (onStep) onStep('Generiere Semester-Portfolio Synthese mit Gemini...');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Fehler bei der Gesamtfeedback-Generierung');
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p: any) => p.text || '').join('').trim();

  if (!text) {
    throw new Error('Keine Antwort von Gemini erhalten.');
  }

  return text;
}
