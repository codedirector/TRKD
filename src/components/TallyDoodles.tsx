import React from 'react';

// ==========================================
// HAND-DRAWN DOODLE SVGs (Noun Project & Magnific Style)
// All SVGs feature vectorEffect="non-scaling-stroke", round caps/joins,
// and expressive hand-sketched paths.
// ==========================================

// 1. Whimsical Hand-Drawn Squiggle Underline (perfectly mapped to text width)
export const SquiggleUnderline: React.FC<{ 
  color?: string; 
  className?: string;
  strokeWidth?: number;
}> = ({ 
  color = '#FF7A00', 
  className = 'w-full h-3 sm:h-4',
  strokeWidth = 3.5
}) => (
  <svg 
    viewBox="0 0 280 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    preserveAspectRatio="none"
  >
    <path 
      d="M2 15C32 5 62 21 95 13C128 5 158 21 190 13C222 5 252 21 278 12" 
      stroke={color} 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

// 2. Hand-Drawn Smooth Pen Line (organic single pen stroke)
export const HandDrawnLine: React.FC<{
  color?: string;
  className?: string;
  strokeWidth?: number;
}> = ({
  color = '#FF7A00',
  className = 'w-full h-2 sm:h-3',
  strokeWidth = 3.5
}) => (
  <svg
    viewBox="0 0 280 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="none"
  >
    <path
      d="M2 9C60 6 150 11 278 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

// 3. Double-Pass Scribble Underline
export const DoubleSquiggleLine: React.FC<{
  color?: string;
  className?: string;
}> = ({
  color = '#FF7A00',
  className = 'w-full h-3 sm:h-4'
}) => (
  <svg
    viewBox="0 0 280 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="none"
  >
    <path
      d="M3 8C45 4 110 13 180 6C220 2 250 8 277 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M8 15C55 11 125 17 195 10C235 6 260 12 274 13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      opacity="0.8"
    />
  </svg>
);

// 4. Hand-Drawn Highlighter Circle / Loop (encircles words or badges)
export const DoodleCircleLoop: React.FC<{
  color?: string;
  className?: string;
  strokeWidth?: number;
}> = ({
  color = '#FF7A00',
  className = 'w-16 h-10',
  strokeWidth = 3
}) => (
  <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
    {/* First loose loop */}
    <path 
      d="M25 15C45 8 85 10 92 28C98 44 78 54 48 54C20 54 5 44 8 26C11 10 40 4 72 8C90 10 94 22 90 32" 
      stroke={color} 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

// 5. Curly Hand-Drawn Arrow (spirals playfully towards a CTA or element)
export const DoodleCurlyArrow: React.FC<{
  className?: string;
  stroke?: string;
}> = ({
  className = 'w-12 h-12',
  stroke = 'currentColor'
}) => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Looping tail */}
    <path 
      d="M8 12C20 6 36 8 36 22C36 34 22 36 18 28C14 20 25 14 36 20C48 26 46 44 48 52" 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      vectorEffect="non-scaling-stroke"
    />
    {/* Arrowhead */}
    <path 
      d="M38 46L48 52L52 42" 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

// 6. Curved Pointer Arrow
export const DoodleArrow: React.FC<{ className?: string; stroke?: string }> = ({ 
  className = 'w-10 h-10', 
  stroke = 'currentColor' 
}) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M8 12C16 16 32 24 38 36" 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      vectorEffect="non-scaling-stroke"
    />
    <path 
      d="M26 36L38 36L36 24" 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

// 7. Hand-Drawn Lightbulb Idea Doodle (with radiating rays)
export const DoodleLightbulb: React.FC<{
  className?: string;
  bulbColor?: string;
  stroke?: string;
}> = ({
  className = 'w-10 h-10',
  bulbColor = '#FFDE59',
  stroke = 'currentColor'
}) => (
  <svg viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Radiating bursts */}
    <path d="M30 4V10" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 12L17 17" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M48 12L43 17" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M6 30H12" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M48 30H54" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />

    {/* Bulb Body */}
    <path 
      d="M20 46C15 42 12 36 12 28C12 18 20 12 30 12C40 12 48 18 48 28C48 36 45 42 40 46L38 52H22L20 46Z" 
      fill={bulbColor} 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinejoin="round" 
    />
    {/* Filament inner squiggle */}
    <path d="M26 32L30 24L34 32" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Base screw thread */}
    <path d="M23 57H37" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M26 62H34" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 8. Hand-Drawn Sparkle Stars (Magnific / Noun Project 4-Point Star)
export const DoodleSparkles: React.FC<{
  className?: string;
  color?: string;
  stroke?: string;
}> = ({
  className = 'w-8 h-8',
  color = '#FFDE59',
  stroke = '#111827'
}) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Main 4-point sparkle */}
    <path 
      d="M24 4C24 16 28 20 40 20C28 20 24 24 24 36C24 24 20 20 8 20C20 20 24 16 24 4Z" 
      fill={color} 
      stroke={stroke} 
      strokeWidth="2" 
      strokeLinejoin="round" 
    />
    {/* Secondary baby sparkle */}
    <path 
      d="M38 32C38 36 39 37 43 37C39 37 38 38 38 42C38 38 37 37 33 37C37 37 38 36 38 32Z" 
      fill="#70EE9C" 
      stroke={stroke} 
      strokeWidth="1.5" 
    />
  </svg>
);

// 9. Hand-Drawn Paper Airplane Doodle (representing fast publishing & sending)
export const DoodlePaperPlane: React.FC<{
  className?: string;
  color?: string;
  stroke?: string;
}> = ({
  className = 'w-10 h-10',
  color = '#FEF6E4',
  stroke = 'currentColor'
}) => (
  <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Flight trail dashed loop */}
    <path 
      d="M4 36C10 42 16 38 12 30C8 22 18 18 26 24" 
      stroke={stroke} 
      strokeWidth="2" 
      strokeDasharray="3 3" 
      strokeLinecap="round" 
    />
    {/* Airplane body */}
    <path 
      d="M24 24L54 8L36 44L30 30L24 24Z" 
      fill={color} 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinejoin="round" 
    />
    {/* Fold line */}
    <path d="M54 8L30 30" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 10. Hand-Drawn Little Crown Doodle (winner / pro tier)
export const DoodleCrown: React.FC<{
  className?: string;
  color?: string;
  stroke?: string;
}> = ({
  className = 'w-8 h-8',
  color = '#FFDE59',
  stroke = '#111827'
}) => (
  <svg viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M8 32L5 14L18 20L25 8L32 20L45 14L42 32H8Z" 
      fill={color} 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinejoin="round" 
    />
    {/* Little round jewels on peaks */}
    <circle cx="5" cy="14" r="2" fill={stroke} />
    <circle cx="25" cy="8" r="2" fill={stroke} />
    <circle cx="45" cy="14" r="2" fill={stroke} />
    <path d="M14 28H36" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 11. Hand-Drawn Sketchy Heart Doodle
export const DoodleHeart: React.FC<{
  className?: string;
  color?: string;
  stroke?: string;
}> = ({
  className = 'w-7 h-7',
  color = '#FF5C5C',
  stroke = '#111827'
}) => (
  <svg viewBox="0 0 50 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M25 40C25 40 6 28 6 16C6 9 12 5 18 5C22 5 24 8 25 11C26 8 28 5 32 5C38 5 44 9 44 16C44 28 25 40 25 40Z" 
      fill={color} 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinejoin="round" 
    />
  </svg>
);

// 12. Hand-Drawn Verified Checkmark Badge
export const DoodleCheckBadge: React.FC<{
  className?: string;
  color?: string;
  stroke?: string;
}> = ({
  className = 'w-8 h-8',
  color = '#70EE9C',
  stroke = '#111827'
}) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Slightly organic circle */}
    <path 
      d="M25 6C36 5 44 14 44 25C44 36 35 44 25 44C14 44 6 36 6 25C6 13 14 6 25 6Z" 
      fill={color} 
      stroke={stroke} 
      strokeWidth="2.5" 
    />
    {/* Checkmark */}
    <path 
      d="M15 25L22 32L35 18" 
      stroke={stroke} 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

// 13. Steaming Hand-Drawn Coffee Mug (for deep work & craft)
export const DoodleCoffeeMug: React.FC<{
  className?: string;
  stroke?: string;
}> = ({
  className = 'w-8 h-8',
  stroke = '#111827'
}) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Steam wisps */}
    <path d="M18 6C16 10 20 12 18 16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <path d="M26 6C24 10 28 12 26 16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    {/* Cup body */}
    <path 
      d="M12 18H34V36C34 40 30 42 26 42H20C16 42 12 40 12 36V18Z" 
      fill="white" 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinejoin="round" 
    />
    {/* Handle */}
    <path 
      d="M34 22C38 22 42 24 42 28C42 32 38 34 34 34" 
      stroke={stroke} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
  </svg>
);

// 14. Hand-Drawn Target / Bullseye (representing landing roles)
export const DoodleTarget: React.FC<{
  className?: string;
  stroke?: string;
}> = ({
  className = 'w-8 h-8',
  stroke = '#111827'
}) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="25" cy="25" r="18" stroke={stroke} strokeWidth="2.5" />
    <circle cx="25" cy="25" r="11" stroke={stroke} strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="25" cy="25" r="4" fill="#FF5C5C" stroke={stroke} strokeWidth="2" />
  </svg>
);

// 15. Speech Bubble "Yes!"
export const DoodleYesBubble: React.FC<{ className?: string }> = ({ className = 'w-20 h-16' }) => (
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M15 40C15 22 32 10 55 10C78 10 92 22 92 40C92 56 75 66 52 66C44 66 36 64 28 60L12 68L18 52C16 48 15 44 15 40Z" 
      stroke="#111827" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="white"
    />
    <text 
      x="52" 
      y="46" 
      textAnchor="middle" 
      fontFamily="system-ui, sans-serif" 
      fontWeight="900" 
      fontSize="22" 
      fill="#111827"
      fontStyle="italic"
      letterSpacing="-0.5px"
    >
      Yes!
    </text>
  </svg>
);

// 16. Playful Smiling Doodle Face
export const DoodleFace: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M40 8C22 8 10 22 10 42C10 60 25 72 42 72C60 72 72 58 72 40C72 20 58 8 40 8Z" 
      stroke="#111827" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      fill="white"
    />
    {/* Hair strands */}
    <path d="M30 8C32 2 38 4 40 8M42 8C45 3 50 5 48 9" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="28" cy="36" r="3" fill="#111827" />
    <circle cx="52" cy="36" r="3" fill="#111827" />
    {/* Smile */}
    <path d="M30 48C36 56 46 56 52 48" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
    {/* Rosy cheeks */}
    <ellipse cx="22" cy="46" rx="4" ry="2" fill="#FF7A00" opacity="0.6" />
    <ellipse cx="60" cy="46" rx="4" ry="2" fill="#FF7A00" opacity="0.6" />
  </svg>
);

// 17. 5 Stars Doodle
export const DoodleFiveStars: React.FC<{ className?: string }> = ({ className = 'w-28 h-12' }) => (
  <svg viewBox="0 0 130 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M10 20C18 8 112 8 120 20C122 34 105 44 65 44C25 44 8 35 10 20Z" 
      stroke="#111827" 
      strokeWidth="2" 
      strokeDasharray="4 3"
      fill="white"
    />
    <g fill="#111827" fontSize="16">
      <text x="25" y="32">★</text>
      <text x="44" y="32">★</text>
      <text x="63" y="32">★</text>
      <text x="82" y="32">★</text>
      <text x="101" y="32">★</text>
    </g>
  </svg>
);

// 18. Counting Numbers Doodle "..5 6 7..."
export const DoodleCounting: React.FC<{ className?: string }> = ({ className = 'w-24 h-12' }) => (
  <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path 
      d="M10 25C15 12 75 8 90 20C98 32 80 42 50 42C20 42 8 36 10 25Z" 
      stroke="#111827" 
      strokeWidth="2" 
      fill="white"
    />
    <text 
      x="50" 
      y="31" 
      textAnchor="middle" 
      fontFamily="monospace" 
      fontWeight="900" 
      fontSize="15" 
      fill="#111827"
    >
      ..5 6 7..
    </text>
  </svg>
);

// Backwards compatibility alias
export const ScribbleLoop = DoodleCircleLoop;

// 19. Golden Kitty Badge
export const GoldenKittyBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-2 bg-[#1C1A27] text-white px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-xs font-black ${className}`}>
    <div className="w-6 h-6 bg-[#FFDE59] border border-black rounded flex items-center justify-center text-black text-sm font-black">
      🐱
    </div>
    <div className="text-left leading-none">
      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">
        2021 PRODUCT HUNT
      </span>
      <span className="text-xs font-black text-[#FFDE59]">
        Golden Kitty Winner
      </span>
    </div>
  </div>
);

// 19. Celebration Person Doodle for Footer Call to Action
export const DoodleCelebrationPerson: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Body & Clothes */}
    <path d="M70 180C75 140 120 140 125 180" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    <path d="M85 145V180M110 145V180" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Head & Neck */}
    <path d="M92 135V145M104 135V145" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    <path 
      d="M85 110C85 92 110 92 110 110C110 126 85 126 85 110Z" 
      stroke="#111827" 
      strokeWidth="3" 
      fill="white"
    />
    {/* Hair */}
    <path d="M80 102C82 85 105 80 115 90C122 97 120 110 115 115" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    <path d="M100 80C102 72 108 72 110 78" stroke="#111827" strokeWidth="3" strokeLinecap="round" />

    {/* Happy Face */}
    <circle cx="92" cy="108" r="2.5" fill="#111827" />
    <circle cx="104" cy="108" r="2.5" fill="#111827" />
    <path d="M94 116C97 121 101 121 104 116" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />

    {/* Raised Victory Arm */}
    <path 
      d="M115 145C130 130 140 95 135 60C133 45 126 35 124 30" 
      stroke="#111827" 
      strokeWidth="3" 
      strokeLinecap="round" 
    />
    {/* Victory Hand with fingers */}
    <path 
      d="M124 30C122 25 125 18 128 20C131 22 130 28 132 26C134 24 138 24 137 28C136 32 133 34 132 36" 
      stroke="#111827" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />

    {/* Tablet / Screen on desk in front */}
    <path 
      d="M60 170L140 170L150 185L50 185Z" 
      stroke="#111827" 
      strokeWidth="2.5" 
      fill="white"
    />
    {/* Sparkle badge on tablet */}
    <circle cx="100" cy="177" r="7" fill="#FF7A00" stroke="#111827" strokeWidth="2" />
    <path d="M100 173V181M96 177H104" stroke="white" strokeWidth="2" strokeLinecap="round" />

    {/* Floating celebratory sparkles */}
    <path d="M150 50L154 58L162 62L154 66L150 74L146 66L138 62L146 58Z" fill="#FFDE59" stroke="#111827" strokeWidth="1.5" />
    <path d="M45 90L48 95L53 97L48 100L45 105L43 100L38 97L43 95Z" fill="#70EE9C" stroke="#111827" strokeWidth="1.5" />
  </svg>
);

