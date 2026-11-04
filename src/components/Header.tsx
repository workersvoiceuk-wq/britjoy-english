import { useProgressStore } from '../store/useProgressStore';
import { MAX_HEARTS, msUntilNextHeart, toDateKey, visibleStreak } from '../logic/gamification';
import { formatDuration } from '../lib/util';
import type { LevelDefinition } from '../types';

interface Props {
  /** English level shown in the level button; omit to show `title` instead. */
  level?: LevelDefinition;
  title?: string;
  onOpenLevels?: () => void;
  now: number;
}

export function Header({ level, title, onOpenLevels, now }: Props) {
  const { xp, hearts, heartsSince, streak, lastActiveDate } = useProgressStore();
  const shownStreak = visibleStreak(streak, lastActiveDate, toDateKey(new Date(now)));
  const nextHeart = msUntilNextHeart(hearts, heartsSince, now);

  return (
    <header className="sticky top-[env(safe-area-inset-top)] z-20">
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          {level && onOpenLevels ? (
            <button
              onClick={onOpenLevels}
              className="press flex items-center gap-2 rounded-2xl border-2 border-b-4 border-accent-dark bg-accent px-3 py-1.5 font-black text-white"
              aria-label={`${level.name}. Cambiar de nivel o curso`}
            >
              <span className="text-lg">{level.short ?? level.id}</span>
              <span className="text-xs">▼</span>
            </button>
          ) : (
            <span className="text-lg font-black tracking-wide">{title}</span>
          )}
          <div className="flex items-center gap-3 text-base font-extrabold sm:gap-5">
            <span className="flex items-center gap-1 text-[#FFB547]" title="Racha de días seguidos">
              <span aria-hidden>🔥</span>
              <span>{shownStreak}</span>
              <span className="sr-only">días de racha</span>
            </span>
            <span className="flex items-center gap-1 text-gold-light" title="Experiencia total">
              <span aria-hidden>⚡</span>
              <span>{xp} XP</span>
            </span>
            <span
              className="flex items-center gap-1 text-[#FF8A9B]"
              title={hearts < MAX_HEARTS ? `Próxima vida en ${formatDuration(nextHeart)}` : 'Vidas completas'}
            >
              <span aria-hidden>❤️</span>
              <span>{hearts}</span>
              <span className="sr-only">vidas</span>
            </span>
          </div>
        </div>
      </div>
      <div className="bunting" aria-hidden />
    </header>
  );
}
