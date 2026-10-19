/**
 * Datenschutz- und Pseudonymisierungsdienst (DSGVO-konform für Hochschulen)
 * Maskiert Namen, Matrikelnummern und Kontaktdaten vor der API-Übertragung
 * und stellt die persönliche Ansprache im fertigen Feedback nahtlos wieder her.
 */

import { parseStudentIdentity, enforceSalutation } from './nameSalutationService';

export function extractFirstName(fullName: string): string {
  if (!fullName) return 'Du';
  const identity = parseStudentIdentity(fullName);
  return identity.firstName;
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
  pseudonymLabel: string,
  signOff: string = 'Viele Grüße sendet Dir Tim',
  overrideGender?: 'male' | 'female'
): string {
  let restored = generatedFeedback;
  const identity = parseStudentIdentity(studentName, overrideGender);

  // Replace pseudonym placeholders
  const placeholderRegex = new RegExp(`\\b${escapeRegExp(pseudonymLabel)}\\b`, 'gi');
  restored = restored.replace(placeholderRegex, identity.firstName);

  // Strictly enforce grammatically correct first-name salutation and signoff
  return enforceSalutation(restored, studentName, signOff, overrideGender);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
