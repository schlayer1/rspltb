/**
 * Datenschutz- und Pseudonymisierungsdienst (DSGVO-konform für Hochschulen)
 * Maskiert Namen, Matrikelnummern und Kontaktdaten vor der API-Übertragung
 * und stellt die persönliche Ansprache im fertigen Feedback nahtlos wieder her.
 */

export function extractFirstName(fullName: string): string {
  if (!fullName) return 'Du';
  // Moodle formats often: "Nachname, Vorname" or "Vorname Nachname" or "Nachname Vorname"
  const cleaned = fullName.replace(/_\d+_assignsubmission.*/i, '').trim();
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    return parts[1]?.trim().split(' ')[0] || parts[0]?.trim();
  }
  const parts = cleaned.split(' ');
  return parts[0]?.trim() || 'Du';
}

export function pseudonymizeText(
  text: string,
  studentName: string,
  pseudonymLabel: string
): { maskedText: string; replacedNames: string[] } {
  let masked = text;
  const replacedNames: string[] = [];

  // 1. Mask matriculation numbers (5 to 7 digits preceded by Matrikel / Matr. / Matr.-Nr.)
  masked = masked.replace(
    /(?:Matrikel(?:nummer)?|Matr\.?(?:-?Nr\.?)?)\s*[:#]?\s*(\d{5,8})/gi,
    'Matrikelnummer [ANONYMISIERT]'
  );

  // 2. Mask university emails
  masked = masked.replace(
    /[a-zA-Z0-9._%+-]+@(?:uni-jena\.de|uni-jena\.de|thillm\.de|schule\.thueringen\.de)/gi,
    '[E-MAIL ANONYMISIERT]'
  );

  // 3. Mask student name if available
  if (studentName && studentName.length > 2) {
    const nameParts = studentName.split(/[\s,]+/).filter(p => p.length > 2);
    for (const part of nameParts) {
      const regex = new RegExp(`\\b${escapeRegExp(part)}\\b`, 'gi');
      if (regex.test(masked)) {
        masked = masked.replace(regex, pseudonymLabel);
        if (!replacedNames.includes(part)) {
          replacedNames.push(part);
        }
      }
    }
  }

  return { maskedText: masked, replacedNames };
}

export function restorePersonalFeedback(
  generatedFeedback: string,
  studentName: string,
  pseudonymLabel: string
): string {
  let restored = generatedFeedback;
  const firstName = extractFirstName(studentName);

  // Replace pseudonym placeholders
  const placeholderRegex = new RegExp(`\\b${escapeRegExp(pseudonymLabel)}\\b`, 'gi');
  restored = restored.replace(placeholderRegex, firstName);

  // If the feedback starts without personal greeting or with a generic one
  const genericGreetings = [
    /^(Liebe\/r\s+Studierende\/r|Liebe\/r\s+Student\/in|Hallo\s+Studierende\/r|Liebe Studierende,)/i,
    /^(Hallo\s+Student\/in|Hallo\s+du|Liebe\/r\s+Kommilitone\/in)/i
  ];

  for (const pattern of genericGreetings) {
    if (pattern.test(restored)) {
      restored = restored.replace(pattern, `Liebe/r ${firstName},`);
    }
  }

  // Ensure standard formatting
  return restored.trim();
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
