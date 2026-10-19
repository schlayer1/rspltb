export type TurnusId = 'ltb1' | 'ltb2' | 'ltb3' | 'ltb4' | 'ltb5' | 'ltb6';

export interface ProblemCluster {
  category: string; // e.g. "Unterrichtsstörungen & Disziplin", "Raumpräsenz & Körpersprache", "Deeskalation & Beziehungsarbeit", "Differenzierung & Lerntempo", "Rollenwechsel & Autorität"
  snippet: string; // 1-sentence concrete case description from student text
}

export interface SuggestedFocus {
  category: string; // e.g. "Rollenwechsel & Lehrkraft-Selbstverständnis"
  reason: string;   // e.g. "Der Student reflektiert intensiv über die Rollenfindung..."
}

export interface StudentSubmission {
  id: string;
  matrikelnummer?: string; // FSU Matrikelnummer e.g. "1546331" from "Arthur Mika_1546331_assignsubmission_file"
  moodleId: string; // alias for matrikelnummer for backwards compatibility
  studentName: string; // e.g. "Arthur Mika"
  gender?: 'male' | 'female';
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
  abstract?: string; // 2-3 sentence AI abstract of the LTB
  suggestedFocus?: SuggestedFocus; // AI recommended perspective
  problemCluster?: ProblemCluster;
  errorMessage?: string;
  angleIndex?: number;
  timestamp?: number;
  originalFileBlob?: Blob;
}

export interface StudentProfile {
  id: string; // usually matrikelnummer or normalized student name
  matrikelnummer?: string;
  moodleId: string;
  fullName: string;
  gender?: 'male' | 'female'; // User-toggleable in SemesterPortfolio
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
