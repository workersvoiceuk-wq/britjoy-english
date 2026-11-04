/**
 * App interface languages (the "I speak…" choice, as in Duolingo or Busuu).
 * Lessons are written for Spanish speakers; the interface can be shown in any of
 * these languages, and learners whose language isn't Spanish see a notice.
 */
import { useProgressStore } from '../store/useProgressStore';
import { es, type MessageKey, type Messages } from './es';
import { en } from './en';
import { pt } from './pt';
import { fr } from './fr';
import { it } from './it';
import { pl } from './pl';
import { ro } from './ro';
import { ar } from './ar';
import { ur } from './ur';
import { pa } from './pa';

export type UiLang = 'es' | 'en' | 'pt' | 'fr' | 'it' | 'pl' | 'ro' | 'ar' | 'ur' | 'pa';

export const LANGUAGES: { code: UiLang; native: string; english: string; rtl?: boolean }[] = [
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'ro', native: 'Română', english: 'Romanian' },
  { code: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
  { code: 'ur', native: 'اردو', english: 'Urdu', rtl: true },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
];

export const MESSAGES: Record<UiLang, Messages> = { es, en, pt, fr, it, pl, ro, ar, ur, pa };

export function isRtl(lang: UiLang): boolean {
  return LANGUAGES.some((l) => l.code === lang && l.rtl);
}

/** Best match for the device language, used to preselect the picker. */
export function guessLang(): UiLang {
  const nav = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const tag of nav) {
    const code = tag.toLowerCase().split('-')[0] as UiLang;
    if (code in MESSAGES) return code;
  }
  return 'es';
}

export function translate(lang: UiLang, key: MessageKey, vars: Record<string, string | number> = {}): string {
  const text = MESSAGES[lang]?.[key] ?? es[key];
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** React hook: `const t = useT(); t('nav.courses')`. */
export function useT() {
  const lang = (useProgressStore((s) => s.uiLang) ?? 'es') as UiLang;
  return (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export type { MessageKey };
