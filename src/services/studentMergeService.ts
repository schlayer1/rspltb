import { StudentProfile, StudentSubmission, TurnusId } from '../types';
import { parseStudentIdentity } from './nameSalutationService';

/**
 * Normalizes a student's full name into a canonical lowercase token string:
 * - Uses parseStudentIdentity to separate first and last name reliably
 * - Handles name inversions ("Kaulfuß, Fabian" vs. "Fabian Kaulfuß")
 * - Normalizes German umlauts (ä->ae, ö->oe, ü->ue, ß->ss)
 * - Strips non-alphanumeric characters
 * 
 * Example: "Fabian Kaulfuß" -> "fabian_kaulfuss"
 */
export function normalizeStudentName(name: string): string {
  if (!name || !name.trim()) return '';
  const identity = parseStudentIdentity(name);

  const cleanToken = (str: string) =>
    str
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const first = cleanToken(identity.firstName);
  const last = cleanToken(identity.lastName);

  if (first && last) {
    return `${first}_${last}`;
  }
  return first || last || cleanToken(name);
}

/**
 * Scans student submission text (PDF, DOCX, TXT) for a genuine 5-8 digit university Matrikelnummer.
 * Recognizes common German formats used by student teachers:
 * - "Matrikelnummer: 168463"
 * - "Matrikelnr. 168463"
 * - "Matr.-Nr.: 168463"
 * - "Matr. Nr. 168463"
 * - "Matrikel 168463"
 * - "MNr.: 168463"
 */
export function extractMatrikelnummerFromText(rawText: string): string | undefined {
  if (!rawText) return undefined;

  // Header inspection slice (first 3500 chars where student metadata usually resides)
  const headerSlice = rawText.slice(0, 3500);

  const regex = /(?:matrikel(?:nummer|-?nr\.?)|matr\.?\s*-?\s*nr\.?|mnr\.?|matrikel)\s*[:.\s-]*\s*(\d{5,8})\b/i;
  const match = headerSlice.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return undefined;
}

/**
 * Fallback parser: Extracts student name from document text when filename is generic (e.g. "LTB2.pdf").
 * Scans standard title/header lines in academic reflection portfolios.
 */
export function extractStudentNameFromText(rawText: string): string | undefined {
  if (!rawText) return undefined;
  const firstLines = rawText.slice(0, 2000).split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of firstLines) {
    // 1. "Name: Vorname Nachname" or "Autorin: Vorname Nachname"
    const nameMatch = line.match(/(?:Name|Autor(?:in)?|Verfasser(?:in)?|Studierende[r]?)\s*[:.\s-]+\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,3})/i);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }

    // 2. "Vorname Nachname - Matrikelnr..." or "Vorname Nachname / Lehramt..."
    const matrLineMatch = line.match(/^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2})\s*[-–/]\s*(?:Matrikel|Matr|Lehramt|Gymnasium|Regelschule)/i);
    if (matrLineMatch && matrLineMatch[1]) {
      return matrLineMatch[1].trim();
    }

    // 3. "Ich, Vorname Nachname, absolviere..."
    const ichMatch = line.match(/^Ich,\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2}),/i);
    if (ichMatch && ichMatch[1]) {
      return ichMatch[1].trim();
    }
  }

  return undefined;
}

/**
 * Finds an existing student profile in the database:
 * 1. Checks direct profile ID match
 * 2. Checks genuine Matrikelnummer match (5-8 digits)
 * 3. Checks normalized name match (e.g. "fabian_kaulfuss")
 * 4. Checks known moodleId
 */
export function findMatchingStudent(
  students: Record<string, StudentProfile>,
  candidate: {
    fullName: string;
    matrikelnummer?: string;
    moodleId?: string;
    rawText?: string;
    id?: string;
  }
): StudentProfile | undefined {
  if (!students) return undefined;

  // 1. Direct ID match
  if (candidate.id && students[candidate.id]) {
    return students[candidate.id];
  }

  // Extract candidate real matrikelnummer from text if available
  const textMatrikel = candidate.rawText ? extractMatrikelnummerFromText(candidate.rawText) : undefined;
  const candidateMatr = textMatrikel || candidate.matrikelnummer;
  const candidateNormName = normalizeStudentName(candidate.fullName);

  const studentList = Object.values(students);

  // 2. Match by genuine university Matrikelnummer (5 to 8 digits)
  if (candidateMatr && candidateMatr.length >= 5 && candidateMatr.length <= 8) {
    const matrMatch = studentList.find(s => s.matrikelnummer === candidateMatr);
    if (matrMatch) {
      return matrMatch;
    }
  }

  // 3. Match by normalized name (most robust within a single university seminar cohort)
  if (candidateNormName) {
    const nameMatch = studentList.find(s => normalizeStudentName(s.fullName) === candidateNormName);
    if (nameMatch) {
      return nameMatch;
    }
  }

  // 4. Match by moodleId
  if (candidate.moodleId) {
    const moodleMatch = studentList.find(s => s.moodleId === candidate.moodleId || s.id === candidate.moodleId);
    if (moodleMatch) {
      return moodleMatch;
    }
  }

  return undefined;
}

/**
 * Finds the student profile in database.students that owns a given submission.
 */
export function findStudentForSubmission(
  students: Record<string, StudentProfile>,
  sub: StudentSubmission
): StudentProfile | undefined {
  if (!students || !sub) return undefined;

  // 1. Direct studentId on submission
  if (sub.studentId && students[sub.studentId]) {
    return students[sub.studentId];
  }

  // 2. Scan students' submissions dictionary by submission ID
  for (const student of Object.values(students)) {
    if (Object.values(student.submissions).some(s => s?.id === sub.id)) {
      return student;
    }
  }

  // 3. Fallback: match by student identity
  return findMatchingStudent(students, {
    fullName: sub.studentName,
    matrikelnummer: sub.matrikelnummer,
    moodleId: sub.moodleId,
    rawText: sub.rawText
  });
}

/**
 * Consolidates duplicate student profiles in a semester database:
 * - Groups students by normalized name or genuine Matrikelnummer
 * - Merges submissions across all turnuses (LTB 1 to 6) without losing evaluations or feedbacks
 * - Ensures real Matrikelnummer from text is preserved
 * - Guarantees 1 student entity per human seminar participant
 */
export function consolidateDuplicateStudents(
  students: Record<string, StudentProfile>
): { consolidated: Record<string, StudentProfile>; mergedCount: number } {
  if (!students) return { consolidated: {}, mergedCount: 0 };

  const consolidated: Record<string, StudentProfile> = {};
  let mergedCount = 0;

  // Group student profiles by canonical key (normalized name or real matrikel)
  const groups = new Map<string, StudentProfile[]>();

  for (const student of Object.values(students)) {
    let realMatrikel = student.matrikelnummer;

    // Scan student submissions for genuine matrikelnummer if not already known
    for (const sub of Object.values(student.submissions)) {
      if (sub?.rawText) {
        const textMatr = extractMatrikelnummerFromText(sub.rawText);
        if (textMatr) {
          realMatrikel = textMatr;
          break;
        }
      }
    }

    const normName = normalizeStudentName(student.fullName);
    const groupKey = normName || (realMatrikel ? `matr_${realMatrikel}` : student.id);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push({
      ...student,
      matrikelnummer: realMatrikel || student.matrikelnummer
    });
  }

  for (const [, profileList] of groups.entries()) {
    if (profileList.length === 1) {
      // Single profile, no duplicate
      const single = profileList[0];
      consolidated[single.id] = single;
    } else {
      // Duplicate profiles detected! Merge all into master profile
      mergedCount += (profileList.length - 1);

      // Sort profiles: prefer profile that has existing evaluations or more submissions
      profileList.sort((a, b) => {
        const aFeedbacks = Object.values(a.submissions).filter(s => s?.status === 'completed' || s?.status === 'approved').length;
        const bFeedbacks = Object.values(b.submissions).filter(s => s?.status === 'completed' || s?.status === 'approved').length;
        if (bFeedbacks !== aFeedbacks) return bFeedbacks - aFeedbacks;
        return Object.keys(b.submissions).length - Object.keys(a.submissions).length;
      });

      const master = { ...profileList[0] };
      const mergedSubmissions: Partial<Record<TurnusId, StudentSubmission>> = { ...master.submissions };

      for (let i = 1; i < profileList.length; i++) {
        const dup = profileList[i];

        // Merge turnus submissions
        for (const [turnus, sub] of Object.entries(dup.submissions) as [TurnusId, StudentSubmission][]) {
          if (!sub) continue;
          const existing = mergedSubmissions[turnus];
          if (!existing) {
            mergedSubmissions[turnus] = {
              ...sub,
              studentId: master.id
            };
          } else if (
            existing.status !== 'completed' &&
            existing.status !== 'approved' &&
            (sub.status === 'completed' || sub.status === 'approved')
          ) {
            // Overwrite pending/error with completed/approved feedback
            mergedSubmissions[turnus] = {
              ...sub,
              studentId: master.id
            };
          }
        }

        // Gender override if set on dup
        if (!master.gender && dup.gender) {
          master.gender = dup.gender;
        }

        // Semester summary feedback if set on dup
        if (!master.semesterSummaryFeedback && dup.semesterSummaryFeedback) {
          master.semesterSummaryFeedback = dup.semesterSummaryFeedback;
          master.summaryApproved = dup.summaryApproved;
        }

        // Real Matrikelnummer if set on dup
        if (
          (!master.matrikelnummer || master.matrikelnummer.length > 8) &&
          dup.matrikelnummer &&
          dup.matrikelnummer.length <= 8
        ) {
          master.matrikelnummer = dup.matrikelnummer;
        }
      }

      // Link studentId on every submission to master.id
      for (const turnus of Object.keys(mergedSubmissions) as TurnusId[]) {
        if (mergedSubmissions[turnus]) {
          mergedSubmissions[turnus] = {
            ...mergedSubmissions[turnus]!,
            studentId: master.id,
            gender: master.gender || mergedSubmissions[turnus]!.gender
          };
        }
      }

      master.submissions = mergedSubmissions;
      consolidated[master.id] = master;
    }
  }

  return { consolidated, mergedCount };
}
