import { useMemo, useState } from 'react';
import placement from '../data/placement.json';
import dialogue from '../data/britjoy-dialogue.json';
import { LEVEL_IDS, getLevel } from '../data/courses/en-es';
import { suggestLevel, type PlacementAnswer } from '../logic/placement';
import { checkChoice } from '../logic/answer';
import { fill, shuffle } from '../lib/util';
import { Britjoy, BritjoySays } from './Britjoy';
import { Button } from './Button';
import { narrate } from '../lib/narrator';

interface Props {
  onFinish: (level: string | null) => void;
}

type Question = (typeof placement.questions)[number];

export function PlacementQuiz({ onFinish }: Props) {
  const [stage, setStage] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const questions: Question[] = placement.questions;
  const options = useMemo(() => shuffle(questions[index]?.options ?? []), [index, questions]);

  if (stage === 'intro') {
    return (
      <div className="paper mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-5 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <Britjoy expression="happy" size={240} />
          <h1 className="text-3xl font-black text-navy">Britjoy English</h1>
          <p className="font-bold text-ink-soft">Inglés A1 → C2 y vida en el Reino Unido</p>
        </div>
        <button className="text-left" onClick={() => void narrate(`${dialogue.welcome} ${dialogue.placementIntro}`)}>
          <div className="rounded-2xl border-2 border-navy/15 bg-white px-4 py-3 text-[15px] font-semibold leading-snug shadow-[0_2px_0_rgba(29,45,92,0.12)]">
            {dialogue.welcome} {dialogue.placementIntro}
            <span className="mt-1 block text-xs font-bold text-ink-soft">🔊 Toca para escuchar a Britjoy</span>
          </div>
        </button>
        <div className="flex flex-col gap-3">
          <Button block onClick={() => setStage('quiz')}>
            Hacer el test
          </Button>
          <Button block variant="outline" onClick={() => onFinish(null)}>
            {dialogue.placementSkip}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === 'result') {
    const level = suggestLevel(LEVEL_IDS, answers);
    const def = getLevel(level);
    const right = answers.filter((a) => a.correct).length;
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-5 py-10 text-center">
        <Britjoy expression="celebrating" size={220} className="mx-auto" />
        <div>
          <p className="text-sm font-extrabold uppercase text-ink-soft">
            {right}/{questions.length} correctas
          </p>
          <p className="mt-2 text-6xl font-black" style={{ color: def.accent }}>
            {level}
          </p>
          <p className="text-lg font-extrabold">{def.name}</p>
        </div>
        <BritjoySays size={84}>{fill(dialogue.placementResult, { level })}</BritjoySays>
        <div className="flex flex-col gap-3">
          <Button block onClick={() => onFinish(level)}>
            Empezar en {level}
          </Button>
          <Button block variant="outline" onClick={() => onFinish(null)}>
            {dialogue.placementSkip}
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const next = () => {
    if (choice === null) return;
    const updated = [...answers, { level: q.level, correct: checkChoice(choice, q.answer) }];
    setAnswers(updated);
    setChoice(null);
    if (index + 1 >= questions.length) setStage('result');
    else setIndex(index + 1);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => onFinish(null)} className="text-2xl text-ink-soft" aria-label="Saltar test">
          ✕
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-ink-line">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-extrabold text-ink-soft">
          {index + 1}/{questions.length}
        </span>
      </div>
      <h2 className="mb-6 text-2xl font-black">{q.prompt}</h2>
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button key={opt} onClick={() => setChoice(opt)} className={`tile ${choice === opt ? 'tile-selected' : ''}`}>
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-8">
        <Button block disabled={choice === null} onClick={next}>
          {index + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'}
        </Button>
      </div>
    </div>
  );
}
