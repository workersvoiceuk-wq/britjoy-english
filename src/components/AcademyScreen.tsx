import { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CATALOG, CATEGORIES, DOWNLOADS, courseStats, type CatalogCourse, type Category } from '../data/catalog';
import { completedByLevel, useProgressStore } from '../store/useProgressStore';
import { StudyToolsCards } from './StudyTools';
import { sfx } from '../lib/sound';
import { Britjoy } from './Britjoy';
import { Button } from './Button';
import { useT } from '../i18n';
import { achievements } from '../logic/achievements';
import { toDateKey, visibleStreak } from '../logic/gamification';
import { Certificate } from './Certificate';

// «Inglés para el día a día» is a separate paid course (UK, monthly); its free part is module 1.
const PRODUCT_PRICE_LABEL = 'Módulo 1 gratis · £12/mes';


function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-ink-line" aria-hidden>
      <span className="block h-full rounded-full transition-all" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </span>
  );
}

function CourseCard({ course, onOpen }: { course: CatalogCourse; onOpen: () => void }) {
  const levels = useProgressStore((s) => s.levels);
  const stats = courseStats(course, completedByLevel(levels));
  const pct = stats.lessons ? stats.done / stats.lessons : 0;
  const t = useT();
  const mods = t(stats.modules === 1 ? 'academy.module' : 'academy.modules', { n: stats.modules });
  const less = t(stats.lessons === 1 ? 'academy.lesson' : 'academy.lessons', { n: stats.lessons });
  return (
    <button
      onClick={() => {
        sfx.tap();
        onOpen();
      }}
      className="press group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-b-4 border-navy/10 bg-white text-left"
      aria-label={`${course.title}. ${mods}, ${less}. ${t('academy.viewCourse')}`}
    >
      <span className="relative flex h-28 items-center justify-between px-5" style={{ background: course.color }}>
        <span className="text-5xl drop-shadow" aria-hidden>{course.emoji}</span>
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-navy">{course.level}</span>
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span dir="auto" className="text-lg font-black leading-tight text-navy">{course.title}</span>
        <span dir="auto" className="mt-1 line-clamp-3 text-sm font-semibold text-ink-soft">{course.subtitle}</span>
        <span className="mt-3 flex flex-wrap gap-1.5">
          {course.badges.map((b) => (
            <span key={b} className="rounded-md bg-gold-light px-2 py-0.5 text-[11px] font-black text-gold-dark">{b}</span>
          ))}
        </span>
        <span className="mt-3 text-xs font-bold text-ink-soft">
          {mods} · {less} · {t('academy.hours', { n: stats.hours })} · <span className="text-brand-dark">{course.open.tab === 'product' ? PRODUCT_PRICE_LABEL : t('academy.free')}</span>
        </span>
        <span className="mt-auto pt-3">
          <ProgressBar value={pct} color={course.color} />
          <span className="mt-1 block text-xs font-bold text-ink-soft">
            {stats.done === 0 ? t('academy.notStarted') : t('academy.progress', { done: stats.done, total: stats.lessons, pct: Math.round(pct * 100) })}
          </span>
        </span>
      </span>
    </button>
  );
}

function CourseDetail({ course, onClose, onStart }: { course: CatalogCourse; onClose: () => void; onStart: () => void }) {
  const [cert, setCert] = useState(false);
  const levels = useProgressStore((s) => s.levels);
  const completed = completedByLevel(levels);
  const stats = courseStats(course, completed);
  const t = useT();
  const mods = t(stats.modules === 1 ? 'academy.module' : 'academy.modules', { n: stats.modules });
  const less = t(stats.lessons === 1 ? 'academy.lesson' : 'academy.lessons', { n: stats.lessons });
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={course.title}
        className="animate-slide-up max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-4 px-5 py-6 text-white" style={{ background: course.color }}>
          <span className="text-6xl" aria-hidden>{course.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wider">{course.level} · {course.open.tab === 'product' ? PRODUCT_PRICE_LABEL : t('academy.free')}</p>
            <h2 className="text-2xl font-black leading-tight">{course.title}</h2>
          </div>
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/20 px-2.5 py-1 text-lg" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-5 p-5">
          <p className="font-semibold text-ink">{course.subtitle}</p>
          <p className="text-sm font-bold text-ink-soft">
            {mods} · {less} · {t('academy.hours', { n: stats.hours })} · {t('academy.explained')}
          </p>
          <Button variant="primary" block onClick={onStart}>
            {stats.done ? t('academy.resume') : t('academy.start')}
          </Button>
          {stats.lessons > 0 && stats.done === stats.lessons && (
            <Button variant="outline" block onClick={() => setCert(true)}>
              🎓 {t('cert.button')}
            </Button>
          )}

          <section className="rounded-2xl border-2 border-navy/10 p-4">
            <h3 className="mb-2 text-lg font-black text-navy">{t('academy.learn')}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {course.learn.map((l) => (
                <li key={l} className="flex gap-2 text-[15px] font-semibold">
                  <span className="text-brand-dark" aria-hidden>✓</span>
                  {l}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-lg font-black text-navy">{t('academy.syllabus')}</h3>
            <ol className="space-y-2">
              {course.levels.flatMap((level) =>
                level.units.map((u) => {
                  const done = u.lessons.filter((l) => l.id in (completed[level.id] ?? {})).length;
                  return (
                    <li key={`${level.id}-${u.unit}`}>
                      <details className="rounded-2xl border-2 border-navy/10 bg-cream px-4 py-3">
                        <summary className="cursor-pointer list-none">
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-extrabold text-navy">
                              {u.icon && <span className="mr-2" aria-hidden>{u.icon}</span>}
                              {course.levels.length > 1 ? `${level.id} · ` : ''}
                              {u.title}
                            </span>
                            <span className="shrink-0 text-xs font-bold text-ink-soft">
                              {done}/{t('academy.lessons', { n: u.lessons.length })}
                            </span>
                          </span>
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {u.lessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                              <span aria-hidden>{l.id in (completed[level.id] ?? {}) ? '✅' : '▫️'}</span>
                              {l.title}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  );
                }),
              )}
            </ol>
          </section>
        </div>
      </div>
      {cert && <Certificate course={course} onClose={() => setCert(false)} />}
    </div>
  );
}

function ProgressPanel() {
  const t = useT();
  const { xp, streak, lastActiveDate, levels, dailyGoal, xpByDay } = useProgressStore();
  const today = toDateKey(new Date());
  const todayXp = xpByDay[today] ?? 0;
  const completed = completedByLevel(levels);
  const coursesDone = CATALOG.filter((c) => {
    const s = courseStats(c, completed);
    return s.lessons > 0 && s.done === s.lessons;
  }).length;
  const list = achievements({ xp, streak: visibleStreak(streak, lastActiveDate, today), levels }, coursesDone);
  const pct = Math.min(1, todayXp / dailyGoal);
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border-2 border-navy/10 bg-white p-5">
        <h2 className="text-lg font-black text-navy">🎯 {t('academy.dailyGoal')}</h2>
        <div className="mt-3 flex items-center gap-4">
          <div
            className="relative h-20 w-20 shrink-0 rounded-full"
            style={{ background: `conic-gradient(#398401 ${pct * 360}deg, #E5E5E5 0deg)` }}
            role="progressbar"
            aria-label={t('academy.dailyGoal')}
            aria-valuemin={0}
            aria-valuemax={dailyGoal}
            aria-valuenow={todayXp}
          >
            <span className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-sm font-black text-navy">
              {todayXp}/{dailyGoal}
            </span>
          </div>
          <p className="font-bold text-ink-soft">
            {pct >= 1 ? t('academy.dailyGoalDone') : `${todayXp} / ${dailyGoal} XP`}
            <span className="mt-1 block text-[#AA6400]">🔥 {visibleStreak(streak, lastActiveDate, today)} {t('header.streak')}</span>
          </p>
        </div>
      </div>
      <div className="rounded-3xl border-2 border-navy/10 bg-white p-5">
        <h2 className="text-lg font-black text-navy">🏅 {t('academy.achievements')} · {list.filter((a) => a.earned).length}/{list.length}</h2>
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {list.map((a) => (
            <li
              key={a.id}
              title={`${a.title}: ${a.description}`}
              className={`flex aspect-square items-center justify-center rounded-2xl text-2xl ${a.earned ? 'bg-gold-light' : 'bg-ink-line/60 grayscale'}`}
              aria-label={`${a.title}${a.earned ? ' ✓' : ''}`}
            >
              {a.icon}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AcademyScreen() {
  const { setTab, setCurrentLevel, levels, currentLevel } = useProgressStore();
  const t = useT();
  const [category, setCategory] = useState<Category | 'todos'>('todos');
  const [open, setOpen] = useState<CatalogCourse | null>(null);
  const completed = completedByLevel(levels);

  const visible = useMemo(() => CATALOG.filter((c) => category === 'todos' || c.category === category), [category]);
  const inProgress = CATALOG.filter((c) => {
    const s = courseStats(c, completed);
    return s.done > 0 && s.done < s.lessons;
  });

  const start = (course: CatalogCourse) => {
    sfx.tap();
    setOpen(null);
    if (course.open.tab === 'product') return window.location.assign(new URL(course.open.href, window.location.href).href);
    if (course.open.tab !== 'english') return setTab(course.open.tab);
    // English ladder: keep the learner's current level if they are already on it.
    const target = course.id === 'ingles-a1-c2' && /^[ABC][12]$/.test(currentLevel) ? currentLevel : course.open.level;
    setCurrentLevel(target);
    setTab('english');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-5">
      <section className="relative overflow-hidden rounded-3xl bg-navy px-5 py-6 text-white sm:px-8">
        <div className="relative z-10 max-w-[58%] sm:max-w-[60%]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gold-light">{t('academy.kicker')}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            {t('academy.heroTitle')}
          </h1>
          <p className="mt-2 text-[15px] font-semibold text-white/85">
            {t('academy.heroText')}
          </p>
        </div>
        <div className="absolute -bottom-1 end-0 sm:end-8" aria-hidden>
          <Britjoy size={150} />
        </div>
      </section>

      <ProgressPanel />
      <StudyToolsCards />

      {inProgress.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black text-navy">{t('academy.continue')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {inProgress.map((c) => {
              const s = courseStats(c, completed);
              return (
                <button
                  key={c.id}
                  onClick={() => start(c)}
                  className="press flex w-72 shrink-0 items-center gap-3 rounded-2xl border-2 border-b-4 border-navy/10 bg-white p-3 text-left"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: c.color }} aria-hidden>
                    {c.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-navy">{c.title}</span>
                    <ProgressBar value={s.done / s.lessons} color={c.color} />
                    <span className="mt-0.5 block text-xs font-bold text-ink-soft">{s.done}/{t('academy.lessons', { n: s.lessons })}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black text-navy">{t('academy.catalogue')}</h2>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('academy.categories')}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-extrabold ${
                category === c.id ? 'border-navy bg-navy text-white' : 'border-navy/15 bg-white text-navy'
              }`}
            >
              {t(`cat.${c.id}`)}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CourseCard key={c.id} course={c} onOpen={() => setOpen(c)} />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setTab('ai')}
          className="press flex items-center gap-4 rounded-3xl border-2 border-b-4 border-navy/10 bg-white p-5 text-left"
        >
          <span className="text-4xl" aria-hidden>🤖</span>
          <span>
            <span className="block text-lg font-black text-navy">{t('academy.aiCardTitle')}</span>
            <span className="block text-sm font-semibold text-ink-soft">{t('academy.aiCardText')}</span>
          </span>
        </button>
        <button
          onClick={() => setTab('local')}
          className="press flex items-center gap-4 rounded-3xl border-2 border-b-4 border-navy/10 bg-white p-5 text-left"
        >
          <span className="text-4xl" aria-hidden>🏙️</span>
          <span>
            <span className="block text-lg font-black text-navy">{t('local.title')}</span>
            <span className="block text-sm font-semibold text-ink-soft">{t('local.cardText')}</span>
          </span>
        </button>
        <button
          onClick={() => setTab('resources')}
          className="press flex items-center gap-4 rounded-3xl border-2 border-b-4 border-navy/10 bg-white p-5 text-left"
        >
          <span className="text-4xl" aria-hidden>📚</span>
          <span>
            <span className="block text-lg font-black text-navy">{t('academy.resTitle')}</span>
            <span className="block text-sm font-semibold text-ink-soft">{t('academy.resText')}</span>
          </span>
        </button>
      </section>

      {!Capacitor.isNativePlatform() && (
      <section className="mt-8 rounded-3xl border-2 border-navy/10 bg-white p-5" aria-labelledby="descargas">
        <h2 id="descargas" className="text-xl font-black text-navy">{t('academy.download')}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">{t('academy.downloadNote')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href={DOWNLOADS.android}
            className="press flex items-center gap-3 rounded-2xl border-b-4 border-brand-dark bg-brand px-4 py-3 font-black text-white"
          >
            <span className="text-3xl" aria-hidden>🤖</span>
            <span>
              <span className="block text-xs uppercase">{t('academy.androidKicker')}</span>
              {t('academy.android')}
            </span>
          </a>
          <span className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-navy/20 px-4 py-3 font-black text-ink-soft">
            <span className="text-3xl" aria-hidden>🍎</span>
            <span>
              <span className="block text-xs uppercase">iPhone</span>
              {t('academy.ios')}
            </span>
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold text-ink-soft">
          {t('academy.apkHelp')}
        </p>
      </section>
      )}

      <p className="mt-8 text-center text-xs font-bold text-ink-soft">{t('brand.close')}</p>

      {open && <CourseDetail course={open} onClose={() => setOpen(null)} onStart={() => start(open)} />}
    </div>
  );
}
