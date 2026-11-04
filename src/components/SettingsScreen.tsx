import { useProgressStore } from '../store/useProgressStore';
import { sfx } from '../lib/sound';
import { hush, narrate } from '../lib/narrator';

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
  const { voiceOn, soundOn, setVoiceOn, setSoundOn, reset } = useProgressStore();
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 pb-32 pt-5">
      <Toggle
        label="Voz de Britjoy"
        hint="Britjoy lee en voz alta las explicaciones y las instrucciones."
        on={voiceOn}
        onChange={(v) => {
          setVoiceOn(v);
          if (v) void narrate('¡Hola! Te acompaño con mi voz.');
          else hush();
        }}
      />
      <Toggle
        label="Sonidos"
        hint="Campanadas, aciertos y fallos."
        on={soundOn}
        onChange={(v) => {
          setSoundOn(v);
          if (v) window.setTimeout(() => sfx.correct(), 50);
        }}
      />

      <div className="rounded-2xl border-2 border-navy/10 bg-white p-4 text-[15px] font-semibold text-ink-soft">
        <p className="font-extrabold text-navy">Sobre la app</p>
        <p className="mt-1">
          Britjoy English · versión {APP_VERSION}. Tu progreso se guarda solo en este dispositivo; no hay cuentas ni se
          envían datos personales.
        </p>
        <p className="mt-2">
          La sección «Vivir en UK» es información general, revisada con fuentes oficiales (GOV.UK, NHS, TfL). No es
          asesoramiento legal ni financiero: las normas y las cantidades cambian, así que confirma siempre en la web
          oficial antes de decidir.
        </p>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-extrabold text-navy underline">
          Política de privacidad ↗
        </a>
      </div>

      <button
        onClick={() => {
          if (window.confirm('¿Borrar todo tu progreso (lecciones, XP y racha) de este dispositivo?')) reset();
        }}
        className="press w-full rounded-2xl border-2 border-b-4 border-royal/30 bg-white p-4 font-extrabold text-royal"
      >
        Borrar mi progreso
      </button>
      <p className="pt-2 text-center text-xs font-bold text-ink-soft">Voz Unida Mundo Academy · te enseña — Tu voz cuenta</p>
    </div>
  );
}
