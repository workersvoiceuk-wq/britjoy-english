import { useProgressStore } from '../store/useProgressStore';
import { MAX_HEARTS, msUntilNextHeart, toDateKey, visibleStreak } from '../logic/gamification';
import { formatDuration } from '../lib/util';
import type { LevelDefinition } from '../types';

interface Props {
  level: LevelDefinition;
  onOpenLevels: () => void;
  now: number;
}

export function Header({ level, onOpenLevels, now }: Props) {
  const { xp, hearts, heartsSince, streak, lastActiveDate } = useProgressStore();
  const shownStreak = visibleStreak(streak, lastActiveDate, toDateKey(new Date(now)));
  const nextHeart = msUntilNextHeart(hearts, heartsSince, now);

  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <button
          onClick={onOpenLevels}
          className="press flex items-center gap-2 rounded-2xl border-2 border-b-4 border-accent-dark bg-accent px-3 py-1.5 font-black text-white"
          aria-label={`Nivel ${level.id}. Cambiar nivel`}
        >
          <span className="text-lg">{level.id}</span>
          <span className="text-xs">▼</span>
        </button>
        <div className="flex items-center gap-3 text-base font-extrabold sm:gap-5">
          <span className="flex items-center gap-1 text-[#FF9600]" title="Racha de días seguidos">
            <span aria-hidden>🔥</span>
            <span>{shownStreak}</span>
            <span className="sr-only">días de racha</span>
          </span>
          <span className="flex items-center gap-1 text-[#FFC800]" title="Experiencia total">
            <span aria-hidden>⚡</span>
            <span className="text-[#E5A800]">{xp} XP</span>
          </span>
          <span
            className="flex items-center gap-1 text-bad"
            title={hearts < MAX_HEARTS ? `Próxima vida en ${formatDuration(nextHeart)}` : 'Vidas completas'}
          >
            <span aria-hidden>❤️</span>
            <span>{hearts}</span>
            <span className="sr-only">vidas</span>
          </span>
        </div>
      </div>
    </header>
  );
}
