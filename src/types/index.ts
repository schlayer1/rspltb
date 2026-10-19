export interface StudentSubmission {
  id: string;
  rawFileName: string;
  folderPath: string; // Original Moodle folder path for ZIP reconstruction
  studentName: string; // Extracted student name
  fileType: 'pdf' | 'docx' | 'txt' | 'other';
  rawText: string;
  wordCount: number;
  pseudonym: string; // e.g. "Studierende/r #1"
  status: 'pending' | 'processing' | 'completed' | 'approved' | 'error';
  generatedFeedback: string;
  editedFeedback: string;
  errorMessage?: string;
  angleIndex?: number;
  timestamp?: number;
  originalFileBlob?: Blob;
}

export type FeedbackTone = 'appreciative' | 'collegial_reflective' | 'didactic_focus';

export interface EvaluationSettings {
  apiKey: string;
  selectedModel: string;
  lecturerName: string;
  basePrompt: string;
  antiAiMode: boolean;
  pseudonymize: boolean;
  maxSentences: number;
  tone: FeedbackTone;
  signOff: string;
  rateLimitDelaySeconds: number;
  // Specific seminar criteria checkboxes
  criteria: {
    observeAction: boolean; // Schilderung konkreter Unterrichtsmomente
    selfReflection: boolean; // Reflexion der eigenen Rolle / Lehrer-Schüler-Interaktion
    theoryPractice: boolean; // Brückenschlag Theorie vs. Praxis
    constructivePerspective: boolean; // Konstruktiver Ausblick für das weitere Lehramtsstudium
  };
}

export interface ProcessingProgress {
  total: number;
  current: number;
  currentStudentName: string;
  isProcessing: boolean;
  isPaused: boolean;
  errorsCount: number;
}
