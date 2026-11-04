import { useEffect, useMemo } from 'react';
import { narrate, useVoice } from '../lib/narrator';
import { sfx } from '../lib/sound';
import type { LessonOutcome } from './LessonScreen';
import dialogue from '../data/britjoy-dialogue.json';
import { pick } from '../lib/util';
import { Britjoy, BritjoySays } from './Britjoy';
import { Button } from './Button';
import { useT } from '../i18n';
import { PromoCard } from './PromoCard';
import { useProgressStore } from '../store/useProgressStore';

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
  const speaking = useVoice((v) => v.speaking);
  const t = useT();
  useEffect(() => {
    if (outcome.passed) sfx.complete();
    else sfx.heart();
    const t = window.setTimeout(() => void narrate(line), outcome.passed ? 900 : 300);
    return () => window.clearTimeout(t);
  }, [outcome.passed, line]);
  const accuracy = Math.round((outcome.correct / Math.max(1, outcome.correct + outcome.mistakes)) * 100);

  return (
    <div className="paper mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <Britjoy expression={outcome.passed ? 'celebrating' : 'sad'} size={230} speaking={speaking} />
      <div>
        <h1 className={`text-3xl font-black ${outcome.passed ? 'text-[#FFC800]' : 'text-bad'}`}>
          {outcome.passed ? t('result.done') : t('result.noHearts')}
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
              <p className="py-1 text-xs font-black uppercase text-white">{t('result.xp')}</p>
              <p className="rounded-b-xl bg-white py-3 text-2xl font-black text-[#E5A800]">⚡ {outcome.xp}</p>
            </div>
            <div className="rounded-2xl border-2 border-brand bg-brand">
              <p className="py-1 text-xs font-black uppercase text-white">{t('result.accuracy')}</p>
              <p className="rounded-b-xl bg-white py-3 text-2xl font-black text-brand">🎯 {accuracy}%</p>
            </div>
          </div>
        </>
      )}

      <BritjoySays expression={outcome.passed ? 'happy' : 'sad'} size={84} className="w-full text-left">
        {line}
      </BritjoySays>

      <PromoCard
        seed={useProgressStore.getState().xp}
        onOpenPlus={() => {
          useProgressStore.getState().setTab('plus');
          onContinue();
        }}
      />

      <Button block onClick={onContinue} variant={outcome.passed ? 'primary' : 'outline'}>
        {outcome.passed ? t('result.continue') : t('result.back')}
      </Button>
    </div>
  );
}
