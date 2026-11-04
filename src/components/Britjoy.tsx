/**
 * Britjoy, the guide: the owner's official avatar (Queen's Guard with the
 * "Life in the UK" book), cut out from the owner's image into
 * src/assets/britjoy-avatar.webp and animated with a skeleton designed in Blender
 * (blender/britjoy_rig.py, run live by src/lib/britjoyRig.ts). The artwork is never
 * redrawn or recoloured; moods, breathing and talking are shown only with movement.
 */
import { useEffect, useRef, useState } from 'react';
import lionUrl from '../assets/britjoy-avatar.webp';
import { ART_H, ART_W, PAD, REST_POSE, VIEW_H, VIEW_W, createRig, mixPose, poseAt, type Motion } from '../lib/britjoyRig';

/** Width / height of Britjoy's box (the artwork plus room for the raised paw). */
const ASPECT = VIEW_W / VIEW_H;

const motionAllowed = () =>
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
  typeof WebGLRenderingContext !== 'undefined';

/**
 * Runs the Blender-designed skeleton on a canvas. Returns true once the canvas is
 * drawing; until then (or without WebGL / with reduced motion) the still image shows.
 */
function useRig(canvas: React.RefObject<HTMLCanvasElement>, motion: Motion, size: number): boolean {
  const [live, setLive] = useState(false);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  useEffect(() => {
    const el = canvas.current;
    if (!el || !motionAllowed()) return;
    let raf = 0;
    let visible = true;
    let stopped = false;
    let dispose = () => {};
    const img = new Image();
    img.decoding = 'async';
    const observer = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    observer.observe(el);
    // Start the skeleton after the page has loaded, so it never delays the first screen.
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle ? window.requestIdleCallback(() => (img.src = lionUrl), { timeout: 2500 }) : 0;
    const timer = hasIdle ? 0 : window.setTimeout(() => (img.src = lionUrl), 800);
    img.onload = () => {
      if (stopped) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(size * ASPECT * dpr);
      el.height = Math.round(size * dpr);
      const rig = createRig(el, img);
      if (!rig) return;
      dispose = () => rig.dispose();
      // Cross-fade between loops so switching (e.g. to talking) never jumps.
      let current = motionRef.current;
      let switchAt = 0;
      let from = REST_POSE;
      let last = REST_POSE;
      const start = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;
        const t = (now - start) / 1000;
        if (motionRef.current !== current) {
          from = last;
          current = motionRef.current;
          switchAt = t;
        }
        const target = poseAt(current, t - switchAt);
        const k = Math.min(1, (t - switchAt) / 0.3);
        const blend = k < 1 && switchAt > 0;
        const pose = blend ? mixPose(from, target, k) : target;
        last = pose;
        rig.draw(pose);
      };
      raf = requestAnimationFrame(frame);
      setLive(true);
    };
    return () => {
      stopped = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      observer.disconnect();
      dispose();
    };
  }, [canvas, size]);
  return live;
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
  const canvas = useRef<HTMLCanvasElement>(null);
  const motion: Motion = speaking ? 'talk' : expression === 'celebrating' ? 'celebrate' : 'idle';
  const live = useRig(canvas, motion, size);
  // The skeleton carries the motion; CSS only adds the sad droop and the tap wiggle,
  // and a gentle bob when the skeleton cannot run.
  const css = wiggle
    ? 'britjoy-wiggle'
    : expression === 'sad'
      ? 'britjoy-sad'
      : live
        ? ''
        : speaking
          ? 'britjoy-talk'
          : expression === 'celebrating'
            ? 'britjoy-hop'
            : 'britjoy-idle';
  const art = {
    left: `${(PAD.left / VIEW_W) * 100}%`,
    top: `${(PAD.top / VIEW_H) * 100}%`,
    width: `${(ART_W / VIEW_W) * 100}%`,
    height: `${(ART_H / VIEW_H) * 100}%`,
  };
  return (
    <span
      role="img"
      aria-label={`Britjoy ${label}`}
      className={`relative inline-block shrink-0 ${className}`}
      style={{ height: size, width: size * ASPECT }}
      onPointerDown={() => setWiggle(true)}
    >
      <span
        className={`britjoy-fade absolute inset-0 ${css}`}
        onAnimationEnd={(e) => {
          if (e.animationName === 'britjoy-wiggle') setWiggle(false);
        }}
      >
        <img
          src={lionUrl}
          alt=""
          draggable={false}
          className={`absolute select-none object-contain ${live ? 'invisible' : ''}`}
          style={art}
        />
        <canvas ref={canvas} aria-hidden className={`absolute inset-0 h-full w-full ${live ? '' : 'invisible'}`} />
      </span>
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
