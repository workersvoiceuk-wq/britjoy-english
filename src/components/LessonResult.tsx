import { useMemo } from 'react';
import type { LessonOutcome } from './LessonScreen';
import dialogue from '../data/britjoy-dialogue.json';
import { pick } from '../lib/util';
import { Britjoy, BritjoySays } from './Britjoy';
import { Button } from './Button';

interface Props {
  outcome: LessonOutcome;
  lessonTitle: string;
  onContinue: () => void;
}

export function LessonResult({ outcome, lessonTitle, onContinue }: Props) {
  const line = useMemo(
    () => (outcome.passed ? (outcome.mistakes === 0 ? dialogue.perfectLesson : pick(dialogue.lessonComplete)) : dialogue.outOfHearts),
    [outcome],
  );
  const accuracy = Math.round((outcome.correct / Math.max(1, outcome.correct + outcome.mistakes)) * 100);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <Britjoy expression={outcome.passed ? 'celebrating' : 'sad'} size={160} className={outcome.passed ? 'animate-float' : ''} />
      <div>
        <h1 className={`text-3xl font-black ${outcome.passed ? 'text-[#FFC800]' : 'text-bad'}`}>
          {outcome.passed ? '¡Lección completada!' : 'Sin vidas'}
        </h1>
        <p className="font-bold text-ink-soft">{lessonTitle}</p>
      </div>

      {outcome.passed && (
        <>
          <div className="text-4xl" aria-label={`${outcome.stars} estrellas`}>
            {[1, 2, 3].map((s) => (
              <span key={s} className={`inline-block animate-pop ${s <= outcome.stars ? 'text-[#FFC800]' : 'text-ink-line'}`} style={{ animationDelay: `${s * 120}ms` }}>
                ★
              </span>
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-[#FFC800] bg-[#FFC800]">
              <p className="py-1 text-xs font-black uppercase text-white">XP ganada</p>
              <p className="rounded-b-xl bg-white py-3 text-2xl font-black text-[#E5A800]">⚡ {outcome.xp}</p>
            </div>
            <div className="rounded-2xl border-2 border-brand bg-brand">
              <p className="py-1 text-xs font-black uppercase text-white">Precisión</p>
              <p className="rounded-b-xl bg-white py-3 text-2xl font-black text-brand">🎯 {accuracy}%</p>
            </div>
          </div>
        </>
      )}

      <BritjoySays expression={outcome.passed ? 'happy' : 'sad'} size={52} className="w-full text-left">
        {line}
      </BritjoySays>

      <Button block onClick={onContinue} variant={outcome.passed ? 'primary' : 'outline'}>
        {outcome.passed ? 'Continuar' : 'Volver al camino'}
      </Button>
    </div>
  );
}
