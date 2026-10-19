import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { StudentSubmission } from '../types';

// Set up PDF.js worker via Vite's ?url asset loader
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Intelligent extraction of student name from Moodle directory / file name.
 * Typical Moodle patterns:
 * 1) "Max Mustermann_123456_assignsubmission_file_/Lerntagebuch_Max.pdf"
 * 2) "Mustermann, Max_123456_assignsubmission_file_/dokument.pdf"
 * 3) "LTB_Mustermann_Max.pdf"
 * 4) "Max_Mustermann_Lerntagebuch.docx"
 */
export function extractStudentNameFromPath(path: string): string {
  // Normalize slashes
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');

  // Check if inside a Moodle submission folder
  for (const seg of segments) {
    if (seg.includes('_assignsubmission_file_') || seg.includes('_assignsubmission_onlinetext_')) {
      const folderStudent = seg.replace(/_\d+_assignsubmission.*/i, '').trim();
      if (folderStudent) {
        return cleanupStudentName(folderStudent);
      }
    }
  }

  // Fallback to filename
  const filename = segments[segments.length - 1] || path;
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  // Strip generic prefixes like LTB, Lerntagebuch, RSP, Seminar, etc.
  const cleaned = nameWithoutExt
    .replace(/^(lerntagebuch|ltb|rsp|portfolio|abgabe|hausarbeit|aufgabe)[_\s-]+/i, '')
    .replace(/[_\s-]+(lerntagebuch|ltb|rsp|abgabe|final|v\d+)$/i, '')
    .replace(/_\d+_assignsubmission.*/i, '');

  return cleanupStudentName(cleaned);
}

function cleanupStudentName(rawName: string): string {
  // If formatted like "Nachname, Vorname" -> "Vorname Nachname"
  if (rawName.includes(',')) {
    const parts = rawName.split(',');
    if (parts.length >= 2) {
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
  }
  // Replace underscores and extra hyphens with spaces
  const spaced = rawName.replace(/[_\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  // If in format "Nachname Vorname" or camelCase/PascalCase
  return spaced || 'Unbekannte/r Studierende/r';
}

/**
 * Extract text from PDF ArrayBuffer
 */
export async function parsePdfBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(pageString);
    }

    return pageTexts.join('\n\n').trim();
  } catch (err: any) {
    throw new Error(`PDF-Parsing fehlgeschlagen: ${err.message || String(err)}`);
  }
}

/**
 * Extract text from DOCX ArrayBuffer via Mammoth
 */
export async function parseDocxBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (err: any) {
    throw new Error(`Word (DOCX)-Parsing fehlgeschlagen: ${err.message || String(err)}`);
  }
}

/**
 * Extract plain text from TXT ArrayBuffer
 */
export function parseTxtBuffer(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(arrayBuffer).trim();
}

/**
 * Parse an uploaded ZIP file (typically exported from Moodle)
 */
export async function parseZipArchive(
  zipFile: File,
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<StudentSubmission[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const submissions: StudentSubmission[] = [];

  // Filter valid document files inside ZIP
  const validEntries: { path: string; file: JSZip.JSZipObject }[] = [];
  loadedZip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    // Skip OS files (e.g. __MACOSX, .DS_Store)
    if (relativePath.includes('__MACOSX') || relativePath.includes('.DS_Store')) return;

    const lower = relativePath.toLowerCase();
    if (lower.endsWith('.pdf') || lower.endsWith('.docx') || lower.endsWith('.txt')) {
      validEntries.push({ path: relativePath, file: zipEntry });
    }
  });

  let counter = 1;
  for (let i = 0; i < validEntries.length; i++) {
    const { path, file } = validEntries[i];
    const fileName = path.split('/').pop() || path;
    const lower = fileName.toLowerCase();

    if (onProgress) {
      onProgress(i + 1, validEntries.length, fileName);
    }

    try {
      const arrayBuffer = await file.async('arraybuffer');
      let rawText = '';
      let fileType: StudentSubmission['fileType'] = 'other';

      if (lower.endsWith('.pdf')) {
        fileType = 'pdf';
        rawText = await parsePdfBuffer(arrayBuffer);
      } else if (lower.endsWith('.docx')) {
        fileType = 'docx';
        rawText = await parseDocxBuffer(arrayBuffer);
      } else if (lower.endsWith('.txt')) {
        fileType = 'txt';
        rawText = parseTxtBuffer(arrayBuffer);
      }

      const studentName = extractStudentNameFromPath(path);
      const words = rawText.split(/\s+/).filter(w => w.length > 0).length;

      submissions.push({
        id: `sub_${Date.now()}_${counter}`,
        rawFileName: fileName,
        folderPath: path,
        studentName,
        fileType,
        rawText,
        wordCount: words,
        pseudonym: `Studierende/r #${counter}`,
        status: 'pending',
        generatedFeedback: '',
        editedFeedback: '',
        originalFileBlob: new Blob([arrayBuffer])
      });
      counter++;
    } catch (err: any) {
      const studentName = extractStudentNameFromPath(path);
      submissions.push({
        id: `sub_${Date.now()}_${counter}`,
        rawFileName: fileName,
        folderPath: path,
        studentName,
        fileType: lower.endsWith('.pdf') ? 'pdf' : lower.endsWith('.docx') ? 'docx' : 'other',
        rawText: '',
        wordCount: 0,
        pseudonym: `Studierende/r #${counter}`,
        status: 'error',
        generatedFeedback: '',
        editedFeedback: '',
        errorMessage: err.message || 'Fehler beim Entpacken der Datei'
      });
      counter++;
    }
  }

  return submissions;
}

/**
 * Handle direct individual file uploads (PDF/DOCX/TXT)
 */
export async function parseDirectFiles(
  files: File[],
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<StudentSubmission[]> {
  const submissions: StudentSubmission[] = [];

  let counter = 1;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name;
    const lower = fileName.toLowerCase();

    if (onProgress) {
      onProgress(i + 1, files.length, fileName);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      let rawText = '';
      let fileType: StudentSubmission['fileType'] = 'other';

      if (lower.endsWith('.pdf')) {
        fileType = 'pdf';
        rawText = await parsePdfBuffer(arrayBuffer);
      } else if (lower.endsWith('.docx')) {
        fileType = 'docx';
        rawText = await parseDocxBuffer(arrayBuffer);
      } else if (lower.endsWith('.txt')) {
        fileType = 'txt';
        rawText = parseTxtBuffer(arrayBuffer);
      }

      const studentName = extractStudentNameFromPath(fileName);
      const words = rawText.split(/\s+/).filter(w => w.length > 0).length;

      submissions.push({
        id: `sub_direct_${Date.now()}_${counter}`,
        rawFileName: fileName,
        folderPath: fileName,
        studentName,
        fileType,
        rawText,
        wordCount: words,
        pseudonym: `Studierende/r #${counter}`,
        status: 'pending',
        generatedFeedback: '',
        editedFeedback: '',
        originalFileBlob: file
      });
      counter++;
    } catch (err: any) {
      submissions.push({
        id: `sub_direct_${Date.now()}_${counter}`,
        rawFileName: fileName,
        folderPath: fileName,
        studentName: extractStudentNameFromPath(fileName),
        fileType: 'other',
        rawText: '',
        wordCount: 0,
        pseudonym: `Studierende/r #${counter}`,
        status: 'error',
        generatedFeedback: '',
        editedFeedback: '',
        errorMessage: err.message || 'Fehler beim Lesen der Datei'
      });
      counter++;
    }
  }

  return submissions;
}
