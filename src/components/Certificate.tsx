import type { CatalogCourse } from '../data/catalog';
import { useProgressStore, type LevelProgress } from '../store/useProgressStore';
import { useT } from '../i18n';
import { Britjoy } from './Britjoy';
import { Button } from './Button';

/**
 * Resolves the real latest completion timestamp across all lessons in `course.levels`
 * stored in `useProgressStore`, falling back to `fallbackNow` only when no positive
 * `completedAt` timestamp is recorded.
 */
export function resolveCertificateCompletionDate(
  course: Pick<CatalogCourse, 'levels'>,
  levels: Record<string, LevelProgress | undefined>,
  fallbackNow = Date.now(),
): Date {
  let maxCompletedAt = 0;
  for (const level of course.levels) {
    const completedLessons = levels[level.id]?.completedLessons;
    if (!completedLessons) continue;
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        const ts = completedLessons[lesson.id]?.completedAt;
        if (typeof ts === 'number' && Number.isFinite(ts) && ts > maxCompletedAt) {
          maxCompletedAt = ts;
        }
      }
    }
  }
  return new Date(maxCompletedAt > 0 ? maxCompletedAt : fallbackNow);
}

/** Private local VUM practice completion summary: uses stored completedAt and states non-official/non-identity limits. */
export function Certificate({
  course,
  onClose,
  levelsOverride,
  langOverride,
}: {
  course: CatalogCourse;
  onClose: () => void;
  levelsOverride?: Record<string, LevelProgress | undefined>;
  langOverride?: string;
}) {
  const t = useT();
  const name = useProgressStore((s) => s.learnerName);
  const setName = useProgressStore((s) => s.setLearnerName);
  const storeLevels = useProgressStore((s) => s.levels);
  const storeLang = useProgressStore((s) => s.uiLang);
  const legacyDate = useProgressStore((s) => s.legacyEnglishCertificate ? s.legacyEnglishCertificateAt : null);
  const levels = levelsOverride ?? storeLevels;
  const lang = langOverride ?? storeLang ?? 'es';
  const isEn = lang.toLowerCase().startsWith('en');
  const completionDate = course.id === 'ingles-a1-c2' && legacyDate && !levelsOverride
    ? new Date(legacyDate)
    : resolveCertificateCompletionDate(course, levels);
  const date = completionDate.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  const privateNotice = isEn
    ? 'Private local practice record issued on this device by Voz Unida Mundo (VUM). It is NOT an official or accredited qualification, university credit, or regulated professional licence, and the freely typed name does not verify legal identity.'
    : 'Constancia privada local de práctica emitida en este dispositivo por Voz Unida Mundo (VUM). NO es un certificado oficial, título acreditado ni habilitación profesional regulada, y el nombre escrito libremente no acredita identidad civil.';

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
          <span className="mt-1.5 block text-xs font-semibold text-ink-soft">
            {isEn
              ? 'Note: this name is typed locally by you and does not verify legal identity.'
              : 'Aviso: este nombre lo escribes localmente en tu dispositivo y no acredita identidad.'}
          </span>
        </label>
        <section
          id="certificate"
          className="relative overflow-hidden rounded-3xl border-[10px] border-double border-gold bg-cream px-6 py-8 text-center print:rounded-none"
          aria-label={t('cert.title')}
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-royal">Voz Unida Mundo · Constancia privada</p>
          <h2 className="mt-2 text-3xl font-black text-navy">{t('cert.title')}</h2>
          <div className="my-4 flex justify-center">
            <Britjoy size={120} expression="celebrating" />
          </div>
          <p className="text-3xl font-black text-ink" style={{ fontFamily: 'Georgia, serif' }}>{name || '—'}</p>
          <p className="mt-2 font-semibold text-ink-soft">{t('cert.awarded')}</p>
          <p className="mt-1 text-xl font-black text-navy">{course.title}</p>
          <p data-cert-completion-date="true" className="mt-1 text-sm font-bold text-ink-soft">{course.level} · {date}</p>
          <p
            data-private-cert-disclaimer="true"
            className="mx-auto mt-4 max-w-xl rounded-xl border border-navy/15 bg-white/80 px-3.5 py-2 text-[11px] font-bold leading-snug text-navy/85"
          >
            {privateNotice}
          </p>
          <p className="mt-4 text-xs font-bold text-ink-soft">{t('brand.close')}</p>
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
