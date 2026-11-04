import { useProgressStore, type AppTab } from '../store/useProgressStore';
import { sfx } from '../lib/sound';
import { useT, type MessageKey } from '../i18n';

const TABS: { id: AppTab; icon: string; label: MessageKey }[] = [
  { id: 'home', icon: '🏫', label: 'nav.courses' },
  { id: 'english', icon: '🎓', label: 'nav.learn' },
  { id: 'life', icon: '🇬🇧', label: 'nav.life' },
  { id: 'ai', icon: '🤖', label: 'nav.ai' },
  { id: 'settings', icon: '⚙️', label: 'nav.more' },
];

export function BottomNav() {
  const tab = useProgressStore((s) => s.tab);
  const setTab = useProgressStore((s) => s.setTab);
  const t_ = useT();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-navy/10 bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Secciones"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <li key={t.id}>
              <button
                onClick={() => {
                  if (!active) sfx.tap();
                  setTab(t.id);
                }}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-xs font-extrabold ${
                  active ? 'text-royal' : 'text-ink-soft'
                }`}
              >
                <span
                  className={`flex h-9 w-11 items-center justify-center rounded-xl text-2xl transition-colors ${
                    active ? 'bg-royal-light' : ''
                  }`}
                  aria-hidden
                >
                  {t.icon}
                </span>
                {t_(t.label)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
