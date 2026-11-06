export interface CaptionLevel {
  id: string;
  units?: Array<{
    unit?: string;
    lessons?: Array<{
      id: string;
      exercises?: Array<{ video?: { src?: string; caption?: string; captions?: string | Record<string, string | null> } }>;
    }>;
  }>;
}

export interface CaptionReference {
  courseId: string | null;
  lessonId: string | null;
  conceptId: string | null;
  unit: string | null;
  source: 'lesson' | 'question-video';
  exerciseIndex: number | null;
  locale: string | null;
  captionPath: string;
  mediaPath: string | null;
  status: 'present' | 'missing' | 'not checked';
  cueCount: number | null;
  durationStatus: 'checked' | 'not checked';
  durationSeconds: number | null;
}

export interface CaptionFinding {
  courseId: string | null;
  lessonId: string | null;
  conceptId: string | null;
  captionPath: string;
  locale: string | null;
  code: string;
  cueIndex: number | null;
  [detail: string]: unknown;
}

export interface CaptionAudit {
  summary: {
    mediaRootPresent: boolean;
    captionReferenceCount: number;
    presentCaptionCount: number;
    missingCaptionCount: number;
    notCheckedCaptionCount: number;
    durationCheckedCount: number;
    durationNotCheckedCount: number;
    cueCount: number;
    findingCount: number;
  };
  declarations: CaptionReference[];
  findings: CaptionFinding[];
}

export function assertSafeCaptionPath(mediaRoot: string, mediaPath: string): string;
export function collectCaptionReferences(levels: CaptionLevel[], mediaManifest?: unknown): Array<{
  courseId: string | null;
  lessonId: string | null;
  conceptId: string | null;
  unit: string | null;
  source: 'lesson' | 'question-video';
  exerciseIndex: number | null;
  locale: string | null;
  captionPath: string;
  mediaPath: string | null;
}>;
export function auditCaptions(options: {
  levels?: CaptionLevel[];
  mediaManifest?: unknown;
  mediaRoot: string;
  durations?: Record<string, number>;
}): CaptionAudit;
export function renderSummary(audit: CaptionAudit): string;
