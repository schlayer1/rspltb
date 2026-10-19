/**
 * Dienst zur Vornamen- und Geschlechtserkennung für Universitäts-Seminare (FSU Jena).
 * Garantiert eine korrekte, wertschätzende Anrede mit Vornamen ("Lieber Fabian," bzw. "Liebe Alexandra,"),
 * verhindert das fehlerhafte "Liebe/r [Nachname]," und ermöglicht manuelle Nutzer-Overrides.
 */

// Umfangreiches Namenslexikon für typische Studierende im deutschsprachigen Raum
const MALE_NAMES = new Set([
  'fabian', 'max', 'maximilian', 'arthur', 'ben', 'benjamin', 'calum', 'emil', 'oscar', 'oskar',
  'fritz', 'friedrich', 'joey', 'justin', 'louis', 'luis', 'nils', 'paul', 'pawel', 'philipp',
  'philip', 'tobias', 'tim', 'timon', 'timo', 'felix', 'lukas', 'lucas', 'leon', 'jonas',
  'julian', 'moritz', 'niklas', 'jan', 'florian', 'alexander', 'david', 'elias', 'jakob',
  'jacob', 'simon', 'samuel', 'johannes', 'sebastian', 'christian', 'daniel', 'michael',
  'thomas', 'stefan', 'stephan', 'markus', 'marcus', 'andreas', 'martin', 'matthias', 'mathias',
  'christoph', 'robert', 'kevin', 'marvin', 'hendrik', 'henrik', 'ole', 'lasse', 'malte',
  'finn', 'fynn', 'mika', 'noah', 'luca', 'luka', 'leo', 'anton', 'theo', 'hannes', 'vincent',
  'valentin', 'valentin', 'erik', 'eric', 'linus', 'jonathan', 'marius', 'kilian', 'till',
  'aaron', 'adrian', 'albert', 'alex', 'anton', 'arne', 'bastian', 'bela', 'carlo', 'carl',
  'karl', 'clemens', 'colin', 'damian', 'dominik', 'dominic', 'fabio', 'gabriel', 'gregor',
  'gustav', 'hanno', 'henry', 'henri', 'hugo', 'ian', 'ingo', 'jannik', 'yannik', 'jesper',
  'joel', 'jona', 'julius', 'kai', 'kay', 'korbinian', 'lars', 'lennard', 'lennart', 'lenny',
  'levi', 'leopold', 'lorenz', 'magnus', 'manuel', 'marco', 'marko', 'marten', 'mats', 'mattis',
  'michel', 'milo', 'nathan', 'nicolas', 'nikolai', 'oliver', 'peer', 'rafael', 'raphael',
  'richard', 'robin', 'ronan', 'ruben', 'severin', 'silas', 'sören', 'soeren', 'sven', 'tammo',
  'thilo', 'titus', 'tom', 'torben', 'thorben', 'tristan', 'veit', 'viktor', 'victor', 'wenzel'
]);

const FEMALE_NAMES = new Set([
  'alexandra', 'antonia', 'cornelia', 'emily', 'emilie', 'helena', 'helene', 'johanna', 'lene',
  'lilli', 'lilly', 'lili', 'noemi', 'danielle', 'noemi-danielle', 'anna', 'laura', 'lea', 'leah',
  'marie', 'sophie', 'sofie', 'hannah', 'hanna', 'lena', 'mia', 'emma', 'sarah', 'sara', 'julia',
  'katharina', 'caterina', 'lisa', 'alina', 'amira', 'anika', 'annika', 'annette', 'charlotte',
  'clara', 'klara', 'elena', 'elisabeth', 'ella', 'elisa', 'finja', 'frida', 'frieda', 'greta',
  'ida', 'isabell', 'isabella', 'isabelle', 'jana', 'jessica', 'jantje', 'judith', 'lara', 'larissa',
  'leoni', 'leonie', 'lina', 'lotta', 'lotte', 'luisa', 'luise', 'maja', 'maya', 'mara', 'marina',
  'marlene', 'mathilda', 'matilda', 'melanie', 'merle', 'mira', 'nele', 'paula', 'pauline',
  'pia', 'rebecca', 'rebekka', 'ronja', 'rosa', 'selina', 'stella', 'tabea', 'theresa', 'teresa',
  'valentina', 'valeria', 'vanessa', 'vera', 'victoria', 'viktoria', 'wiebke', 'yasmin', 'zoe',
  'alessia', 'alice', 'alicia', 'amalia', 'amelie', 'anita', 'ann', 'astrid', 'barbara', 'beatrice',
  'birgit', 'carla', 'karla', 'carolin', 'carolina', 'caroline', 'celine', 'chiara', 'christina',
  'christine', 'daniela', 'dorothea', 'dunja', 'eileen', 'eleonora', 'esther', 'eva', 'fiona',
  'franziska', 'gina', 'gloria', 'heike', 'ines', 'inga', 'irene', 'iris', 'janina', 'janine',
  'jasmin', 'jennifer', 'jolina', 'josephine', 'katja', 'kerstin', 'kristin', 'laila', 'layla',
  'linda', 'lucia', 'madita', 'maike', 'meike', 'maren', 'mariella', 'marit', 'melina', 'mona',
  'nadine', 'nicole', 'nora', 'patricia', 'rachel', 'ramona', 'ricarda', 'ronja', 'sabrina',
  'sandra', 'saskia', 'sina', 'sonja', 'stefanie', 'stephanie', 'susanne', 'tina', 'valerie'
]);

export interface ParsedStudentIdentity {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'male' | 'female';
  salutation: string; // e.g. "Lieber Fabian" or "Liebe Alexandra"
}

/**
 * Heuristische und lexikalische Geschlechtserkennung für deutsche Vornamen.
 */
export function detectGermanGender(firstName: string): 'male' | 'female' {
  if (!firstName) return 'male';

  const clean = firstName.toLowerCase().replace(/[^a-zäöüß-]/g, '').trim();

  // Bei Doppelnamen wie "Noemi-Danielle" oder "Ben Johan" den ersten/prägenden Vornamen prüfen
  const parts = clean.split(/[- ]+/);
  for (const part of parts) {
    if (FEMALE_NAMES.has(part)) return 'female';
    if (MALE_NAMES.has(part)) return 'male';
  }

  // Morphologische Heuristiken für deutschsprachige Vornamen
  // Typisch weibliche Endungen (z. B. -a, -ina, -ine, -ie, -ette, -elle, -ee)
  if (
    clean.endsWith('a') &&
    !['luca', 'noah', 'sascha', 'joshua', 'elija', 'elisha', 'mustafa', 'reza'].includes(clean)
  ) {
    return 'female';
  }

  if (
    clean.endsWith('ine') ||
    clean.endsWith('ina') ||
    clean.endsWith('ette') ||
    clean.endsWith('elle') ||
    clean.endsWith('ika') ||
    clean.endsWith('ita') ||
    clean.endsWith('ie') ||
    clean.endsWith('sis')
  ) {
    return 'female';
  }

  // Typisch männliche Endungen
  if (
    clean.endsWith('us') ||
    clean.endsWith('or') ||
    clean.endsWith('er') ||
    clean.endsWith('el') ||
    clean.endsWith('ian') ||
    clean.endsWith('ik')
  ) {
    return 'male';
  }

  // Standardannahme, falls gänzlich unbekannt
  return 'male';
}

/**
 * Zerlegt einen vollen Studierenden-Namen (z. B. aus Moodle "Fabian Kaulfuß" oder "Kaulfuß, Fabian")
 * in Vorname, Nachname und die grammatikalisch korrekte Anrede.
 */
export function parseStudentIdentity(
  fullName: string,
  overrideGender?: 'male' | 'female'
): ParsedStudentIdentity {
  if (!fullName || !fullName.trim()) {
    return {
      firstName: 'Du',
      lastName: '',
      fullName: 'Studierende/r',
      gender: overrideGender || 'male',
      salutation: overrideGender === 'female' ? 'Liebe Studierende' : 'Lieber Student'
    };
  }

  let raw = fullName.replace(/_\d+_assignsubmission.*/i, '').trim();

  let firstName = '';
  let lastName = '';

  if (raw.includes(',')) {
    // Format: "Nachname, Vorname"
    const parts = raw.split(',');
    lastName = parts[0]?.trim() || '';
    firstName = parts[1]?.trim() || '';
  } else {
    // Format: "Vorname Nachname" oder "Vorname Vorname2 Nachname"
    const parts = raw.split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 1) {
      firstName = parts[0];
      lastName = '';
    } else if (parts.length === 2) {
      firstName = parts[0];
      lastName = parts[1];
    } else {
      // Erkennung bekannter Doppel-Vornamen wie "Ben Johan", "Emil Oscar", "Noemi-Danielle"
      const firstTwo = `${parts[0]} ${parts[1]}`.toLowerCase();
      if (
        firstTwo.startsWith('ben johan') ||
        firstTwo.startsWith('emil oscar') ||
        firstTwo.startsWith('anna lena') ||
        firstTwo.startsWith('sarah lena')
      ) {
        firstName = `${parts[0]} ${parts[1]}`;
        lastName = parts.slice(2).join(' ');
      } else {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
    }
  }

  // Fallback
  if (!firstName) firstName = raw;

  // Geschlecht bestimmen (Nutzer-Override hat oberste Priorität)
  const gender = overrideGender || detectGermanGender(firstName);
  const salutationWord = gender === 'female' ? 'Liebe' : 'Lieber';
  const salutation = `${salutationWord} ${firstName}`;

  return {
    firstName,
    lastName,
    fullName: lastName ? `${firstName} ${lastName}` : firstName,
    gender,
    salutation
  };
}

/**
 * Garantiert, dass ein Dozenten-Feedback ausnahmslos mit der korrekten Anrede beginnt:
 * "Lieber Fabian,\n\n..." bzw. "Liebe Alexandra,\n\n..."
 * und mit dem festgelegten Gruß endet ("Viele Grüße sendet Dir Tim").
 */
export function enforceSalutation(
  feedbackText: string,
  fullName: string,
  signOff: string = 'Viele Grüße sendet Dir Tim',
  overrideGender?: 'male' | 'female'
): string {
  if (!feedbackText) return '';

  const identity = parseStudentIdentity(fullName, overrideGender);
  const targetSalutationLine = `${identity.salutation},`;

  let body = feedbackText.trim();

  // 1. Alle falschen oder KI-generierten Begrüßungszeilen am Anfang bereinigen
  // Erkennt: "Liebe/r Kaulfuß,", "Liebe/r Fabian,", "Liebe/r Studierende/r,", "Hallo,", "Lieber Student,", etc.
  body = body.replace(
    /^(?:Liebe\/r\s+[^\n,]+,?|Liebe[r]?\s+[^\n,]+,?|Hallo\s+[^\n,]+,?|Hallo,?\s*|Guten Tag\s+[^\n,]+,?|Liebe Studierende,?\s*)/i,
    ''
  ).trim();

  // 2. Doppelte Anreden oder Zeilenumbrüche am Textbeginn entfernen
  body = body.replace(/^[,\s\n]+/, '').trim();

  // 3. Bestehende Signatur am Ende entfernen, um Doppelungen zu verhindern
  if (signOff) {
    const escapedSignOff = signOff.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const signOffRegex = new RegExp(`\\s*${escapedSignOff}\\s*$`, 'i');
    body = body.replace(signOffRegex, '').trim();
  }

  // 4. Deterministisch zusammensetzen
  const resultLines: string[] = [
    targetSalutationLine,
    '',
    body
  ];

  if (signOff) {
    resultLines.push('');
    resultLines.push(signOff);
  }

  return resultLines.join('\n');
}
