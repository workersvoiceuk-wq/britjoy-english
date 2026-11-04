/**
 * Britjoy, the guide: the owner's official avatar (Queen's Guard with the
 * "Life in the UK" book), cut out from the owner's image into
 * src/assets/britjoy-avatar.webp and animated in Blender (src/assets/britjoy3d/).
 * The artwork is never redrawn or recoloured; moods, breathing and talking are
 * shown only with movement.
 */
import { useEffect, useState } from 'react';
// Animated Britjoy made in Blender (blender/britjoy_rig.py): the official artwork
// as one textured mesh deformed by a skeleton (head, arm, paw, breathing body).
// Nothing is redrawn or recoloured; the still frame is the untouched pose.
import stillUrl from '../assets/britjoy3d/britjoy-still.webp';
import idleUrl from '../assets/britjoy3d/britjoy-idle.webp';
import talkUrl from '../assets/britjoy3d/britjoy-talk.webp';
import celebrateUrl from '../assets/britjoy3d/britjoy-celebrate.webp';

/** Width / height of the rendered frames. */
const ASPECT = 330 / 300;

/** Animations load after the page, and never for people who asked for less motion or data saving. */
function useAnimated(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) return;
    const img = new Image();
    img.onload = () => setOn(true);
    const start = () => {
      img.src = idleUrl;
      // Warm the talking loop too, so it is ready when Britjoy speaks.
      new Image().src = talkUrl;
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start);
    else window.setTimeout(start, 400);
  }, []);
  return on;
}

export type BritjoyExpression = 'happy' | 'neutral' | 'sad' | 'celebrating';

interface Props {
  expression?: BritjoyExpression;
  /** Rendered height in px. */
  size?: number;
  /** True while Britjoy's voice is playing. */
  speaking?: boolean;
  className?: string;
}

export function Britjoy({ expression = 'happy', size = 120, speaking = false, className = '' }: Props) {
  const label = { happy: 'contento', neutral: 'atento', sad: 'te anima', celebrating: 'celebrando' }[expression];
  const [wiggle, setWiggle] = useState(false);
  const animated = useAnimated();
  const src = !animated ? stillUrl : speaking ? talkUrl : expression === 'celebrating' ? celebrateUrl : idleUrl;
  // The Blender loops carry the motion; CSS only adds the arrival bounce, the sad
  // droop and the tap wiggle (and keeps a gentle bob if the loops are not loaded).
  const css = wiggle
    ? 'britjoy-wiggle'
    : expression === 'sad'
      ? 'britjoy-sad'
      : animated
        ? ''
        : speaking
          ? 'britjoy-talk'
          : expression === 'celebrating'
            ? 'britjoy-hop'
            : 'britjoy-idle';
  return (
    <span className={`britjoy-enter relative inline-block shrink-0 ${className}`} style={{ height: size, width: size * ASPECT }}>
      <img
        src={src}
        width={Math.round(size * ASPECT)}
        height={size}
        alt={`Britjoy ${label}`}
        draggable={false}
        onPointerDown={() => setWiggle(true)}
        onAnimationEnd={(e) => {
          if (e.animationName === 'britjoy-wiggle') setWiggle(false);
        }}
        className={`britjoy-fade relative h-full w-full select-none object-contain ${css}`}
      />
      {expression === 'celebrating' && (
        <span aria-hidden className="absolute -right-2 -top-1 text-2xl animate-pop">🎉</span>
      )}
      {speaking && (
        <span aria-hidden className="absolute -right-1 top-[18%] flex items-end gap-[2px]" title="Britjoy está hablando">
          <i className="voice-bar" />
          <i className="voice-bar [animation-delay:120ms]" />
          <i className="voice-bar [animation-delay:240ms]" />
        </span>
      )}
    </span>
  );
}

interface BubbleProps {
  children: React.ReactNode;
  className?: string;
}

/** Speech bubble with a tail pointing left at Britjoy. */
export function SpeechBubble({ children, className = '' }: BubbleProps) {
  return (
    <div
      className={`relative rounded-2xl border-2 border-navy/15 bg-white px-4 py-3 text-[15px] font-semibold leading-snug text-ink shadow-[0_2px_0_rgba(29,45,92,0.12)] before:absolute before:left-[-9px] before:top-6 before:border-y-[9px] before:border-r-[9px] before:border-y-transparent before:border-r-navy/15 before:content-[''] ${className}`}
    >
      {children}
    </div>
  );
}

export function BritjoySays({
  expression = 'happy',
  size = 110,
  speaking = false,
  children,
  className = '',
}: {
  expression?: BritjoyExpression;
  size?: number;
  speaking?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Britjoy expression={expression} size={size} speaking={speaking} />
      <SpeechBubble className="mt-2 flex-1">{children}</SpeechBubble>
    </div>
  );
}
