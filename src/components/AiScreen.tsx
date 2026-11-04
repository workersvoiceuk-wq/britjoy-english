import { useEffect, useRef, useState } from 'react';
import { AiError, aiConfigured, askBritjoy, type ChatTurn } from '../lib/ai';
import { useAccount, usePlus } from '../lib/backend';
import { PLUS_AI_DAILY } from '../lib/plans';
import { AccountBox } from './PlusScreen';
import { useProgressStore } from '../store/useProgressStore';
import { narrate, useVoice } from '../lib/narrator';
import { sfx } from '../lib/sound';
import { Britjoy } from './Britjoy';
import { useT } from '../i18n';

const SUGGESTIONS = [
  'Corrige mi frase: «Yesterday I go to the doctor»',
  'Practiquemos una llamada al GP para pedir cita',
  'Explícame la diferencia entre «make» y «do»',
  'Simula una entrevista de trabajo corta en inglés',
  '¿Cómo pregunto en un museo si la entrada es gratis?',
];

const WELCOME =
  '¡Hola! Soy Britjoy en Modo IA. Pregúntame dudas de inglés, pídeme que corrija tus frases o practiquemos una situación real. Recuerda: no compartas datos personales, y para normas o dinero comprueba siempre GOV.UK.';

/** Strips the simple Markdown the tutor may use (bold) for display and speech. */
const plain = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '$1');

export function AiScreen() {
  const level = useProgressStore((s) => s.currentLevel);
  const speaking = useVoice((s) => s.speaking);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const email = useAccount((s) => s.email);
  const credits = useAccount((s) => s.credits);
  const freeLeft = useAccount((s) => s.freeLeft);
  const plus = usePlus();
  const setTab = useProgressStore((s) => s.setTab);
  const endRef = useRef<HTMLDivElement>(null);
  const ready = aiConfigured();
  const t = useT();

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [turns, busy]);

  const send = async (text: string) => {
    const content = text.trim().slice(0, 1200);
    if (!content || busy) return;
    sfx.tap();
    const next: ChatTurn[] = [...turns, { role: 'user', content }];
    setTurns(next);
    setDraft('');
    setError(null);
    setErrorCode(null);
    setBusy(true);
    try {
      const reply = await askBritjoy(next, /^[ABC][12]$/.test(level) ? level : 'A1');
      setTurns([...next, { role: 'assistant', content: reply }]);
      sfx.pop();
      void narrate(plain(reply));
    } catch (e) {
      setError((e as Error).message);
      setErrorCode(e instanceof AiError ? e.code : null);
      setTurns(turns); // keep history consistent (ends with an assistant turn or empty)
      setDraft(content);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 pb-44 pt-4">
      <div className="mb-4 flex items-end gap-2">
        <Britjoy size={96} speaking={speaking} expression={busy ? 'neutral' : 'happy'} />
        <div className="mb-2 flex-1 rounded-2xl border-2 border-navy/15 bg-white px-4 py-3 text-[15px] font-semibold leading-snug">
          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-royal">{t('ai.kicker')}</span>
          {ready ? WELCOME : t('ai.notActive')}
        </div>
      </div>

      {ready && !email && (
        <section className="rounded-2xl border-2 border-navy/10 bg-white p-4">
          <AccountBox />
        </section>
      )}

      {ready && email && (
        <>
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-extrabold text-navy/70">
            {plus ? (
              <span>
                👑 VUM Academy{freeLeft !== null ? ` · 🤖 ${freeLeft}/${PLUS_AI_DAILY}` : ''}
              </span>
            ) : (
              <>
                {freeLeft !== null && <span>{t('ai.freeLeft', { n: freeLeft })}</span>}
                <span>{t('ai.credits', { n: credits })}</span>
                <button onClick={() => setTab('plus')} className="text-royal underline">
                  {t('ai.getMore')}
                </button>
              </>
            )}
          </p>
          <ul className="space-y-3" aria-live="polite">
            {turns.map((turn, i) => (
              <li key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] font-semibold leading-relaxed ${
                    turn.role === 'user' ? 'bg-navy text-white' : 'border-2 border-navy/10 bg-white text-ink'
                  }`}
                >
                  {turn.role === 'assistant'
                    ? turn.content.split(/(\*\*.+?\*\*)/g).map((part, j) =>
                        part.startsWith('**') ? (
                          <strong key={j} className="text-navy">{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={j}>{part}</span>
                        ),
                      )
                    : turn.content}
                  {turn.role === 'assistant' && (
                    <button
                      onClick={() => void narrate(plain(turn.content))}
                      className="mt-1 block text-xs font-extrabold text-royal"
                      aria-label="Escuchar la respuesta"
                    >
                      🔊 {t('ai.listen')}
                    </button>
                  )}
                </div>
              </li>
            ))}
            {busy && (
              <li className="text-sm font-bold text-ink-soft" role="status">
                {t('ai.typing')}
              </li>
            )}
          </ul>
          <div ref={endRef} />

          {turns.length === 0 && (
            <div className="mt-2">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-navy/60">{t('ai.try')}</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="press rounded-full border-2 border-b-4 border-navy/10 bg-white px-3 py-2 text-left text-sm font-bold text-navy"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-bad-light px-3 py-2 text-sm font-bold text-bad-dark">
              {error}
              {errorCode === 'no_credits' && (
                <button onClick={() => setTab('plus')} className="ms-2 underline">
                  👑 {t('ai.getMore')}
                </button>
              )}
            </p>
          )}

          <form
            className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 border-t-2 border-navy/10 bg-white/95 px-4 py-3 backdrop-blur"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <div className="mx-auto flex max-w-3xl gap-2">
              <label className="sr-only" htmlFor="ai-input">Escribe a Britjoy</label>
              <input
                id="ai-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1200}
                placeholder={t('ai.placeholder')}
                className="min-w-0 flex-1 rounded-2xl border-2 border-ink-line bg-cream px-4 py-3 font-semibold outline-none focus:border-navy"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="press rounded-2xl border-b-4 border-royal-dark bg-royal px-4 font-black text-white disabled:border-[#C4C4C4] disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF]"
              >
                {t('ai.send')}
              </button>
            </div>
            <p className="mx-auto mt-1 max-w-3xl text-[11px] font-semibold text-ink-soft">
              {t('ai.disclaimer')}
            </p>
          </form>
        </>
      )}
    </div>
  );
}
