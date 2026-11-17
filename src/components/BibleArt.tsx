/* Hero illustration: an open Bible with light rising from its pages, drawn in the brand colours.
   Pure SVG, so it is crisp at any size and loads instantly. */
export default function BibleArt() {
  return (
    <svg className="bible-svg" viewBox="0 0 400 330" role="img" aria-label="An open Bible with light shining from its pages">
      <defs>
        <radialGradient id="ba-glow" cx="50%" cy="38%" r="55%">
          <stop offset="0" stopColor="#FFF4CF" stopOpacity=".95" />
          <stop offset=".35" stopColor="#F4C95D" stopOpacity=".55" />
          <stop offset="1" stopColor="#F4C95D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ba-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFF4CF" stopOpacity=".85" />
          <stop offset="1" stopColor="#FFF4CF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ba-pageL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F3E7C8" />
          <stop offset=".8" stopColor="#FFF9EA" />
          <stop offset="1" stopColor="#D9C79A" />
        </linearGradient>
        <linearGradient id="ba-pageR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#F3E7C8" />
          <stop offset=".8" stopColor="#FFF9EA" />
          <stop offset="1" stopColor="#D9C79A" />
        </linearGradient>
        <linearGradient id="ba-cover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A1A9E" />
          <stop offset="1" stopColor="#120870" />
        </linearGradient>
      </defs>

      {/* Light rising from the Word */}
      <ellipse cx="200" cy="120" rx="190" ry="130" fill="url(#ba-glow)" className="ba-glow" />
      <g className="ba-beams" opacity=".7">
        <path d="M200 150 L130 0 L170 0 Z" fill="url(#ba-beam)" />
        <path d="M200 150 L185 0 L215 0 Z" fill="url(#ba-beam)" />
        <path d="M200 150 L230 0 L270 0 Z" fill="url(#ba-beam)" />
        <path d="M200 150 L60 20 L95 5 Z" fill="url(#ba-beam)" opacity=".6" />
        <path d="M200 150 L305 5 L340 20 Z" fill="url(#ba-beam)" opacity=".6" />
      </g>
      {/* Cross of light */}
      <g className="ba-cross" opacity=".95">
        <rect x="195" y="38" width="10" height="70" rx="3" fill="#FFF9EA" />
        <rect x="176" y="56" width="48" height="10" rx="3" fill="#FFF9EA" />
      </g>

      {/* Cover */}
      <path d="M14 112 Q110 96 200 124 Q290 96 386 112 L386 262 Q292 248 200 284 Q108 248 14 262 Z" fill="url(#ba-cover)" stroke="#F4C95D" strokeWidth="2.5" />
      {/* Page edges (thickness) */}
      <g stroke="#D9A93A" strokeWidth="1.4" fill="none" opacity=".9">
        <path d="M26 252 Q112 240 200 272" /><path d="M374 252 Q288 240 200 272" />
        <path d="M24 247 Q112 235 200 267" /><path d="M376 247 Q288 235 200 267" />
        <path d="M22 242 Q112 230 200 262" /><path d="M378 242 Q288 230 200 262" />
      </g>
      {/* Pages */}
      <path d="M24 104 Q112 82 200 116 L200 258 Q112 224 24 238 Z" fill="url(#ba-pageL)" />
      <path d="M376 104 Q288 82 200 116 L200 258 Q288 224 376 238 Z" fill="url(#ba-pageR)" />
      {/* Spine shadow */}
      <path d="M192 116 Q200 118 208 116 L208 258 Q200 262 192 258 Z" fill="#B39A62" opacity=".45" />

      {/* Lines of text */}
      <g stroke="#B9A57A" strokeWidth="3" strokeLinecap="round" opacity=".55" fill="none">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const y = 120 + i * 15;
          return <g key={i}>
            <path d={`M46 ${y - 6} Q118 ${y - 20} 182 ${y + 6}`} strokeDasharray={i % 3 === 2 ? '60 8 40 200' : undefined} />
            <path d={`M218 ${y + 6} Q282 ${y - 20} 354 ${y - 6}`} strokeDasharray={i % 3 === 1 ? '70 8 30 200' : undefined} />
          </g>;
        })}
      </g>
      {/* Ribbon bookmark */}
      <path d="M210 116 L222 114 L224 300 L216 290 L208 302 Z" fill="#C8302F" />
      <path d="M210 116 L222 114 L223 140 L210 142 Z" fill="#8E1F1F" opacity=".5" />
    </svg>
  );
}
