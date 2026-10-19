import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { StudentSubmission, TurnusId } from '../types';

// Set up PDF.js worker via Vite's ?url asset loader
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extracts student name from Moodle directory / file name.
 * Typical Moodle patterns:
 * - "Arthur Mika_1546331_assignsubmission_file_/Mika_LTB1.pdf"
 * - "Alexandra Philipp_1546349_assignsubmission_file_/Lerntagebuch.docx"
 */
export function extractStudentNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');

  // Check if inside a Moodle submission folder (e.g. "Arthur Mika_1546331_assignsubmission_file")
  for (const seg of segments) {
    if (seg.includes('_assignsubmission_file') || seg.includes('_assignsubmission_onlinetext')) {
      const folderStudent = seg.replace(/_\d+_assignsubmission.*/i, '').trim();
      if (folderStudent) {
        return cleanupStudentName(folderStudent);
      }
    }
  }

  // Fallback to filename
  const filename = segments[segments.length - 1] || path;
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  const cleaned = nameWithoutExt
    .replace(/^(lerntagebuch|ltb|rsp|portfolio|abgabe|hausarbeit|aufgabe)[_\s-]*/i, '')
    .replace(/[_\s-]*(lerntagebuch|ltb\d*|rsp|abgabe|final|v\d+)$/i, '')
    .replace(/_\d+_assignsubmission.*/i, '');

  return cleanupStudentName(cleaned);
}

/**
 * Extracts Moodle submission/student ID from directory name
 * e.g. "Arthur Mika_1546331_assignsubmission_file" -> "1546331"
 */
export function extractMoodleIdFromPath(path: string): string {
  const match = path.match(/_(\d{5,9})_assignsubmission/i);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback: search for any 5-8 digit number
  const numMatch = path.match(/\b(\d{5,8})\b/);
  return numMatch ? numMatch[1] : '';
}

/**
 * Detects which of the 6 turnuses (LTB 1 to 6) a file belongs to based on its name/path.
 * e.g. "Mika_LTB1.pdf" -> ltb1 (confident = true)
 * e.g. "Lerntagebuch.pdf" -> returns defaultTurnus (confident = false)
 */
export function detectTurnusFromPath(
  path: string,
  defaultTurnus: TurnusId = 'ltb1'
): { detectedTurnus: TurnusId; isConfident: boolean } {
  const lower = path.toLowerCase();

  const patterns: [RegExp, TurnusId][] = [
    [/ltb[-_\s]*1\b|lerntagebuch[-_\s]*1\b|abgabe[-_\s]*1\b/i, 'ltb1'],
    [/ltb[-_\s]*2\b|lerntagebuch[-_\s]*2\b|abgabe[-_\s]*2\b/i, 'ltb2'],
    [/ltb[-_\s]*3\b|lerntagebuch[-_\s]*3\b|abgabe[-_\s]*3\b/i, 'ltb3'],
    [/ltb[-_\s]*4\b|lerntagebuch[-_\s]*4\b|abgabe[-_\s]*4\b/i, 'ltb4'],
    [/ltb[-_\s]*5\b|lerntagebuch[-_\s]*5\b|abgabe[-_\s]*5\b/i, 'ltb5'],
    [/ltb[-_\s]*6\b|lerntagebuch[-_\s]*6\b|abgabe[-_\s]*6\b/i, 'ltb6']
  ];

  for (const [regex, turnus] of patterns) {
    if (regex.test(lower)) {
      return { detectedTurnus: turnus, isConfident: true };
    }
  }

  return { detectedTurnus: defaultTurnus, isConfident: false };
}

function cleanupStudentName(rawName: string): string {
  if (rawName.includes(',')) {
    const parts = rawName.split(',');
    if (parts.length >= 2) {
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
  }
  const spaced = rawName.replace(/[_\t]+/g, ' ').replace(/\s+/g, ' ').trim();
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
 * Recursively extracts files and relative paths from drag & drop items (folders and files).
 * Handles macOS Safari/Chrome folders seamlessly!
 */
export async function getFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<{ file: File; relativePath: string }[]> {
  const items = dataTransfer.items;
  const results: { file: File; relativePath: string }[] = [];

  if (!items || items.length === 0) {
    if (dataTransfer.files) {
      for (let i = 0; i < dataTransfer.files.length; i++) {
        const f = dataTransfer.files[i];
        results.push({ file: f, relativePath: f.webkitRelativePath || f.name });
      }
    }
    return results;
  }

  const entries: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
      if (entry) {
        entries.push(entry);
      } else {
        const f = item.getAsFile();
        if (f) results.push({ file: f, relativePath: f.name });
      }
    }
  }

  for (const entry of entries) {
    await scanEntry(entry, '', results);
  }

  return results;
}

async function scanEntry(entry: any, currentPath: string, results: { file: File; relativePath: string }[]): Promise<void> {
  if (entry.isFile) {
    const file: File = await new Promise((res, rej) => entry.file(res, rej));
    const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    results.push({ file, relativePath: fullPath });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const subEntries: any[] = await new Promise((res, rej) => {
      const all: any[] = [];
      function read() {
        dirReader.readEntries((entries: any[]) => {
          if (!entries || entries.length === 0) {
            res(all);
          } else {
            all.push(...entries);
            read(); // readEntries may batch in chunks of 100
          }
        }, rej);
      }
      read();
    });

    const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    for (const sub of subEntries) {
      await scanEntry(sub, nextPath, results);
    }
  }
}

/**
 * Parses a list of files with their relative folder paths (from dropped folders or <input webkitdirectory />)
 */
export async function parseFolderFileList(
  fileItems: { file: File; relativePath: string }[],
  targetTurnus: TurnusId = 'ltb1',
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<{ submissions: StudentSubmission[]; hasUncertainTurnus: boolean }> {
  const submissions: StudentSubmission[] = [];
  let hasUncertainTurnus = false;

  // Filter valid document files
  const valid = fileItems.filter(item => {
    const lower = item.relativePath.toLowerCase();
    if (lower.includes('__macosx') || lower.includes('.ds_store')) return false;
    return lower.endsWith('.pdf') || lower.endsWith('.docx') || lower.endsWith('.txt');
  });

  let counter = 1;
  for (let i = 0; i < valid.length; i++) {
    const { file, relativePath } = valid[i];
    const fileName = relativePath.split('/').pop() || file.name;
    const lower = fileName.toLowerCase();

    if (onProgress) {
      onProgress(i + 1, valid.length, fileName);
    }

    const { detectedTurnus, isConfident } = detectTurnusFromPath(relativePath, targetTurnus);
    if (!isConfident) {
      hasUncertainTurnus = true;
    }

    const moodleId = extractMoodleIdFromPath(relativePath);
    const studentName = extractStudentNameFromPath(relativePath);

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

      const words = rawText.split(/\s+/).filter(w => w.length > 0).length;

      submissions.push({
        id: `sub_${moodleId || Date.now()}_${detectedTurnus}_${counter}`,
        moodleId,
        studentName,
        turnus: detectedTurnus,
        rawFileName: fileName,
        folderPath: relativePath,
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
        id: `sub_${moodleId || Date.now()}_${detectedTurnus}_${counter}`,
        moodleId,
        studentName,
        turnus: detectedTurnus,
        rawFileName: fileName,
        folderPath: relativePath,
        fileType: lower.endsWith('.pdf') ? 'pdf' : lower.endsWith('.docx') ? 'docx' : 'other',
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

  return { submissions, hasUncertainTurnus };
}

/**
 * Parse an uploaded ZIP file (typically exported from Moodle)
 */
export async function parseZipArchive(
  zipFile: File,
  targetTurnus: TurnusId = 'ltb1',
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<{ submissions: StudentSubmission[]; hasUncertainTurnus: boolean }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const submissions: StudentSubmission[] = [];
  let hasUncertainTurnus = false;

  const validEntries: { path: string; file: JSZip.JSZipObject }[] = [];
  loadedZip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
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

    const { detectedTurnus, isConfident } = detectTurnusFromPath(path, targetTurnus);
    if (!isConfident) {
      hasUncertainTurnus = true;
    }

    const moodleId = extractMoodleIdFromPath(path);
    const studentName = extractStudentNameFromPath(path);

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

      const words = rawText.split(/\s+/).filter(w => w.length > 0).length;

      submissions.push({
        id: `sub_${moodleId || Date.now()}_${detectedTurnus}_${counter}`,
        moodleId,
        studentName,
        turnus: detectedTurnus,
        rawFileName: fileName,
        folderPath: path,
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
      submissions.push({
        id: `sub_${moodleId || Date.now()}_${detectedTurnus}_${counter}`,
        moodleId,
        studentName,
        turnus: detectedTurnus,
        rawFileName: fileName,
        folderPath: path,
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

  return { submissions, hasUncertainTurnus };
}

/**
 * Handle direct individual file uploads (PDF/DOCX/TXT)
 */
export async function parseDirectFiles(
  files: File[],
  targetTurnus: TurnusId = 'ltb1',
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<{ submissions: StudentSubmission[]; hasUncertainTurnus: boolean }> {
  const fileItems = files.map(f => ({
    file: f,
    relativePath: f.webkitRelativePath || f.name
  }));
  return parseFolderFileList(fileItems, targetTurnus, onProgress);
}
