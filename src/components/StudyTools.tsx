/**
 * Study plan and smart review (the two tools Busuu is known for, in BritJoy's own
 * design): a weekly plan with an estimated finishing date, and spaced-repetition
 * review of the words from completed lessons.
 */
import { useMemo, useState } from 'react';
import { ALL_LEVELS, getLevel } from '../data/courses/en-es';
import { useProgressStore } from '../store/useProgressStore';
import { dueItems, question, strengthOf, vocabularyOf, type ReviewItem } from '../logic/review';
import { estimateFinish, weekStatus, type PlanGoal, type StudyPlan } from '../logic/plan';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { useT } from '../i18n';
import { Britjoy } from './Britjoy';

/** Words and phrases of every lesson the learner has completed. */
export function useVocabulary(): ReviewItem[] {
  const levels = useProgressStore((s) => s.levels);
  return useMemo(() => {
    const done = new Set(Object.values(levels).flatMap((l) => Object.keys(l.completedLessons)));
    const lessons = ALL_LEVELS.filter((lv) => lv.targetLanguage !== 'es')
      .flatMap((lv) => lv.units.flatMap((u) => u.lessons))
      .filter((l) => done.has(l.id));
    return vocabularyOf(lessons);
  }, [levels]);
}

const GOALS: { id: PlanGoal; icon: string; key: 'plan.goalLife' | 'plan.goalWork' | 'plan.goalTravel' | 'plan.goalExam' }[] = [
  { id: 'life', icon: '🇬🇧', key: 'plan.goalLife' },
  { id: 'work', icon: '💼', key: 'plan.goalWork' },
  { id: 'travel', icon: '✈️', key: 'plan.goalTravel' },
  { id: 'exam', icon: '📝', key: 'plan.goalExam' },
];

function weekdayNames(lang: string) {
  const monday = new Date(2026, 10, 2); // a Monday
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)),
  );
}

/** Mon–Sun row: planned days outlined, studied days filled. */
export function WeekStrip() {
  const t = useT();
  const { plan, xpByDay, uiLang } = useProgressStore();
  const week = weekStatus(plan, xpByDay, Date.now());
  const names = weekdayNames(uiLang ?? 'es');
  const planned = week.filter((d) => d.planned).length;
  const done = week.filter((d) => d.planned && d.studied).length;
  return (
    <div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label={t('plan.week')}>
        {week.map((d, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className={`text-xs font-black ${d.isToday ? 'text-royal' : 'text-ink-soft'}`}>{names[i]}</span>
            <span
              aria-label={`${names[i]}${d.studied ? ' ✓' : ''}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-black ${
                d.studied ? 'border-brand bg-brand text-white' : d.planned ? 'border-navy/40 bg-white text-navy/40' : 'border-transparent bg-ink-line/60 text-transparent'
              } ${d.isToday ? 'ring-2 ring-royal ring-offset-2' : ''}`}
            >
              {d.studied ? '✓' : '·'}
            </span>
          </li>
        ))}
      </ol>
      {plan && <p className="mt-2 text-sm font-bold text-ink-soft">{t('plan.thisWeek', { done, planned })}</p>}
    </div>
  );
}

/** Cards on the academy home: plan and review at a glance. */
export function StudyToolsCards() {
  const t = useT();
  const { plan, review, setTab } = useProgressStore();
  const vocab = useVocabulary();
  const due = dueItems(vocab, review, Date.now()).length;
  const counts = { weak: 0, medium: 0, strong: 0 };
  vocab.forEach((v) => counts[strengthOf(review[v.id])]++);
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-3xl border-2 border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-black text-navy">🗓️ {t('plan.title')}</h2>
          <button onClick={() => setTab('plan')} className="text-sm font-extrabold text-royal underline">
            {plan ? t('plan.edit') : t('plan.create')}
          </button>
        </div>
        <WeekStrip />
        {!plan && <p className="mt-2 text-sm font-semibold text-ink-soft">{t('plan.intro')}</p>}
      </div>
      <div className="rounded-3xl border-2 border-navy/10 bg-white p-4">
        <h2 className="text-lg font-black text-navy">🧠 {t('review.title')}</h2>
        {vocab.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-ink-soft">{t('review.none')}</p>
        ) : (
          <>
            <p className="mt-1 text-sm font-bold text-ink-soft">{t('review.words', { n: vocab.length })}</p>
            <StrengthBar weak={counts.weak} medium={counts.medium} strong={counts.strong} />
            <button
              onClick={() => setTab('review')}
              disabled={due === 0}
              className="press mt-3 w-full rounded-2xl border-b-4 border-navy-dark bg-navy py-3 font-black text-white disabled:border-[#C4C4C4] disabled:bg-[#E5E5E5] disabled:text-[#6B6B6B]"
            >
              {due > 0 ? `${t('review.start')} · ${t('review.due', { n: due })}` : t('review.allDone')}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function StrengthBar({ weak, medium, strong }: { weak: number; medium: number; strong: number }) {
  const t = useT();
  const total = Math.max(1, weak + medium + strong);
  return (
    <div className="mt-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-ink-line" aria-hidden>
        <span className="bg-royal" style={{ width: `${(weak / total) * 100}%` }} />
        <span className="bg-gold" style={{ width: `${(medium / total) * 100}%` }} />
        <span className="bg-brand" style={{ width: `${(strong / total) * 100}%` }} />
      </div>
      <p className="mt-1 flex justify-between text-xs font-bold text-ink-soft">
        <span>● {t('review.weak')} {weak}</span>
        <span>● {t('review.medium')} {medium}</span>
        <span>● {t('review.strong')} {strong}</span>
      </p>
    </div>
  );
}

/** Create or edit the study plan. */
export function StudyPlanScreen() {
  const t = useT();
  const { plan, setPlan, setTab, currentLevel, levels, uiLang } = useProgressStore();
  const [goal, setGoal] = useState<PlanGoal>(plan?.goal ?? 'life');
  const [days, setDays] = useState<number[]>(plan?.days ?? [0, 2, 4]);
  const [minutes, setMinutes] = useState(plan?.minutes ?? 15);
  const names = weekdayNames(uiLang ?? 'es');
  const level = getLevel(currentLevel);
  const lessons = level.units.flatMap((u) => u.lessons);
  const left = lessons.filter((l) => !levels[level.id]?.completedLessons[l.id]).length;
  const draft: StudyPlan = { goal, days, minutes, createdAt: plan?.createdAt ?? Date.now() };
  const finish = days.length ? estimateFinish(draft, left, Date.now()) : null;
  const choice = (on: boolean) => `tile px-2 text-center text-base ${on ? 'tile-selected' : ''}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-5">
      <section className="flex items-center gap-3 rounded-3xl bg-navy p-5 text-white">
        <Britjoy size={84} />
        <p className="font-semibold text-white/90">{t('plan.intro')}</p>
      </section>

      <section className="rounded-3xl border-2 border-navy/10 bg-white p-4">
        <h2 className="mb-2 text-lg font-black text-navy">{t('plan.goal')}</h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('plan.goal')}>
          {GOALS.map((g) => (
            <button key={g.id} role="radio" aria-checked={goal === g.id} onClick={() => setGoal(g.id)} className={choice(goal === g.id)}>
              <span aria-hidden className="me-1">{g.icon}</span>
              {t(g.key)}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-navy/10 bg-white p-4">
        <h2 className="mb-2 text-lg font-black text-navy">{t('plan.days')}</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {names.map((n, i) => (
            <button
              key={i}
              aria-pressed={days.includes(i)}
              aria-label={new Intl.DateTimeFormat(uiLang ?? 'es', { weekday: 'long' }).format(new Date(2026, 10, 2 + i))}
              onClick={() => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()))}
              className={`press h-11 rounded-full border-2 font-black ${days.includes(i) ? 'border-navy bg-navy text-white' : 'border-navy/20 bg-white text-navy'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-navy/10 bg-white p-4">
        <h2 className="mb-2 text-lg font-black text-navy">{t('plan.minutes')}</h2>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('plan.minutes')}>
          {[10, 15, 20, 30].map((m) => (
            <button key={m} role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)} className={choice(minutes === m)}>
              {t('plan.minutesValue', { n: m })}
            </button>
          ))}
        </div>
      </section>

      <p className="rounded-2xl bg-gold-light p-4 font-bold text-navy" role="status">
        {finish
          ? t('plan.estimate', { level: level.id, date: finish.toLocaleDateString(uiLang ?? 'es', { day: 'numeric', month: 'long', year: 'numeric' }) })
          : left === 0
            ? t('plan.done')
            : t('plan.days')}
      </p>

      <button
        disabled={days.length === 0}
        onClick={() => {
          sfx.correct();
          setPlan(draft);
          setTab('home');
        }}
        className="press w-full rounded-2xl border-b-4 border-royal-dark bg-royal py-4 text-lg font-black text-white disabled:opacity-60"
      >
        {t('plan.save')}
      </button>
    </div>
  );
}

/** One review session: Spanish prompt, pick the English, listen to it. */
export function ReviewScreen() {
  const t = useT();
  const { review, answerReview, setTab } = useProgressStore();
  const vocab = useVocabulary();
  const [session] = useState(() => dueItems(vocab, review, Date.now()));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [ok, setOk] = useState(0);
  const q = useMemo(() => (session[index] ? question(session[index], vocab) : null), [session, index, vocab]);

  if (!q) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 pb-32 pt-10 text-center">
        <Britjoy size={160} expression={session.length ? 'celebrating' : 'happy'} />
        <p className="text-xl font-black text-navy">
          {session.length ? t('review.finished', { ok, total: session.length }) : vocab.length ? t('review.allDone') : t('review.none')}
        </p>
        <button onClick={() => setTab('home')} className="press w-full rounded-2xl border-b-4 border-navy-dark bg-navy py-3 font-black text-white">
          {t('review.next')}
        </button>
      </div>
    );
  }

  const correct = picked === q.answer;
  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-5">
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-ink-line" role="progressbar" aria-label={t('review.title')} aria-valuemin={0} aria-valuemax={session.length} aria-valuenow={index}>
        <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${(index / session.length) * 100}%` }} />
      </div>
      <p className="text-sm font-black uppercase tracking-wide text-royal">{t('review.question')}</p>
      <h2 className="mt-1 text-2xl font-black text-ink">{q.prompt}</h2>
      <div className="mt-5 grid gap-2">
        {q.options.map((o) => (
          <button
            key={o}
            disabled={picked !== null}
            onClick={() => {
              setPicked(o);
              const right = o === q.answer;
              if (right) {
                setOk((n) => n + 1);
                sfx.correct();
              } else sfx.wrong();
              answerReview(session[index].id, right);
              void speak(q.answer);
            }}
            className={`tile w-full ${picked === null ? '' : o === q.answer ? 'tile-correct' : o === picked ? 'tile-wrong' : 'opacity-60'}`}
            lang="en"
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div role="status" className={`mt-4 rounded-2xl p-4 font-bold ${correct ? 'bg-brand-light text-brand-dark' : 'bg-bad-light text-bad-dark'}`}>
          {correct ? t('review.correct') : t('review.wrong', { answer: q.answer })}
          <div className="mt-3 flex gap-2">
            <button onClick={() => void speak(q.answer)} className="press rounded-xl border-2 border-current bg-white px-3 py-2 text-sm font-black">
              🔊 {t('review.listen')}
            </button>
            <button
              onClick={() => {
                setPicked(null);
                setIndex((i) => i + 1);
              }}
              className="press flex-1 rounded-xl border-b-4 border-navy-dark bg-navy px-3 py-2 font-black text-white"
            >
              {t('review.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
