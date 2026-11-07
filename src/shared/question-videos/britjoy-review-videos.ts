import { QUESTION_VIDEO_MANIFEST } from './question-video-help.mjs';
import clips from './britjoy-review-video-clips.json';

// Each clip may declare its folder (videos/ingles-a1, …); the A2 clips predate the field.
const folderOf = (clip: object) => (clip as { folder?: string }).folder ?? 'videos/ingles-a2';

const reviewConcepts = clips.map((clip) => ({
  conceptId: clip.id,
  courseId: 'ingles',
  avatarId: 'britjoy-ingles',
  avatarArt: null,
  status: 'ready',
  durationSeconds: clip.duration,
  title: clip.title,
  context: clip.notice ?? clip.cues[0].text,
  visualExample: {
    kind: 'steps',
    badge: ['Demostración de práctica', 'Practice demonstration'],
    heading: clip.title,
    steps: clip.cues.map(({ title, detail }) => [title[0], title[1], detail]),
  },
  practice: {
    prompt: ['Pausa el vídeo y prueba el ejemplo en voz alta.', 'Pause the video and say the example aloud.'],
    takeaway: clip.cues[2].text,
  },
  feedback: clip.cues[2].text,
  captions: clip.cues,
  sources: [clip.source],
  video: {
    src: `${folderOf(clip)}/${clip.id}.mp4`,
    narration: 'pending-original-voice',
    captions: {
      es: `${folderOf(clip)}/${clip.id}.es.vtt`,
      en: `${folderOf(clip)}/${clip.id}.en.vtt`,
    },
  },
  mappings: [{ courseId: 'ingles', lessonId: clip.lessonId, questionId: clip.questionId || undefined }],
}));

// The isolated review build keeps all existing question-help entries and adds these four exact mappings.
export const BRITJOY_REVIEW_VIDEO_MANIFEST = {
  ...QUESTION_VIDEO_MANIFEST,
  concepts: [...reviewConcepts, ...QUESTION_VIDEO_MANIFEST.concepts],
};
