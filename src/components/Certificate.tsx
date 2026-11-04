import type { CatalogCourse } from '../data/catalog';
import { useProgressStore } from '../store/useProgressStore';
import { useT } from '../i18n';
import { Britjoy } from './Britjoy';
import { Button } from './Button';

/** Busuu-style course certificate: the learner types their name and prints or saves it as PDF. */
export function Certificate({ course, onClose }: { course: CatalogCourse; onClose: () => void }) {
  const t = useT();
  const name = useProgressStore((s) => s.learnerName);
  const setName = useProgressStore((s) => s.setLearnerName);
  const lang = useProgressStore((s) => s.uiLang) ?? 'es';
  const date = new Date().toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className="mx-auto max-w-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <label className="block rounded-2xl bg-white p-4 print:hidden">
          <span className="mb-1 block font-extrabold text-navy">{t('cert.name')}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl border-2 border-ink-line px-3 py-2 font-bold outline-none focus:border-navy"
          />
        </label>
        <section
          id="certificate"
          className="relative overflow-hidden rounded-3xl border-[10px] border-double border-gold bg-cream px-6 py-8 text-center print:rounded-none"
          aria-label={t('cert.title')}
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-royal">Voz Unida Mundo Academy</p>
          <h2 className="mt-2 text-3xl font-black text-navy">{t('cert.title')}</h2>
          <div className="my-4 flex justify-center">
            <Britjoy size={120} expression="celebrating" />
          </div>
          <p className="text-3xl font-black text-ink" style={{ fontFamily: 'Georgia, serif' }}>{name || '—'}</p>
          <p className="mt-2 font-semibold text-ink-soft">{t('cert.awarded')}</p>
          <p className="mt-1 text-xl font-black text-navy">{course.title}</p>
          <p className="mt-1 text-sm font-bold text-ink-soft">{course.level} · {date}</p>
          <p className="mt-6 text-xs font-bold text-ink-soft">{t('brand.close')}</p>
        </section>
        <div className="grid gap-2 sm:grid-cols-2 print:hidden">
          <Button block onClick={() => window.print()} disabled={!name.trim()}>
            {t('cert.print')}
          </Button>
          <Button block variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
