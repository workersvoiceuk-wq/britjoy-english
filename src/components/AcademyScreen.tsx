import { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CATALOG, CATEGORIES, DOWNLOADS, courseStats, type CatalogCourse, type Category } from '../data/catalog';
import { completedByLevel, useProgressStore } from '../store/useProgressStore';
import { sfx } from '../lib/sound';
import { Britjoy } from './Britjoy';
import { Button } from './Button';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

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
  return (
    <button
      onClick={() => {
        sfx.tap();
        onOpen();
      }}
      className="press group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-b-4 border-navy/10 bg-white text-left"
      aria-label={`${course.title}. ${stats.modules} módulos, ${stats.lessons} lecciones. Ver curso`}
    >
      <span className="relative flex h-28 items-center justify-between px-5" style={{ background: course.color }}>
        <span className="text-5xl drop-shadow" aria-hidden>{course.emoji}</span>
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-navy">{course.level}</span>
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="text-lg font-black leading-tight text-navy">{course.title}</span>
        <span className="mt-1 line-clamp-3 text-sm font-semibold text-ink-soft">{course.subtitle}</span>
        <span className="mt-3 flex flex-wrap gap-1.5">
          {course.badges.map((b) => (
            <span key={b} className="rounded-md bg-gold-light px-2 py-0.5 text-[11px] font-black text-gold-dark">{b}</span>
          ))}
        </span>
        <span className="mt-3 text-xs font-bold text-ink-soft">
          {plural(stats.modules, 'módulo', 'módulos')} · {plural(stats.lessons, 'lección', 'lecciones')} · ~{stats.hours} h · <span className="text-brand-dark">Gratis</span>
        </span>
        <span className="mt-auto pt-3">
          <ProgressBar value={pct} color={course.color} />
          <span className="mt-1 block text-xs font-bold text-ink-soft">
            {stats.done === 0 ? 'Sin empezar' : `${stats.done}/${stats.lessons} lecciones · ${Math.round(pct * 100)}%`}
          </span>
        </span>
      </span>
    </button>
  );
}

function CourseDetail({ course, onClose, onStart }: { course: CatalogCourse; onClose: () => void; onStart: () => void }) {
  const levels = useProgressStore((s) => s.levels);
  const completed = completedByLevel(levels);
  const stats = courseStats(course, completed);
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
            <p className="text-xs font-black uppercase tracking-wider opacity-90">{course.level} · Gratis</p>
            <h2 className="text-2xl font-black leading-tight">{course.title}</h2>
          </div>
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/20 px-2.5 py-1 text-lg" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-5 p-5">
          <p className="font-semibold text-ink">{course.subtitle}</p>
          <p className="text-sm font-bold text-ink-soft">
            {plural(stats.modules, 'módulo', 'módulos')} · {plural(stats.lessons, 'lección', 'lecciones')} · ~{stats.hours} h · Britjoy te lo explica en voz alta
          </p>
          <Button variant="primary" block onClick={onStart}>
            {stats.done ? 'Continuar el curso' : 'Empezar el curso'}
          </Button>

          <section className="rounded-2xl border-2 border-navy/10 p-4">
            <h3 className="mb-2 text-lg font-black text-navy">Lo que aprenderás</h3>
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
            <h3 className="mb-2 text-lg font-black text-navy">Temario</h3>
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
                              {done}/{u.lessons.length} lecciones
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
    </div>
  );
}

export function AcademyScreen() {
  const { setTab, setCurrentLevel, levels, currentLevel } = useProgressStore();
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
    if (course.open.tab === 'life') return setTab('life');
    // English ladder: keep the learner's current level if they are already on it.
    const target = course.id === 'ingles-a1-c2' && /^[ABC][12]$/.test(currentLevel) ? currentLevel : course.open.level;
    setCurrentLevel(target);
    setTab('english');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-5">
      <section className="relative overflow-hidden rounded-3xl bg-navy px-5 py-6 text-white sm:px-8">
        <div className="relative z-10 max-w-[58%] sm:max-w-[60%]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gold-light">Voz Unida Mundo Academy</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            Aprende inglés y a vivir en el Reino Unido
          </h1>
          <p className="mt-2 text-[15px] font-semibold text-white/85">
            Cursos gratis, con historias, misiones y Britjoy explicándote cada paso.
          </p>
        </div>
        <div className="absolute -bottom-1 right-0 sm:right-8" aria-hidden>
          <Britjoy size={150} />
        </div>
      </section>

      {inProgress.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black text-navy">Continúa donde lo dejaste</h2>
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
                    <span className="mt-0.5 block text-xs font-bold text-ink-soft">{s.done}/{s.lessons} lecciones</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black text-navy">Catálogo de cursos</h2>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorías">
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
              {c.label}
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
            <span className="block text-lg font-black text-navy">Modo IA: practica con Britjoy</span>
            <span className="block text-sm font-semibold text-ink-soft">Corrige tus frases y simula situaciones reales.</span>
          </span>
        </button>
        <button
          onClick={() => setTab('resources')}
          className="press flex items-center gap-4 rounded-3xl border-2 border-b-4 border-navy/10 bg-white p-5 text-left"
        >
          <span className="text-4xl" aria-hidden>📚</span>
          <span>
            <span className="block text-lg font-black text-navy">Recursos recomendados</span>
            <span className="block text-sm font-semibold text-ink-soft">British Council, Busuu, LearnEnglish y webs oficiales.</span>
          </span>
        </button>
      </section>

      {!Capacitor.isNativePlatform() && (
      <section className="mt-8 rounded-3xl border-2 border-navy/10 bg-white p-5" aria-labelledby="descargas">
        <h2 id="descargas" className="text-xl font-black text-navy">Descarga la app</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Tu progreso de la web no se pasa a la app: cada una guarda el suyo en tu dispositivo.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href={DOWNLOADS.android}
            className="press flex items-center gap-3 rounded-2xl border-b-4 border-brand-dark bg-brand px-4 py-3 font-black text-white"
          >
            <span className="text-3xl" aria-hidden>🤖</span>
            <span>
              <span className="block text-xs uppercase opacity-90">Versión beta · APK</span>
              Descargar para Android
            </span>
          </a>
          <span className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-navy/20 px-4 py-3 font-black text-navy/60">
            <span className="text-3xl" aria-hidden>🍎</span>
            <span>
              <span className="block text-xs uppercase">iPhone</span>
              Próximamente en App Store
            </span>
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold text-ink-soft">
          Para instalar el APK, permite «instalar apps desconocidas» para tu navegador. Pronto también en Google Play.
        </p>
      </section>
      )}

      <p className="mt-8 text-center text-xs font-bold text-ink-soft">Voz Unida Mundo Academy · te enseña — Tu voz cuenta</p>

      {open && <CourseDetail course={open} onClose={() => setOpen(null)} onStart={() => start(open)} />}
    </div>
  );
}
