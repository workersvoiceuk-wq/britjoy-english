import { useEffect, useRef } from 'react';
import { mountQuestionVideoHelp } from '../shared/question-videos/question-video-help.mjs';
import '../shared/question-videos/question-video-help.css';

interface Props {
  lessonId: string;
  questionId?: string;
  locale: string;
  targetLanguage: string;
  track?: string;
  onStopAudio: () => void;
}

export function QuestionVideoHelp({ onStopAudio, ...context }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const stop = useRef(onStopAudio);
  stop.current = onStopAudio;
  const { lessonId, questionId, locale, targetLanguage, track } = context;
  useEffect(() => {
    if (!host.current) return;
    const controller = mountQuestionVideoHelp({
      lessonId, questionId, locale, targetLanguage, track,
      baseUrl: import.meta.env.BASE_URL,
      onStopAudio: () => stop.current(),
    });
    host.current.replaceChildren(controller.element);
    return () => {
      controller.destroy();
      controller.element.remove();
    };
  }, [lessonId, questionId, locale, targetLanguage, track]);
  return <div ref={host} data-question-video-help="" />;
}
