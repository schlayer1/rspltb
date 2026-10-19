import { SeminarDatabase, StudentProfile, StudentSubmission, TurnusId } from '../types';

const DB_NAME = 'RSP_LTB_Database_v1';
const STORE_NAME = 'seminar_store';
const DB_VERSION = 1;

export function getInitialDatabase(): SeminarDatabase {
  return {
    students: {},
    activeTurnus: 'ltb1',
    lastUpdated: Date.now()
  };
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

export async function loadDatabase(): Promise<SeminarDatabase> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_seminar');

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as SeminarDatabase);
        } else {
          const initial = getInitialDatabase();
          resolve(initial);
        }
      };

      req.onerror = () => resolve(getInitialDatabase());
    });
  } catch (err) {
    console.warn('Fehler beim Laden von IndexedDB, nutze Speicherzustand:', err);
    return getInitialDatabase();
  }
}

export async function saveDatabase(data: SeminarDatabase): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const updated = { ...data, lastUpdated: Date.now() };
      const req = store.put(updated, 'current_seminar');

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Fehler beim Speichern in IndexedDB:', err);
  }
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
    const studentMatr = sub.matrikelnummer || sub.moodleId;
    const studentKey = studentMatr || sub.studentName.toLowerCase().replace(/\s+/g, '_');

    let profile: StudentProfile = updatedStudents[studentKey] || {
      id: studentKey,
      matrikelnummer: studentMatr,
      moodleId: studentMatr,
      fullName: sub.studentName,
      submissions: {}
    };

    if (studentMatr) {
      profile.matrikelnummer = studentMatr;
      profile.moodleId = studentMatr;
    }
    if (sub.studentName) {
      profile.fullName = sub.studentName;
    }

    const existingSubmission = profile.submissions[subTurnus];

    if (existingSubmission && (existingSubmission.status === 'completed' || existingSubmission.status === 'approved')) {
      // Preserve existing feedback, only update raw file text/path if needed
      profile.submissions[subTurnus] = {
        ...sub,
        turnus: subTurnus,
        status: existingSubmission.status,
        generatedFeedback: existingSubmission.generatedFeedback,
        editedFeedback: existingSubmission.editedFeedback,
        problemCluster: existingSubmission.problemCluster || sub.problemCluster,
        angleIndex: existingSubmission.angleIndex
      };
      preservedCount++;
    } else if (existingSubmission) {
      // Existing pending or error submission being reloaded
      profile.submissions[subTurnus] = { ...sub, turnus: subTurnus };
      updatedCount++;
    } else {
      // New submission for this turnus
      profile.submissions[subTurnus] = { ...sub, turnus: subTurnus };
      addedCount++;
    }

    updatedStudents[studentKey] = profile;
  }

  return {
    updatedDb: {
      ...existingDb,
      students: updatedStudents,
      lastUpdated: Date.now()
    },
    addedCount,
    updatedCount,
    preservedCount
  };
}

export function exportDatabaseToJson(db: SeminarDatabase): Blob {
  const jsonStr = JSON.stringify(db, null, 2);
  return new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
}

export async function importDatabaseFromJson(file: File): Promise<SeminarDatabase> {
  const text = await file.text();
  const parsed = JSON.parse(text) as SeminarDatabase;
  if (!parsed.students) {
    throw new Error('Ungültiges Backup-Format: Keine Studierendendaten gefunden.');
  }
  await saveDatabase(parsed);
  return parsed;
}
