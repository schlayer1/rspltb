export type TurnusId = 'ltb1' | 'ltb2' | 'ltb3' | 'ltb4' | 'ltb5' | 'ltb6';

export interface ProblemCluster {
  category: string; // e.g. "Unterrichtsstörungen & Disziplin", "Raumpräsenz & Körpersprache", "Deeskalation & Beziehungsarbeit", "Differenzierung & Lerntempo", "Rollenwechsel & Autorität"
  snippet: string; // 1-sentence concrete case description from student text
}

export interface StudentSubmission {
  id: string;
  moodleId: string; // e.g. "1546331" from "Arthur Mika_1546331_assignsubmission_file"
  studentName: string; // e.g. "Arthur Mika"
  turnus: TurnusId;
  rawFileName: string;
  folderPath: string; // Original Moodle folder path for ZIP reconstruction
  fileType: 'pdf' | 'docx' | 'txt' | 'other';
  rawText: string;
  wordCount: number;
  pseudonym: string; // e.g. "Studierende/r #1"
  status: 'pending' | 'processing' | 'completed' | 'approved' | 'error';
  generatedFeedback: string;
  editedFeedback: string;
  problemCluster?: ProblemCluster;
  errorMessage?: string;
  angleIndex?: number;
  timestamp?: number;
  originalFileBlob?: Blob;
}

export interface StudentProfile {
  id: string; // usually moodleId or normalized student name
  moodleId: string;
  fullName: string;
  submissions: Partial<Record<TurnusId, StudentSubmission>>;
  semesterSummaryFeedback?: string;
  summaryApproved?: boolean;
}

export interface SeminarDatabase {
  students: Record<string, StudentProfile>; // keyed by moodleId or name
  activeTurnus: TurnusId;
  lastUpdated: number;
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
  criteria: {
    observeAction: boolean;
    selfReflection: boolean;
    theoryPractice: boolean;
    constructivePerspective: boolean;
  };
}

export interface ProcessingProgress {
  total: number;
  current: number;
  currentStudentName: string;
  currentStepText?: string;
  activeAngleName?: string;
  isProcessing: boolean;
  isPaused: boolean;
  errorsCount: number;
}
