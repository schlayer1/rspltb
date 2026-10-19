import JSZip from 'jszip';
import { StudentSubmission } from '../types';

/**
 * Creates and downloads a Moodle-compatible ZIP package.
 * When Moodle exports a ZIP, each student has a folder like:
 * "Max Mustermann_123456_assignsubmission_file_/Lerntagebuch.pdf"
 * We recreate this folder and place "Feedback_Tim.txt" inside it.
 * Teachers can re-upload this ZIP in Moodle using "Feedback-Dateien in Zip-Datei hochladen".
 */
export async function generateMoodleFeedbackZip(submissions: StudentSubmission[]): Promise<Blob> {
  const zip = new JSZip();

  for (const sub of submissions) {
    const feedbackText = sub.editedFeedback || sub.generatedFeedback;
    if (!feedbackText.trim()) continue;

    const folderPath = sub.folderPath.replace(/\\/g, '/');
    const segments = folderPath.split('/');

    if (segments.length > 1) {
      // Recreate parent folder (e.g. "Max Mustermann_123456_assignsubmission_file_")
      const folderName = segments.slice(0, -1).join('/');
      const feedbackFilePath = `${folderName}/Feedback_Tim.txt`;
      zip.file(feedbackFilePath, feedbackText);
    } else {
      // Direct file fallback
      const safeName = sub.studentName.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
      zip.file(`Feedback_Tim_${safeName}.txt`, feedbackText);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates an Excel-ready CSV/TSV table of all feedbacks.
 * Includes UTF-8 BOM (\uFEFF) so Excel on Windows & Mac displays German Umlaute flawlessly.
 */
export function generateFeedbackCsv(submissions: StudentSubmission[]): Blob {
  const headers = ['ID', 'Studierende/r', 'Original-Datei', 'Wörter', 'Status', 'Feedback von Tim'];
  
  const rows = submissions.map(sub => {
    const feedback = (sub.editedFeedback || sub.generatedFeedback || '').replace(/"/g, '""');
    return [
      `"${sub.id}"`,
      `"${sub.studentName}"`,
      `"${sub.rawFileName}"`,
      `"${sub.wordCount}"`,
      `"${sub.status}"`,
      `"${feedback}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generates a clean Markdown summary document for all feedbacks
 */
export function generateFeedbackSummaryMarkdown(
  submissions: StudentSubmission[],
  seminarTitle: string = 'Reflexion schulischer Praxis (Uni Jena)'
): Blob {
  const lines: string[] = [
    `# Gesamtauswertung: Lerntagebücher Feedback`,
    `**Seminar:** ${seminarTitle}`,
    `**Datum:** ${new Date().toLocaleDateString('de-DE')}`,
    `**Gesamtzahl:** ${submissions.length} Einreichungen`,
    '',
    '---',
    ''
  ];

  submissions.forEach((sub, idx) => {
    const feedback = sub.editedFeedback || sub.generatedFeedback || '*(Kein Feedback hinterlegt)*';
    lines.push(`## ${idx + 1}. ${sub.studentName}`);
    lines.push(`- **Datei:** \`${sub.rawFileName}\` (${sub.wordCount} Wörter)`);
    lines.push(`- **Status:** ${sub.status}`);
    lines.push('');
    lines.push('### Feedback:');
    lines.push(feedback);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
}

/**
 * Triggers a direct browser file download
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
