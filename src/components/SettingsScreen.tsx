import { useProgressStore } from '../store/useProgressStore';
import { sfx } from '../lib/sound';
import { hush, narrate } from '../lib/narrator';
import { useT } from '../i18n';
import { LanguagePicker } from './LanguagePicker';

const PRIVACY_URL = 'https://workersvoiceuk-wq.github.io/britjoy-english/privacidad.html';
export const APP_VERSION = '1.0.0';

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-navy/10 bg-white p-4">
      <span>
        <span className="block text-lg font-extrabold text-navy">{label}</span>
        <span className="block text-sm font-semibold text-ink-soft">{hint}</span>
      </span>
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative h-8 w-14 shrink-0 rounded-full bg-ink-line transition-colors after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-6 peer-focus-visible:ring-4 peer-focus-visible:ring-navy/30"
      />
    </label>
  );
}

export function SettingsScreen() {
  const { voiceOn, soundOn, setVoiceOn, setSoundOn, reset, setTab, dailyGoal, setDailyGoal } = useProgressStore();
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 pb-32 pt-5">
      <button
        onClick={() => setTab('plus')}
        className="press flex w-full items-center justify-between rounded-2xl border-2 border-b-4 border-gold bg-gold-light p-4 text-left"
      >
        <span>
          <span className="block text-lg font-extrabold text-navy">👑 {t('settings.plus')}</span>
          <span className="block text-sm font-semibold text-ink-soft">{t('settings.plusHint')}</span>
        </span>
        <span aria-hidden className="text-xl text-navy">›</span>
      </button>
      <button
        onClick={() => setTab('resources')}
        className="press flex w-full items-center justify-between rounded-2xl border-2 border-b-4 border-navy/10 bg-white p-4 text-left"
      >
        <span>
          <span className="block text-lg font-extrabold text-navy">📚 {t('academy.resTitle')}</span>
          <span className="block text-sm font-semibold text-ink-soft">{t('academy.resText')}</span>
        </span>
        <span aria-hidden className="text-xl text-navy">›</span>
      </button>
      <Toggle
        label={t('settings.voice')}
        hint={t('settings.voiceHint')}
        on={voiceOn}
        onChange={(v) => {
          setVoiceOn(v);
          if (v) void narrate('¡Hola! Te acompaño con mi voz.');
          else hush();
        }}
      />
      <Toggle
        label={t('settings.sounds')}
        hint={t('settings.soundsHint')}
        on={soundOn}
        onChange={(v) => {
          setSoundOn(v);
          if (v) window.setTimeout(() => sfx.correct(), 50);
        }}
      />

      <section className="rounded-2xl border-2 border-navy/10 bg-white p-4">
        <h2 className="mb-1 text-lg font-extrabold text-navy">🎯 {t('settings.dailyGoal')}</h2>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('settings.dailyGoal')}>
          {[10, 20, 30, 50].map((xp) => (
            <button
              key={xp}
              role="radio"
              aria-checked={dailyGoal === xp}
              onClick={() => {
                sfx.tap();
                setDailyGoal(xp);
              }}
              className={`tile px-2 text-center text-base ${dailyGoal === xp ? 'tile-selected' : ''}`}
            >
              {xp} XP
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-navy/10 bg-white p-4">
        <h2 className="mb-2 text-lg font-extrabold text-navy">🌍 {t('lang.setting')}</h2>
        <LanguagePicker compact />
      </section>

      <div className="rounded-2xl border-2 border-navy/10 bg-white p-4 text-[15px] font-semibold text-ink-soft">
        <p className="font-extrabold text-navy">{t('settings.about')}</p>
        <p className="mt-1">
          Britjoy English · versión {APP_VERSION}. Tu progreso se guarda solo en este dispositivo. La cuenta (solo tu email) es
          opcional y sirve para el Modo IA y VUM Academy. Si usas el Modo IA, tus mensajes se envían a nuestro servidor
          y al proveedor de IA para generar la respuesta; los pagos los procesa Stripe.
        </p>
        <p className="mt-2">
          La sección «Vivir en UK» es información general, revisada con fuentes oficiales (GOV.UK, NHS, TfL). No es
          asesoramiento legal ni financiero: las normas y las cantidades cambian, así que confirma siempre en la web
          oficial antes de decidir.
        </p>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-extrabold text-navy underline">
          {t('settings.privacy')} ↗
        </a>
      </div>

      <button
        onClick={() => {
          if (window.confirm(t('settings.resetConfirm'))) reset();
        }}
        className="press w-full rounded-2xl border-2 border-b-4 border-royal/30 bg-white p-4 font-extrabold text-royal"
      >
        {t('settings.reset')}
      </button>
      <p className="pt-2 text-center text-xs font-bold text-ink-soft">{t('brand.close')}</p>
    </div>
  );
}
