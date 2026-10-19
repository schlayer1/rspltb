import { SemesterData } from '../types';

export const DEFAULT_SEMESTER_ID = 'WS26/27';

/**
 * Wandelt ein Semesterkürzel (z. B. "WS26/27" oder "SS27") in eine lesbare Bezeichnung um.
 */
export function formatSemesterLabel(semesterId: string): string {
  if (!semesterId) return 'Unbekanntes Semester';

  const clean = semesterId.trim().toUpperCase();

  // Match Wintersemester: WS26/27
  const wsMatch = clean.match(/^WS\s*(\d{2})\/(\d{2})$/);
  if (wsMatch) {
    const y1 = wsMatch[1];
    const y2 = wsMatch[2];
    return `Wintersemester 20${y1}/${y2} (WS ${y1}/${y2})`;
  }

  // Match Sommersemester: SS27 or SOSE27
  const ssMatch = clean.match(/^(?:SS|SOSE)\s*(\d{2})$/);
  if (ssMatch) {
    const y = ssMatch[1];
    return `Sommersemester 20${y} (SS ${y})`;
  }

  // Fallback for custom names
  return semesterId;
}

/**
 * Kurzbezeichnung für kompakte Badges und Tabs, z. B. "WS 26/27" oder "SS 27"
 */
export function formatSemesterShort(semesterId: string): string {
  if (!semesterId) return '';
  const clean = semesterId.trim().toUpperCase();

  const wsMatch = clean.match(/^WS\s*(\d{2})\/(\d{2})$/);
  if (wsMatch) {
    return `WS ${wsMatch[1]}/${wsMatch[2]}`;
  }

  const ssMatch = clean.match(/^(?:SS|SOSE)\s*(\d{2})$/);
  if (ssMatch) {
    return `SS ${ssMatch[1]}`;
  }

  return semesterId;
}

/**
 * Berechnet das darauffolgende Semester deterministisch:
 * WS26/27 -> SS27 -> WS27/28 -> SS28 -> WS28/29 -> etc.
 */
export function getNextSemesterId(semesterId: string): string {
  const clean = semesterId.trim().toUpperCase();

  // Wenn Wintersemester: WS26/27 -> nachfolgend ist SS27
  const wsMatch = clean.match(/^WS\s*(\d{2})\/(\d{2})$/);
  if (wsMatch) {
    const endYear = wsMatch[2];
    return `SS${endYear}`;
  }

  // Wenn Sommersemester: SS27 -> nachfolgend ist WS27/28
  const ssMatch = clean.match(/^(?:SS|SOSE)\s*(\d{2})$/);
  if (ssMatch) {
    const startYearNum = parseInt(ssMatch[1], 10);
    const endYearNum = (startYearNum + 1) % 100;
    const y1 = startYearNum.toString().padStart(2, '0');
    const y2 = endYearNum.toString().padStart(2, '0');
    return `WS${y1}/${y2}`;
  }

  // Fallback
  return `${semesterId}_folge`;
}

/**
 * Berechnet das vorangegangene Semester:
 * SS27 -> WS26/27 -> SS26 -> WS25/26
 */
export function getPreviousSemesterId(semesterId: string): string {
  const clean = semesterId.trim().toUpperCase();

  const wsMatch = clean.match(/^WS\s*(\d{2})\/(\d{2})$/);
  if (wsMatch) {
    const startYear = wsMatch[1];
    return `SS${startYear}`;
  }

  const ssMatch = clean.match(/^(?:SS|SOSE)\s*(\d{2})$/);
  if (ssMatch) {
    const currentYearNum = parseInt(ssMatch[1], 10);
    const prevYearNum = (currentYearNum - 1 + 100) % 100;
    const y1 = prevYearNum.toString().padStart(2, '0');
    const y2 = currentYearNum.toString().padStart(2, '0');
    return `WS${y1}/${y2}`;
  }

  return semesterId;
}

/**
 * Vordefinierte Standard-Semester von 2025 bis 2031 für schnelle Schnellauswahl
 */
export const PRECONFIGURED_SEMESTERS = [
  'WS25/26',
  'SS26',
  'WS26/27',
  'SS27',
  'WS27/28',
  'SS28',
  'WS28/29',
  'SS29',
  'WS29/30',
  'SS30',
  'WS30/31'
];

/**
 * Erstellt ein neues leeres Semester-Datenobjekt
 */
export function createEmptySemester(semesterId: string): SemesterData {
  return {
    id: semesterId,
    label: formatSemesterLabel(semesterId),
    students: {},
    activeTurnus: 'ltb1',
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };
}
