import { useState } from 'react';
import { LANGUAGES, guessLang, translate, type UiLang } from '../i18n';
import { useProgressStore } from '../store/useProgressStore';
import { sfx } from '../lib/sound';
import { Britjoy } from './Britjoy';
import { Button } from './Button';

/** "What language do you speak?" — shown on first launch and from settings. */
export function LanguagePicker({ onDone, compact = false }: { onDone?: () => void; compact?: boolean }) {
  const current = useProgressStore((s) => s.uiLang) as UiLang | null;
  const setUiLang = useProgressStore((s) => s.setUiLang);
  const [choice, setChoice] = useState<UiLang>(current ?? guessLang());
  const t = (k: Parameters<typeof translate>[1]) => translate(choice, k);

  const list = (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t('lang.title')}>
      {LANGUAGES.map((l) => (
        <li key={l.code}>
          <button
            role="radio"
            aria-checked={choice === l.code}
            lang={l.code}
            dir={l.rtl ? 'rtl' : 'ltr'}
            onClick={() => {
              sfx.tap();
              setChoice(l.code);
              if (compact) setUiLang(l.code);
            }}
            className={`tile w-full text-center ${choice === l.code ? 'tile-selected' : ''}`}
          >
            <span className="block text-lg font-black">{l.native}</span>
            <span className="block text-xs font-bold opacity-70" dir="ltr">{l.english}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  if (compact) return list;

  return (
    <div className="paper mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-8" dir={LANGUAGES.find((l) => l.code === choice)?.rtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Britjoy size={110} />
        <div>
          <h1 className="text-2xl font-black text-navy">{t('lang.title')}</h1>
          <p className="mt-1 text-[15px] font-semibold text-ink-soft">{t('lang.subtitle')}</p>
        </div>
      </div>
      {list}
      {choice !== 'es' && (
        <p className="rounded-2xl bg-gold-light px-4 py-3 text-sm font-bold text-gold-dark" role="note">
          {t('lang.contentNote')}
        </p>
      )}
      <Button
        block
        onClick={() => {
          setUiLang(choice);
          onDone?.();
        }}
      >
        {t('lang.continue')}
      </Button>
    </div>
  );
}
