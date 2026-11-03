/**
 * Britjoy, the guide. This is a placeholder SVG lion with four expressions.
 *
 * To swap in a real illustration, keep this component's props and replace the
 * <svg> with e.g. <img src={IMAGES[expression]} … /> (see README → "Replacing
 * Britjoy's avatar"). Nothing else in the app needs to change.
 */
export type BritjoyExpression = 'happy' | 'neutral' | 'sad' | 'celebrating';

interface Props {
  expression?: BritjoyExpression;
  size?: number;
  className?: string;
}

const MANE = '#E8892B';
const MANE_DARK = '#C96F18';
const FACE = '#FFD27A';
const MUZZLE = '#FFF1D0';
const INK = '#4B3420';

function Eyes({ expression }: { expression: BritjoyExpression }) {
  if (expression === 'celebrating') {
    // Happy closed eyes: ^ ^
    return (
      <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M37 50 q6 -8 12 0" />
        <path d="M71 50 q6 -8 12 0" />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx="43" cy="50" rx="5" ry={expression === 'sad' ? 5 : 6} fill={INK} />
      <ellipse cx="77" cy="50" rx="5" ry={expression === 'sad' ? 5 : 6} fill={INK} />
      <circle cx="45" cy="48" r="1.8" fill="#fff" />
      <circle cx="79" cy="48" r="1.8" fill="#fff" />
      {expression === 'sad' && (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d="M35 40 l12 -4" />
          <path d="M85 40 l-12 -4" />
        </g>
      )}
    </g>
  );
}

function Mouth({ expression }: { expression: BritjoyExpression }) {
  switch (expression) {
    case 'happy':
      return <path d="M50 72 q10 10 20 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case 'neutral':
      return <path d="M52 74 h16" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
    case 'sad':
      return <path d="M50 78 q10 -8 20 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case 'celebrating':
      return (
        <g>
          <path d="M47 70 q13 18 26 0 z" fill="#B3402A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M53 76 q7 5 14 0" fill="#FF8E8E" />
        </g>
      );
  }
}

export function Britjoy({ expression = 'happy', size = 96, className = '' }: Props) {
  const label = { happy: 'contento', neutral: 'atento', sad: 'triste', celebrating: 'celebrando' }[expression];
  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      className={className}
      role="img"
      aria-label={`Britjoy ${label}`}
    >
      {expression === 'celebrating' && (
        <g>
          <rect x="6" y="14" width="7" height="7" rx="1.5" fill="#1CB0F6" transform="rotate(20 9 17)" />
          <rect x="104" y="20" width="7" height="7" rx="1.5" fill="#FF4B4B" transform="rotate(-25 107 23)" />
          <circle cx="16" cy="96" r="4" fill="#CE82FF" />
          <circle cx="108" cy="92" r="4" fill="#58CC02" />
          <rect x="98" y="2" width="6" height="6" rx="1.5" fill="#FFC800" />
        </g>
      )}
      {/* Mane */}
      <g fill={MANE} stroke={MANE_DARK} strokeWidth="2">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={60 + Math.cos(a) * 38} cy={60 + Math.sin(a) * 38} r="16" />;
        })}
      </g>
      <circle cx="60" cy="60" r="38" fill={MANE} />
      {/* Ears */}
      <circle cx="30" cy="30" r="9" fill={FACE} stroke={MANE_DARK} strokeWidth="2" />
      <circle cx="90" cy="30" r="9" fill={FACE} stroke={MANE_DARK} strokeWidth="2" />
      {/* Face */}
      <circle cx="60" cy="60" r="32" fill={FACE} />
      <Eyes expression={expression} />
      <ellipse cx="60" cy="70" rx="17" ry="12" fill={MUZZLE} />
      <path d="M54 62 h12 l-6 6 z" fill={INK} strokeLinejoin="round" />
      <Mouth expression={expression} />
      {(expression === 'happy' || expression === 'celebrating') && (
        <g fill="#FF9E80" opacity="0.6">
          <ellipse cx="34" cy="64" rx="5" ry="3" />
          <ellipse cx="86" cy="64" rx="5" ry="3" />
        </g>
      )}
      {/* British bow tie */}
      <g transform="translate(60 106)">
        <path d="M-20 -9 L-2 0 L-20 9 Z" fill="#1F4BA5" stroke="#16367A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 -9 L2 0 L20 9 Z" fill="#1F4BA5" stroke="#16367A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-17 -1 h34 v2 h-34z" fill="#fff" />
        <rect x="-5" y="-6" width="10" height="12" rx="3" fill="#D52B1E" stroke="#A31F15" strokeWidth="2" />
      </g>
    </svg>
  );
}

interface BubbleProps {
  children: React.ReactNode;
  side?: 'left' | 'bottom';
  className?: string;
}

/** Speech bubble with a tail pointing at Britjoy. */
export function SpeechBubble({ children, side = 'left', className = '' }: BubbleProps) {
  const tail =
    side === 'left'
      ? 'before:left-[-9px] before:top-5 before:border-y-[9px] before:border-r-[9px] before:border-y-transparent before:border-r-ink-line'
      : 'before:left-8 before:top-[-9px] before:border-x-[9px] before:border-b-[9px] before:border-x-transparent before:border-b-ink-line';
  return (
    <div
      className={`relative rounded-2xl border-2 border-ink-line bg-white px-4 py-3 text-[15px] font-semibold leading-snug text-ink before:absolute before:content-[''] ${tail} ${className}`}
    >
      {children}
    </div>
  );
}

export function BritjoySays({
  expression = 'happy',
  size = 72,
  children,
  className = '',
}: {
  expression?: BritjoyExpression;
  size?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Britjoy expression={expression} size={size} className="shrink-0" />
      <SpeechBubble className="mt-1 flex-1">{children}</SpeechBubble>
    </div>
  );
}
