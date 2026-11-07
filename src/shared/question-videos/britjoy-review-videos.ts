import { QUESTION_VIDEO_MANIFEST } from './question-video-help.mjs';
import clips from './britjoy-review-video-clips.json';

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
    src: `videos/ingles-a2/${clip.id}.mp4`,
    narration: 'pending-original-voice',
    captions: {
      es: `videos/ingles-a2/${clip.id}.es.vtt`,
      en: `videos/ingles-a2/${clip.id}.en.vtt`,
    },
  },
  mappings: [{ courseId: 'ingles', lessonId: clip.lessonId, questionId: clip.questionId || undefined }],
}));

// The isolated review build keeps all existing question-help entries and adds these four exact mappings.
export const BRITJOY_REVIEW_VIDEO_MANIFEST = {
  ...QUESTION_VIDEO_MANIFEST,
  concepts: [...reviewConcepts, ...QUESTION_VIDEO_MANIFEST.concepts],
};
