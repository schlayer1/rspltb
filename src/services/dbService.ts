import { SeminarDatabase, SemesterData, MultiSemesterDatabase, StudentProfile, StudentSubmission, TurnusId } from '../types';
import { parseStudentIdentity } from './nameSalutationService';
import { DEFAULT_SEMESTER_ID, createEmptySemester, formatSemesterLabel } from './semesterService';
import { 
  consolidateDuplicateStudents, 
  findMatchingStudent, 
  normalizeStudentName, 
  extractMatrikelnummerFromText 
} from './studentMergeService';

const DB_NAME = 'RSP_LTB_Database_v1';
const STORE_NAME = 'seminar_store';
const DB_VERSION = 1;

export function getInitialMultiDatabase(): MultiSemesterDatabase {
  return {
    activeSemesterId: DEFAULT_SEMESTER_ID,
    semesters: {
      [DEFAULT_SEMESTER_ID]: createEmptySemester(DEFAULT_SEMESTER_ID)
    },
    version: 2,
    lastBackupTimestamp: undefined,
    unbackedChangesCount: 0
  };
}

export function getInitialDatabase(): SeminarDatabase {
  return createEmptySemester(DEFAULT_SEMESTER_ID);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB wird von diesem Browser nicht unterstützt.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lädt die MultiSemesterDatabase und migriert alte Single-Seminar-Datenbanken verlustfrei ins WS26/27.
 */
export async function loadMultiDatabase(): Promise<MultiSemesterDatabase> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_seminar');

      req.onsuccess = async () => {
        if (req.result) {
          const raw = req.result as any;

          // Fall 1: Bereits modernes Multi-Semester-Format
          if (raw.semesters && raw.activeSemesterId) {
            const multi = raw as MultiSemesterDatabase;
            let hadConsolidation = false;
            
            // Automatische Konsolidierung von Duplikaten über alle Semester hinweg
            for (const semId of Object.keys(multi.semesters)) {
              const sem = multi.semesters[semId];
              if (sem && sem.students) {
                const { consolidated, mergedCount } = consolidateDuplicateStudents(sem.students);
                if (mergedCount > 0) {
                  sem.students = consolidated;
                  sem.lastUpdated = Date.now();
                  hadConsolidation = true;
                  console.info(`[Auto-Konsolidierung] ${mergedCount} doppelte Studierende in Semester ${semId} erfolgreich zusammengeführt.`);
                }
              }
            }

            if (hadConsolidation) {
              await saveMultiDatabase(multi);
            }

            resolve(multi);
            return;
          }

          // Fall 2: Migration von Legacy-Single-Seminar (z. B. bestehende 25 Studierende)
          if (raw.students) {
            const legacy = raw as SeminarDatabase;
            const { consolidated } = consolidateDuplicateStudents(legacy.students || {});

            const migrated: MultiSemesterDatabase = {
              activeSemesterId: DEFAULT_SEMESTER_ID,
              semesters: {
                [DEFAULT_SEMESTER_ID]: {
                  id: DEFAULT_SEMESTER_ID,
                  label: formatSemesterLabel(DEFAULT_SEMESTER_ID),
                  students: consolidated,
                  activeTurnus: legacy.activeTurnus || 'ltb1',
                  createdAt: Date.now(),
                  lastUpdated: legacy.lastUpdated || Date.now()
                }
              },
              version: 2,
              lastBackupTimestamp: undefined,
              unbackedChangesCount: 0
            };

            await saveMultiDatabase(migrated);
            resolve(migrated);
            return;
          }
        }

        const initial = getInitialMultiDatabase();
        resolve(initial);
      };

      req.onerror = () => resolve(getInitialMultiDatabase());
    });
  } catch (err) {
    console.warn('Fehler beim Laden von IndexedDB, nutze Speicherzustand:', err);
    return getInitialMultiDatabase();
  }
}

/**
 * Speichert die gesamte MultiSemesterDatabase in IndexedDB
 */
export async function saveMultiDatabase(data: MultiSemesterDatabase): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, 'current_seminar');

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Fehler beim Speichern in IndexedDB:', err);
  }
}

/**
 * Kompatibilitäts-Wrapper: Lädt das aktuell aktive Semester
 */
export async function loadDatabase(): Promise<SeminarDatabase> {
  const multi = await loadMultiDatabase();
  return multi.semesters[multi.activeSemesterId] || createEmptySemester(multi.activeSemesterId);
}

/**
 * Kompatibilitäts-Wrapper: Speichert Daten in das aktuell aktive Semester
 */
export async function saveDatabase(data: SeminarDatabase): Promise<void> {
  const multi = await loadMultiDatabase();
  const semId = data.id || multi.activeSemesterId;
  multi.semesters[semId] = { ...data, id: semId, lastUpdated: Date.now() };
  await saveMultiDatabase(multi);
}

/**
 * Merges incoming ZIP submissions into the persistent database incrementally:
 * - Matches students by moodleId or clean fullName
 * - Preserves existing approved/completed feedbacks for the same turnus
 * - Adds newly submitted students to the roster
 */
export function mergeIncrementalSubmissions(
  existingDb: SeminarDatabase,
  incomingSubmissions: StudentSubmission[],
  targetTurnus: TurnusId
): {
  updatedDb: SeminarDatabase;
  addedCount: number;
  updatedCount: number;
  preservedCount: number;
} {
  const updatedStudents: Record<string, StudentProfile> = { ...existingDb.students };
  let addedCount = 0;
  let updatedCount = 0;
  let preservedCount = 0;

  for (const sub of incomingSubmissions) {
    const subTurnus = sub.turnus || targetTurnus;

    // 1. Check for genuine university matrikelnummer in text if present
    const textMatrikel = sub.rawText ? extractMatrikelnummerFromText(sub.rawText) : undefined;
    const effectiveMatr = textMatrikel || sub.matrikelnummer;

    // 2. Intelligent Matcher: find student by Matrikelnummer, normalized name, or previous ID
    let profile = findMatchingStudent(updatedStudents, {
      fullName: sub.studentName,
      matrikelnummer: effectiveMatr,
      moodleId: sub.moodleId,
      rawText: sub.rawText
    });

    const detectedGender = parseStudentIdentity(sub.studentName).gender;

    if (!profile) {
      // New student profile
      const studentKey = effectiveMatr || normalizeStudentName(sub.studentName) || `stud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      profile = {
        id: studentKey,
        matrikelnummer: effectiveMatr,
        moodleId: sub.moodleId || effectiveMatr || '',
        fullName: sub.studentName,
        gender: detectedGender,
        submissions: {}
      };
      updatedStudents[studentKey] = profile;
    } else {
      // Existing student matched!
      if (effectiveMatr && (!profile.matrikelnummer || profile.matrikelnummer.length > 8)) {
        profile.matrikelnummer = effectiveMatr;
      }
      if (!profile.gender) {
        profile.gender = detectedGender;
      }
    }

    const existingSubmission = profile.submissions[subTurnus];

    if (existingSubmission && (existingSubmission.status === 'completed' || existingSubmission.status === 'approved')) {
      // Preserve existing feedback, only update raw file text/path if needed
      profile.submissions[subTurnus] = {
        ...sub,
        studentId: profile.id,
        turnus: subTurnus,
        gender: profile.gender,
        status: existingSubmission.status,
        generatedFeedback: existingSubmission.generatedFeedback,
        editedFeedback: existingSubmission.editedFeedback,
        abstract: existingSubmission.abstract || sub.abstract,
        suggestedFocus: existingSubmission.suggestedFocus || sub.suggestedFocus,
        problemCluster: existingSubmission.problemCluster || sub.problemCluster,
        angleIndex: existingSubmission.angleIndex
      };
      preservedCount++;
    } else if (existingSubmission) {
      // Existing pending or error submission being reloaded
      profile.submissions[subTurnus] = {
        ...sub,
        studentId: profile.id,
        turnus: subTurnus,
        gender: profile.gender,
        abstract: existingSubmission.abstract || sub.abstract,
        suggestedFocus: existingSubmission.suggestedFocus || sub.suggestedFocus
      };
      updatedCount++;
    } else {
      // New submission for this turnus
      profile.submissions[subTurnus] = {
        ...sub,
        studentId: profile.id,
        turnus: subTurnus,
        gender: profile.gender
      };
      addedCount++;
    }

    updatedStudents[profile.id] = profile;
  }

  // Final consolidation step guarantees no leftover duplicates
  const { consolidated } = consolidateDuplicateStudents(updatedStudents);

  return {
    updatedDb: {
      ...existingDb,
      students: consolidated,
      lastUpdated: Date.now()
    },
    addedCount,
    updatedCount,
    preservedCount
  };
}

export function exportMultiDatabaseToJson(db: MultiSemesterDatabase): Blob {
  const jsonStr = JSON.stringify(db, null, 2);
  return new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
}

export function exportSingleSemesterToJson(semesterData: SemesterData): Blob {
  const jsonStr = JSON.stringify(semesterData, null, 2);
  return new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
}

export function exportDatabaseToJson(db: SeminarDatabase | MultiSemesterDatabase): Blob {
  const jsonStr = JSON.stringify(db, null, 2);
  return new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
}

export async function importMultiDatabaseFromJson(
  file: File, 
  currentDb?: MultiSemesterDatabase
): Promise<MultiSemesterDatabase> {
  const text = await file.text();
  const parsed = JSON.parse(text) as any;

  // Fall A: Vollständiges MultiSemesterDatabase-Backup
  if (parsed.semesters && parsed.activeSemesterId) {
    const multi = parsed as MultiSemesterDatabase;
    for (const semId of Object.keys(multi.semesters)) {
      if (multi.semesters[semId]?.students) {
        const { consolidated } = consolidateDuplicateStudents(multi.semesters[semId].students);
        multi.semesters[semId].students = consolidated;
      }
    }
    await saveMultiDatabase(multi);
    return multi;
  }

  // Fall B: Einzelnes Semester-Backup oder Legacy-Backup
  if (parsed.students) {
    const { consolidated } = consolidateDuplicateStudents(parsed.students);
    const base = currentDb ? { ...currentDb } : getInitialMultiDatabase();
    const semId = parsed.id || base.activeSemesterId || DEFAULT_SEMESTER_ID;
    
    base.semesters = {
      ...base.semesters,
      [semId]: {
        id: semId,
        label: parsed.label || formatSemesterLabel(semId),
        students: consolidated,
        activeTurnus: parsed.activeTurnus || 'ltb1',
        createdAt: parsed.createdAt || Date.now(),
        lastUpdated: parsed.lastUpdated || Date.now()
      }
    };
    base.activeSemesterId = semId;
    await saveMultiDatabase(base);
    return base;
  }

  throw new Error('Ungültiges Backup-Format: Keine gültigen Semester- oder Studierendendaten gefunden.');
}

export async function importDatabaseFromJson(file: File): Promise<SeminarDatabase> {
  const multi = await importMultiDatabaseFromJson(file);
  return multi.semesters[multi.activeSemesterId];
}
