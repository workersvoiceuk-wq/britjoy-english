/**
 * Britjoy, the guide: the owner's official avatar (Queen's Guard with the
 * "Life in the UK" book), cut out from the owner's image into
 * src/assets/britjoy-avatar.webp. The artwork is never redrawn or recoloured;
 * moods and "talking" are shown only with movement (CSS transforms).
 */
import lionUrl from '../assets/britjoy-avatar.webp';
import lionSmallUrl from '../assets/britjoy-avatar-320.webp';

/** Width / height of the avatar artwork. */
const ASPECT = 655 / 572;

export type BritjoyExpression = 'happy' | 'neutral' | 'sad' | 'celebrating';

interface Props {
  expression?: BritjoyExpression;
  /** Rendered height in px. */
  size?: number;
  /** True while Britjoy's voice is playing. */
  speaking?: boolean;
  className?: string;
}

const MOTION: Record<BritjoyExpression, string> = {
  happy: '',
  neutral: '',
  sad: 'britjoy-sad',
  celebrating: 'britjoy-hop',
};

export function Britjoy({ expression = 'happy', size = 120, speaking = false, className = '' }: Props) {
  const label = { happy: 'contento', neutral: 'atento', sad: 'te anima', celebrating: 'celebrando' }[expression];
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ height: size, width: size * ASPECT }}>
      <img
        src={lionUrl}
        srcSet={`${lionSmallUrl} 320w, ${lionUrl} 655w`}
        sizes={`${Math.round(size * ASPECT)}px`}
        width={Math.round(size * ASPECT)}
        height={size}
        alt={`Britjoy ${label}`}
        draggable={false}
        className={`britjoy-fade h-full w-full select-none object-contain ${speaking ? 'britjoy-talk' : MOTION[expression]}`}
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
