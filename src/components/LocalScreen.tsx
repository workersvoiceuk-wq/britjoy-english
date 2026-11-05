import { useState } from 'react';
import { backendConfigured, callFunction } from '../lib/backend';
import { useProgressStore } from '../store/useProgressStore';
import { sfx } from '../lib/sound';
import { speak } from '../lib/speech';
import { CITY_LEVELS } from '../data/courses/ciudades';

/**
 * "Tu ciudad": your local council and city guides.
 * UK: postcode → council (GOV.UK's official data, through the council-finder function), then
 * every service opens GOV.UK's page for that council, which sends you to the council's own page
 * (and to the county for county services in two-tier areas).
 */
type Country = 'uk' | 'es' | 'co';
interface Council {
  name: string;
  homepage: string;
  slug: string;
  tier: string;
  parent?: { name: string; homepage: string; slug: string };
}
type Result = { status: 'ok'; council: Council } | { status: 'invalid' | 'not_found' | 'multiple' | 'error' };

const SERVICES: { group: string; items: { slug: string; es: string; en: string }[] }[] = [
  {
    group: '🏠 Casa y vivienda',
    items: [
      { slug: 'apply-for-council-housing', es: 'Pedir vivienda social (housing register)', en: 'Apply for council housing' },
      { slug: 'homelessness-help-from-council', es: 'Ayuda si te quedas sin casa', en: "Get help from your council if you're homeless" },
      { slug: 'apply-housing-benefit-from-council', es: 'Ayuda para el alquiler (Housing Benefit)', en: 'Apply for Housing Benefit' },
      { slug: 'apply-disabled-facilities-grant', es: 'Adaptar tu casa por discapacidad', en: 'Disabled Facilities Grant' },
    ],
  },
  {
    group: '💷 Council tax',
    items: [
      { slug: 'pay-council-tax', es: 'Pagar el council tax', en: 'Pay your Council Tax' },
      { slug: 'apply-council-tax-reduction', es: 'Pedir la rebaja del council tax', en: 'Apply for Council Tax Reduction' },
    ],
  },
  {
    group: '🤝 Servicios sociales y familia',
    items: [
      { slug: 'apply-needs-assessment-social-services', es: 'Servicios sociales: valoración de cuidados', en: 'Apply for a needs assessment by social services' },
      { slug: 'apply-free-school-meals', es: 'Comida escolar gratis', en: 'Apply for free school meals' },
      { slug: 'apply-for-primary-school-place', es: 'Plaza en el colegio (primaria)', en: 'Apply for a primary school place' },
      { slug: 'apply-for-secondary-school-place', es: 'Plaza en el instituto (secundaria)', en: 'Apply for a secondary school place' },
    ],
  },
  {
    group: '🗑️ Tu calle y tu barrio',
    items: [
      { slug: 'rubbish-collection-day', es: 'Qué día recogen la basura', en: 'Find out your bin collection day' },
      { slug: 'local-library-services', es: 'Bibliotecas', en: 'Local library services' },
      { slug: 'report-pothole', es: 'Avisar de un bache en la calle', en: 'Report a pothole' },
    ],
  },
];

const NATIONAL = [
  { url: 'https://www.gov.uk/register-to-vote', es: 'Inscribirte para votar', en: 'Register to vote' },
  { url: 'https://www.gov.uk/report-child-abuse', es: 'Avisar si un niño está en peligro', en: 'Report child abuse' },
  { url: 'https://www.gov.uk/apply-blue-badge', es: 'Tarjeta de aparcamiento por discapacidad', en: 'Apply for a Blue Badge' },
];

const COUNTRY_INFO: Record<Exclude<Country, 'uk'>, { title: string; body: string[] }> = {
  es: {
    title: 'Tu ayuntamiento en España',
    body: [
      'Empadrónate en el ayuntamiento de donde vives: lo necesitas para la tarjeta sanitaria, el colegio y los servicios sociales.',
      'Los servicios sociales municipales son la puerta de entrada a casi todas las ayudas. Pide cita en tu centro de servicios sociales.',
      'Casi todos los ayuntamientos tienen sede electrónica para pedir cita, el volante del padrón y pagar impuestos municipales (IBI, basuras).',
      'Busca la web de tu ayuntamiento y comprueba que termina en .es y que es la sede oficial antes de dar tus datos.',
    ],
  },
  co: {
    title: 'Tu alcaldía en Colombia',
    body: [
      'En la alcaldía pides la encuesta del Sisbén: es la puerta a casi todas las ayudas sociales.',
      'La Personería defiende tus derechos ante las entidades, y la comisaría de familia atiende la violencia en el hogar.',
      'La secretaría de movilidad de tu ciudad gestiona comparendos, pico y placa y licencias.',
      'Las webs oficiales de las alcaldías terminan en .gov.co: compruébalo antes de pagar o dar tus datos.',
    ],
  },
};

const govLink = (service: string, slug: string) => `https://www.gov.uk/${service}/${encodeURIComponent(slug)}`;

function ServiceLink({ href, es, en }: { href: string; es: string; en: string }) {
  return (
    <li className="flex items-stretch gap-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="press flex flex-1 flex-col rounded-2xl border-2 border-b-4 border-navy/10 bg-white px-4 py-3"
      >
        <span className="font-extrabold text-navy">{es} ↗</span>
        <span className="text-sm font-semibold text-ink-soft" lang="en">{en}</span>
      </a>
      <button
        onClick={() => {
          sfx.tap();
          void speak(en);
        }}
        aria-label={`Escuchar en inglés: ${en}`}
        className="press rounded-2xl border-2 border-b-4 border-navy/10 bg-cream px-3 text-xl"
      >
        🔊
      </button>
    </li>
  );
}

export function LocalScreen() {
  const [country, setCountry] = useState<Country>('uk');
  const [postcode, setPostcode] = useState(() => {
    try {
      return localStorage.getItem('britjoy-postcode') ?? '';
    } catch {
      return '';
    }
  });
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const setTab = useProgressStore((s) => s.setTab);
  const setLevel = useProgressStore((s) => s.setCurrentLevel);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcode.trim() || busy) return;
    setBusy(true);
    try {
      localStorage.setItem('britjoy-postcode', postcode.trim().toUpperCase());
    } catch {
      /* private mode: fine */
    }
    const r = await callFunction<Result>('council-finder', { postcode }).catch(() => ({ ok: false, status: 0, data: { status: 'error' } as Result }));
    setResult(r.data?.status ? r.data : { status: 'error' });
    setBusy(false);
  };

  const cities = CITY_LEVELS.filter((l) => l.id.startsWith(country === 'uk' ? 'UKC' : country === 'es' ? 'ESC' : 'COC') && l.targetLanguage === 'en');
  const openCity = (levelId: string) => {
    sfx.tap();
    setLevel(levelId);
    setTab('english');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-5">
      <div role="tablist" aria-label="País" className="grid grid-cols-3 gap-2">
        {(
          [
            ['uk', '🇬🇧', 'Reino Unido'],
            ['es', '🇪🇸', 'España'],
            ['co', '🇨🇴', 'Colombia'],
          ] as const
        ).map(([id, flag, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={country === id}
            onClick={() => setCountry(id)}
            className={`press rounded-2xl border-2 border-b-4 px-2 py-3 text-sm font-black ${
              country === id ? 'border-navy bg-navy text-white' : 'border-navy/10 bg-white text-navy'
            }`}
          >
            <span className="block text-2xl" aria-hidden>{flag}</span>
            {label}
          </button>
        ))}
      </div>

      {country === 'uk' ? (
        <section className="mt-5 rounded-3xl border-2 border-navy/10 bg-white p-5" aria-labelledby="council-title">
          <h2 id="council-title" className="text-2xl font-black text-navy">Tu council</h2>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Escribe tu código postal y te llevamos a los servicios de tu council: vivienda, council tax, servicios sociales, colegios y más. Datos oficiales de GOV.UK.
          </p>
          {backendConfigured ? (
            <form onSubmit={search} className="mt-4 flex gap-2">
              <label htmlFor="postcode" className="sr-only">Código postal (postcode)</label>
              <input
                id="postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Ej.: NW1 2DB"
                autoComplete="postal-code"
                maxLength={10}
                className="min-w-0 flex-1 rounded-2xl border-2 border-navy/20 px-4 py-3 text-lg font-bold uppercase text-navy"
              />
              <button type="submit" disabled={busy} className="press rounded-2xl border-b-4 border-navy-dark bg-navy px-5 font-black text-white disabled:opacity-60">
                {busy ? '…' : 'Buscar'}
              </button>
            </form>
          ) : (
            <a href="https://www.gov.uk/find-local-council" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-extrabold text-royal underline">
              Busca tu council en GOV.UK ↗
            </a>
          )}

          {result && result.status !== 'ok' && (
            <p role="status" className="mt-3 rounded-2xl bg-bad-light p-3 text-sm font-bold text-bad-dark">
              {result.status === 'invalid'
                ? 'Ese código postal no parece válido. Ejemplo: SW1A 1AA.'
                : result.status === 'not_found'
                  ? 'No encontramos ese código postal. Compruébalo en tu carta del council o de Royal Mail.'
                  : result.status === 'multiple'
                    ? 'Ese código postal está entre dos councils. Búscalo con tu dirección en GOV.UK.'
                    : 'No hemos podido consultar GOV.UK ahora. Inténtalo más tarde.'}{' '}
              {result.status !== 'invalid' && (
                <a href="https://www.gov.uk/find-local-council" target="_blank" rel="noopener noreferrer" className="underline">
                  Buscar en GOV.UK ↗
                </a>
              )}
            </p>
          )}

          {result?.status === 'ok' && (
            <div className="mt-5" role="status">
              <p className="text-sm font-black uppercase tracking-wider text-navy/60">Tu council</p>
              <a href={result.council.homepage} target="_blank" rel="noopener noreferrer" className="text-xl font-black text-royal underline">
                {result.council.name} ↗
              </a>
              {result.council.parent && (
                <p className="mt-1 text-sm font-semibold text-ink-soft">
                  Tu zona tiene dos councils: {result.council.name} (vivienda, council tax, basura) y{' '}
                  <a href={result.council.parent.homepage} target="_blank" rel="noopener noreferrer" className="font-extrabold text-royal underline">
                    {result.council.parent.name}
                  </a>{' '}
                  (servicios sociales y colegios). Cada enlace te lleva al que corresponde.
                </p>
              )}
              {result.council.slug === 'city-of-london' && (
                <p className="mt-1 text-sm font-semibold text-ink-soft">
                  La City of London Corporation es el council del centro financiero de Londres («the Square Mile»): tiene muy pocos residentes y algunos servicios funcionan distinto que en los distritos (boroughs).
                </p>
              )}
              {SERVICES.map((g) => (
                <div key={g.group} className="mt-4">
                  <h3 className="mb-2 font-black text-navy">{g.group}</h3>
                  <ul className="grid gap-2">
                    {g.items.map((s) => (
                      <ServiceLink key={s.slug} href={govLink(s.slug, result.council.slug)} es={s.es} en={s.en} />
                    ))}
                  </ul>
                </div>
              ))}
              <div className="mt-4">
                <h3 className="mb-2 font-black text-navy">🇬🇧 En todo el Reino Unido</h3>
                <ul className="grid gap-2">
                  {NATIONAL.map((s) => (
                    <ServiceLink key={s.url} href={s.url} es={s.es} en={s.en} />
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-xs font-semibold text-ink-soft">
                Cada enlace abre la página de GOV.UK para tu council, con el botón «Go to … website» que lleva a la página del council. Si tu council no tiene esa página, GOV.UK te dice dónde preguntar.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-5 rounded-3xl border-2 border-navy/10 bg-white p-5">
          <h2 className="text-2xl font-black text-navy">{COUNTRY_INFO[country].title}</h2>
          <ul className="mt-3 space-y-2 text-[16px] font-semibold text-ink">
            {COUNTRY_INFO[country].body.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-royal" aria-hidden>●</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6" aria-labelledby="cities-title">
        <h2 id="cities-title" className="text-xl font-black text-navy">Guías por ciudad: transporte, vivienda y servicios</h2>
        {cities.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-ink-soft">Estamos preparando las guías de las ciudades de este país.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {cities.flatMap((level) =>
              level.units.map((u) => (
                <button
                  key={u.lessons[0].id}
                  onClick={() => openCity(level.id)}
                  className="press flex items-center gap-3 rounded-2xl border-2 border-b-4 border-navy/10 bg-white p-4 text-left"
                >
                  <span className="text-3xl" aria-hidden>{u.icon}</span>
                  <span className="font-extrabold text-navy">{u.title}</span>
                </button>
              )),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
