/** Decorative London skyline silhouette (clock tower, wheel, bridge, bus, phone box). */
export function LondonSkyline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 160" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <g fill="#1D2D5C" opacity="0.12">
        {/* Bridge with two towers */}
        <rect x="430" y="70" width="34" height="90" />
        <rect x="560" y="70" width="34" height="90" />
        <path d="M426 70 l21 -26 l21 26z M556 70 l21 -26 l21 26z" />
        <rect x="464" y="96" width="96" height="10" />
        <rect x="380" y="128" width="270" height="10" />
        {/* Wheel */}
        <circle cx="690" cy="86" r="58" fill="none" stroke="#1D2D5C" strokeWidth="5" />
        <circle cx="690" cy="86" r="6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1="690" y1="86" x2={690 + Math.cos(a) * 58} y2={86 + Math.sin(a) * 58} stroke="#1D2D5C" strokeWidth="2" />;
        })}
        <path d="M672 160 l18 -74 l18 74z" />
        {/* Houses / terraces */}
        <path d="M0 160 V112 l22 -16 l22 16 V98 l22 -16 l22 16 V112 l20 -14 l20 14 V160z" />
        <path d="M250 160 V118 h40 V104 h50 V122 h40 V160z" />
      </g>
      {/* Clock tower */}
      <g fill="#1D2D5C" opacity="0.18">
        <rect x="160" y="40" width="44" height="120" />
        <rect x="154" y="36" width="56" height="10" />
        <path d="M162 36 l20 -30 l20 30z" />
        <rect x="180" y="0" width="4" height="10" />
        <circle cx="182" cy="62" r="13" fill="#FBF6EC" />
        <path d="M182 62 v-9 M182 62 h7" stroke="#1D2D5C" strokeWidth="2" />
      </g>
      {/* Phone box */}
      <g>
        <rect x="350" y="112" width="22" height="48" rx="3" fill="#C8102E" opacity="0.55" />
        <rect x="354" y="122" width="14" height="20" fill="#FBF6EC" opacity="0.7" />
      </g>
      {/* Double-decker bus */}
      <g opacity="0.6">
        <rect x="40" y="118" width="96" height="38" rx="7" fill="#C8102E" />
        <rect x="48" y="124" width="80" height="10" rx="2" fill="#FBF6EC" />
        <rect x="48" y="140" width="80" height="8" rx="2" fill="#FBF6EC" />
        <circle cx="60" cy="157" r="6" fill="#1D2D5C" />
        <circle cx="116" cy="157" r="6" fill="#1D2D5C" />
      </g>
    </svg>
  );
}
