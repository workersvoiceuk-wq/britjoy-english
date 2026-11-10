// «Inglés para el día a día»: contenido de los 12 módulos (IDs conservados, muestra pública, módulos de pago en el
// servidor), manifiesto de medios con estado real y pedagogía de la práctica (feedback por opción sin dar la
// respuesta, pista gradual, repaso de fallos).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { Exercise, Lesson, Unit } from '../src/types';
import { checkAnswer } from '../src/logic/answer';
import { gradualHint, isPractice, lessonPhrases, optionFeedback, practicePlan } from '../src/vida-diaria/practice';
import { OUTLINE_MODULES } from '../src/data/vida-diaria/outline';
import media from '../src/data/vida-diaria/media.json';
import { CATALOG } from '../src/data/catalog';
import { DAILY_LEVEL } from '../src/data/courses/situaciones';
import { VD_MODULES, VD_SAMPLE_MODULES } from '../supabase/functions/_shared/vida-diaria';

const ROOT = path.resolve(__dirname, '..');
// Paid modules are NOT in this public repository: they come from the private package (VD_PREMIUM_DIR). Without it,
// the checks that need their content are skipped; the public-repository checks always run.
const PREMIUM = process.env.VD_PREMIUM_DIR ? path.resolve(process.env.VD_PREMIUM_DIR) : null;
const PAID_DIR = PREMIUM ? path.join(PREMIUM, 'modules') : null;
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8')) as Unit;
const modules: Array<[string, Unit]> = [
  ['01-presentaciones', read(path.join(ROOT, 'src/data/courses/dia-a-dia/01-presentaciones.json'))],
  ...(PAID_DIR ? fs.readdirSync(PAID_DIR).sort().map((f) => [f.replace('.json', ''), read(path.join(PAID_DIR, f))] as [string, Unit]) : []),
];
const full = it.skipIf(!PAID_DIR);
// IDs publicados antes de separar el curso (main f076629): el progreso se guarda por estos IDs.
const PUBLISHED_IDS = ['dia-01-presentaciones', 'dia-02-compras', 'dia-03-transporte', 'dia-04-vivienda', 'dia-05-salud', 'dia-06-empleo',
  'dia-07-trabajo', 'dia-08-llamadas', 'dia-09-colegio', 'dia-10-servicios', 'dia-11-social', 'dia-12-opiniones'];

describe('Inglés para el día a día · contenido y separación', () => {
  full('12 módulos (paquete privado) con los mismos IDs de lección y nivel DIA', () => {
    expect(modules.map(([id]) => id)).toEqual([...VD_MODULES]);
    expect(modules.flatMap(([, u]) => u.lessons.map((l) => l.id))).toEqual(PUBLISHED_IDS);
    expect(modules.every(([, u]) => u.level === 'DIA')).toBe(true);
  });

  it('repositorio público: solo la muestra (módulo 1) y su vídeo/VTT; nada de pago en git ni en public/', () => {
    const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT }).toString().split('\n');
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: ROOT }).toString().split('\n');
    const all = [...tracked, ...untracked].filter(Boolean).filter((f) => fs.existsSync(path.join(ROOT, f)));
    expect(all.filter((f) => /dia-(0[2-9]|1[0-2])-[a-z]+(-capitulo|-flow)?\.(json|mp4|vtt)$/.test(f))).toEqual([]);
    expect(all.filter((f) => /\.zip$/i.test(f))).toEqual([]);
    expect(all.filter((f) => f.startsWith('supabase/functions/_shared/vida-diaria/'))).toEqual([]);
    expect(fs.readdirSync(path.join(ROOT, 'public/videos/vida-diaria')).every((f) => f.startsWith('dia-01-presentaciones-'))).toBe(true);
    // Public manifest: no transcripts of paid modules.
    for (const m of media.modules as Array<{ module: string; animacion: { transcripcion?: unknown } }>) if (m.module !== '01-presentaciones') expect(m.animacion.transcripcion).toBeUndefined();
    expect(fs.readdirSync(path.join(ROOT, 'src/data/courses/dia-a-dia'))).toEqual(['01-presentaciones.json']);
    expect(VD_SAMPLE_MODULES).toEqual(['01-presentaciones']);
    expect(DAILY_LEVEL.id).toBe('DIA');
    expect(DAILY_LEVEL.units.flatMap((u) => u.lessons.map((l) => l.id))).toEqual(['dia-01-presentaciones']);
  });

  it('el índice público coincide con los módulos y no lleva ejercicios ni explicaciones', () => {
    execFileSync('node', ['scripts/vida-diaria-outline.mjs', '--check'], { cwd: ROOT, env: { ...process.env } });
    expect(OUTLINE_MODULES.map((m) => m.id)).toEqual([...VD_MODULES]);
    const raw = fs.readFileSync(path.join(ROOT, 'src/data/vida-diaria/outline.json'), 'utf8');
    expect(raw).not.toContain('"exercises"');
    expect(raw).not.toContain('"body"');
  });

  it('la función del servidor lee el contenido de pago del bucket privado, no del repositorio', () => {
    const fn = fs.readFileSync(path.join(ROOT, 'supabase/functions/vida-diaria/index.ts'), 'utf8');
    expect(fn).toContain('const BUCKET = "vida-diaria-premium"');
    expect(fn).toContain('if (!user) return json({ error: "sign_in" }, 401, headers);');
    expect(fn).not.toMatch(/import .*\.json/);
    const sql = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261107120000_vida_diaria_access.sql'), 'utf8');
    expect(sql).toContain("values ('vida-diaria-premium', 'vida-diaria-premium', false)");
    expect(sql).not.toMatch(/on storage\.objects/); // sin políticas: ni anon ni authenticated pueden leer el bucket
  });

  it('el catálogo general conserva la ficha dia-a-dia (id, título, 12 módulos) y la lleva a vida-diaria/', () => {
    const card = CATALOG.find((c) => c.id === 'dia-a-dia')!;
    expect(card.title).toBe('Inglés para el día a día');
    expect(card.open).toEqual({ tab: 'product', href: 'vida-diaria/' });
    expect(card.levels[0].units).toHaveLength(12);
    expect(card.levels[0].units.flatMap((u) => u.lessons.map((l) => l.id))).toEqual(PUBLISHED_IDS);
    // Las demás fichas no cambian de destino.
    expect(CATALOG.filter((c) => c.open.tab === 'product').map((c) => c.id)).toEqual(['dia-a-dia']);
  });

  full('cada ejercicio de los 12 módulos se puede resolver con su respuesta', () => {
    for (const [, u] of modules) for (const l of u.lessons) for (const e of l.exercises) {
      if (e.type === 'multipleChoice' || (e.type === 'fillBlank' && e.options) || (e.type === 'listening' && e.options)) {
        expect(e.options).toContain(e.answer);
        expect(checkAnswer(e, { kind: 'text', value: e.answer }).correct).toBe(true);
      }
    }
  });
});

describe('Inglés para el día a día · manifiesto de medios (estado real)', () => {
  const list = media.modules as Array<{ module: string; lessonId: string; objective: string; animacion: { estado: string; cuentaComoVideo: boolean; archivo: string; subtitulos: { es: string; en: string }; acceso: string; transcripcion?: unknown }; video: { estado: string; archivo: string | null } }>;
  it('12 entradas con objetivo, animación subtitulada sin voz que NO cuenta como vídeo, y ningún vídeo real todavía', () => {
    expect(list.map((m) => m.module)).toEqual([...VD_MODULES]);
    for (const m of list) {
      expect(m.objective).toBeTruthy();
      expect(m.animacion.estado).toBe('lista-sin-voz');
      expect(m.animacion.cuentaComoVideo).toBe(false);
      expect(['pendiente', 'en-flow-pendiente-revision', 'listo-sin-voz']).toContain(m.video.estado);
      // A module only counts as having a video once its imported clip exists where its access rule says.
      if (m.video.estado === 'listo-sin-voz') {
        const dir = m.module === '01-presentaciones' ? path.join(ROOT, 'public/videos/vida-diaria') : PREMIUM ? path.join(PREMIUM, 'media') : null;
        if (dir) expect(fs.existsSync(path.join(dir, m.video.archivo!))).toBe(true);
        expect(m.video.archivo).toMatch(/-flow\.mp4$/);
      } else expect(m.video.archivo).toBeNull();
    }
  });

  full('la animación y el clip del módulo 1 son públicos; los de pago solo están en el paquete privado', () => {
    for (const m of list) {
      const files = [m.animacion.archivo, m.animacion.subtitulos.es, m.animacion.subtitulos.en];
      const pub = files.map((f) => path.join(ROOT, 'public/videos/vida-diaria', f));
      const srv = files.map((f) => path.join(PREMIUM!, 'media', f));
      if (m.module === '01-presentaciones') {
        expect(m.animacion.acceso).toBe('publico');
        expect(pub.every((f) => fs.existsSync(f))).toBe(true);
      } else {
        expect(m.animacion.acceso).toBe('servidor');
        expect(srv.every((f) => fs.existsSync(f))).toBe(true);
        expect(pub.some((f) => fs.existsSync(f))).toBe(false);
        expect(m.animacion.transcripcion).toBeUndefined();
      }
      for (const lang of ['es', 'en'] as const) {
        const vtt = fs.readFileSync((m.module === '01-presentaciones' ? pub : srv)[lang === 'es' ? 1 : 2], 'utf8');
        expect(vtt.startsWith('WEBVTT')).toBe(true);
      }
    }
  });
});

const wrongResponses = (e: Exercise) => {
  if ('options' in e && e.options) return e.options.filter((o) => o !== (e as { answer: string }).answer).map((value) => ({ kind: 'text' as const, value }));
  if (e.type === 'wordBank') return [{ kind: 'tokens' as const, value: [...e.answer.split(' ')].reverse() }];
  if (e.type === 'typing' || e.type === 'listening') return [{ kind: 'text' as const, value: 'I am not sure' }];
  if (e.type === 'matching') return [{ kind: 'matching' as const, mismatches: 2 }];
  return [];
};

describe('Inglés para el día a día · práctica', () => {
  full('el feedback por opción explica la elección y nunca contiene la respuesta, en ES y EN, en los 12 módulos', () => {
    let checked = 0;
    for (const [, u] of modules) for (const lesson of u.lessons) {
      const phrases = lessonPhrases(lesson);
      for (const e of lesson.exercises.filter(isPractice)) {
        const answer = 'answer' in e ? String(e.answer) : null;
        for (const r of wrongResponses(e)) for (const ui of ['es', 'en'] as const) {
          const fb = optionFeedback(e, r, phrases, ui);
          expect(fb.length).toBeGreaterThan(10);
          if (answer && answer.split(' ').length > 1) expect(fb).not.toContain(answer);
          if (r.kind === 'text' && 'options' in e && e.options) expect(fb).toContain(r.value);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(150);
  });

  full('la pista gradual no da la respuesta; con 3 opciones el segundo nivel no descarta hasta dejar una', () => {
    for (const [, u] of modules) for (const lesson of u.lessons) for (const e of lesson.exercises.filter(isPractice)) {
      const answer = 'answer' in e ? String(e.answer) : '';
      for (const level of [1, 2] as const) for (const ui of ['es', 'en'] as const) {
        const h = gradualHint(e, level, ui, null);
        if (answer.split(' ').length > 1) expect(h).not.toContain(answer);
        if ('options' in e && e.options && e.options.length <= 3) for (const o of e.options) expect(h).not.toContain(`«${o}»`);
      }
    }
  });

  it('el plan recorre cada pantalla una vez y añade al final los fallos, sin repetir', () => {
    const lesson = modules[0][1].lessons[0] as Lesson;
    const plan = practicePlan(lesson, [3, 5, 3]);
    expect(plan.slice(0, lesson.exercises.length).every((p, i) => p.index === i && !p.review)).toBe(true);
    expect(plan.slice(lesson.exercises.length)).toEqual([{ index: 3, review: true }, { index: 5, review: true }]);
  });
});
