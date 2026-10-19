import { EvaluationSettings } from '../types';

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
    const b64 = 'QVEuQWI4Uk42SUpRQTM1V0ZScTRfLTdsUFAxQVU1Y1l5bkVTN3VmekZjdjlyZktHMjhhV2c=';
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

export async function evaluateSubmissionText(
  rawText: string,
  settings: EvaluationSettings,
  angleIndex: number
): Promise<{ feedback: string; usedModel: string }> {
  const activeKey = getActiveApiKey(settings.apiKey);
  if (!activeKey) {
    throw new Error('Kein Gemini API-Schlüssel gefunden. Bitte in den Einstellungen hinterlegen.');
  }

  const angle = DIVERSITY_ANGLES[angleIndex % DIVERSITY_ANGLES.length];

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
  promptLines.push(`6. Beende den Text strikt mit: "${settings.signOff}"`);

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

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7, // Higher temperature for stylistic naturalness and diversity
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 20) {
          cachedWorkingModel = model;
          return {
            feedback: text.trim(),
            usedModel: model
          };
        }
      } else {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || response.statusText;
        lastError = `Modell ${model} [${response.status}]: ${errMsg}`;
        // If 429 or 503 or 404, cascade to next candidate
      }
    } catch (err: any) {
      lastError = `Netzwerkfehler bei ${model}: ${err.message || String(err)}`;
    }
  }

  throw new Error(`Alle Gemini-Flash-Modelle schlugen fehl. Letzte Meldung: ${lastError}`);
}
