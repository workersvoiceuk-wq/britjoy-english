import type { CoursePathway } from '../data/coursePathways';

interface Props {
  pathway: CoursePathway;
  locale: 'es' | 'en';
  collapsible?: boolean;
}

export function CoursePathwayBox({ pathway, locale, collapsible = false }: Props) {
  const es = locale === 'es';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const downloadHref = `${baseUrl.replace(/\/?$/, '/')}${pathway.guideDownloadPath}`;

  const body = (
    <div className="space-y-2.5 text-xs font-semibold leading-relaxed text-ink">
      <div>
        <p className="font-black uppercase tracking-wide text-royal">
          {es ? '1. Qué aprenderás por etapas' : '1. What you will learn step by step'}
        </p>
        <ul className="mt-1 list-disc space-y-1 ps-4">
          {pathway.whatYouLearn.map((item, idx) => (
            <li key={idx}>{item[locale]}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-black uppercase tracking-wide text-royal">
          {es ? '2. Requisitos previos' : '2. Prerequisites'}
        </p>
        <p className="mt-0.5">{pathway.prerequisites[locale]}</p>
      </div>

      <div className="rounded-xl border border-navy/15 bg-cream/80 px-3 py-2">
        <p className="font-black uppercase tracking-wide text-navy">
          {es ? '3. Constancia privada VUM (sin verificación de identidad)' : '3. Private VUM record (no identity verification)'}
        </p>
        <p className="mt-0.5 text-navy/90">{pathway.privateCertificate[locale]}</p>
      </div>

      <div>
        <p className="font-black uppercase tracking-wide text-royal">
          {es ? '4. Siguiente certificación o habilitación oficial externa' : '4. Next external official certification or licence'}
        </p>
        <p className="mt-0.5">{pathway.externalNextStep[locale]}</p>
        <p className="mt-1 font-bold text-bad-dark">{pathway.strictBoundary[locale]}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {pathway.sources.map((src) => (
          <a
            key={src.url}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-navy/15 bg-white px-2.5 py-1 text-[11px] font-extrabold text-royal underline"
          >
            ↗ {src.label}
          </a>
        ))}
        <a
          href={downloadHref}
          download="guia-7-cursos-vum-es-en.md"
          data-download-study-guide="true"
          className="rounded-lg border border-brand-dark/30 bg-brand-light px-2.5 py-1 text-[11px] font-extrabold text-brand-dark underline"
        >
          ⬇ {es ? 'Descargar guía de estudio (ES/EN .md)' : 'Download study guide (ES/EN .md)'}
        </a>
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <details
        data-pathway-guide={pathway.domain}
        className="mb-5 rounded-2xl border-2 border-navy/12 bg-white px-4 py-3 shadow-sm"
      >
        <summary className="cursor-pointer select-none text-xs font-extrabold text-navy">
          🧭 {pathway.title[locale]} ·{' '}
          <span className="text-royal underline">
            {es ? 'requisitos, constancia privada y certificación externa' : 'prerequisites, private record & external certification'}
          </span>
        </summary>
        <div className="mt-3">{body}</div>
      </details>
    );
  }

  return (
    <section
      data-pathway-guide={pathway.domain}
      className="rounded-2xl border-2 border-navy/12 bg-white p-4"
    >
      <h3 className="mb-2 text-base font-black text-navy">🧭 {pathway.title[locale]}</h3>
      {body}
    </section>
  );
}
