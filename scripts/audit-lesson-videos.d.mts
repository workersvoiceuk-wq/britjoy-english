export interface AuditLevel {
  id: string;
  name: string;
  track: string;
  targetLanguage?: string;
  units?: Array<{
    unit?: string;
    lessons?: Array<{
      id: string;
      exercises?: Array<{ video?: { src: string; poster?: string } }>;
    }>;
  }>;
}

export interface LessonVideoAudit {
  summary: {
    lessonCount: number;
    declarationCount: number;
    uniqueDeclaredFileCount: number;
    presentFileCount: number;
    missingFileCount: number;
    unreferencedFileCount: number;
  };
  declarations: Array<{
    courseId: string;
    courseName: string;
    track: string;
    targetLanguage: string | null;
    unit: string | undefined;
    lessonId: string;
    kind: 'video' | 'poster';
    path: string;
    status: 'present' | 'missing';
  }>;
  presentFiles: string[];
  missingFiles: string[];
  unreferencedFiles: string[];
}

export function assertSafeMediaPath(publicRoot: string, mediaPath: string): string;
export function auditLevels(levels: AuditLevel[], options?: { publicRoot?: string }): LessonVideoAudit;
export function renderSummary(audit: LessonVideoAudit): string;
