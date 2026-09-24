import React from 'react';

interface BolFixLogoProps {
  variant?: 'icon' | 'badge' | 'full';
  className?: string;
  glow?: boolean;
}

export const BolFixLogo: React.FC<BolFixLogoProps> = ({
  variant = 'badge',
  className = 'w-auto h-12',
  glow = true
}) => {
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
        <img
          src="/pwa-icon.svg"
          alt="BOL.FIX"
          className="w-full h-full object-contain rounded-xl"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1000 1000" 
      className={`select-none ${className}`}
      fill="none"
    >
      {/* Solid Black Canvas matching original image */}
      <rect width="1000" height="1000" fill="#000000" rx={variant === 'full' ? '0' : '40'} />

      <defs>
        {glow && (
          <filter id="neon-glow-logo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Bolivia Map Outline Contour (Neon Green) */}
      <path
        d="M 675,348 
           C 670,305 655,275 670,268
           C 685,260 710,290 735,270
           C 745,245 745,245 742,246
           C 755,260 770,295 785,300
           C 805,295 815,315 825,320
           C 845,330 850,355 850,375
           C 875,385 895,380 902,400
           C 908,425 885,445 888,460
           C 890,470 878,485 865,505
           C 850,518 845,520 810,515
           L 800,530"
        fill="none"
        stroke="#00FF40"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? 'url(#neon-glow-logo)' : undefined}
      />

      {/* Main Rounded Rectangle Badge with Neon Green Outline */}
      <rect
        x="105"
        y="340"
        width="765"
        height="380"
        rx="62"
        fill="#000000"
        stroke="#00FF40"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? 'url(#neon-glow-logo)' : undefined}
      />

      {/* White Smartphone with Wrench (Top-Right on badge) */}
      <g transform="translate(644, 318)">
        {/* Smartphone Outer Frame */}
        <rect 
          x="0" 
          y="0" 
          width="112" 
          height="190" 
          rx="24" 
          fill="#000000" 
          stroke="#FFFFFF" 
          strokeWidth="10" 
        />
        {/* Phone Ear Speaker */}
        <rect x="36" y="16" width="40" height="7" rx="3.5" fill="#FFFFFF" />
        
        {/* Phone Screen Inner Area */}
        <rect x="12" y="34" width="88" height="118" rx="6" fill="#000000" />
        
        {/* Screen Glass Diagonal Reflections */}
        <line x1="14" y1="98" x2="72" y2="40" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" opacity="0.95" />
        <line x1="14" y1="126" x2="96" y2="44" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" opacity="0.95" />
        
        {/* Mechanical Open-Ended Wrench inside Screen */}
        <g transform="translate(56, 95) rotate(-35)">
          <path 
            d="M -14,-34 
               C -14,-26 -8,-22 0,-22 
               C 8,-22 14,-26 14,-34 
               C 22,-28 24,-16 20,-6 
               L 8,0 
               L 8,26 
               C 8,32 2,36 -4,36 
               C -10,36 -16,32 -16,26 
               L -16,0 
               L -20,-6 
               C -24,-16 -22,-28 -14,-34 Z" 
            fill="#FFFFFF" 
          />
          <circle cx="0" cy="26" r="4.5" fill="#000000" />
        </g>

        {/* Circular Home Button on Bottom Bezel */}
        <circle cx="56" cy="172" r="7" stroke="#FFFFFF" strokeWidth="3.5" fill="none" />
      </g>

      {/* "BOL" - Giant Bold Italic Neon Green Text */}
      <text 
        x="158" 
        y="650" 
        fontFamily="'Montserrat', 'Arial Black', Impact, sans-serif" 
        fontWeight="900" 
        fontStyle="italic" 
        fontSize="250" 
        fill="#00FF40" 
        letterSpacing="-7"
      >BOL</text>

      {/* ".FIX" - Bold Italic White Text */}
      <text 
        x="605" 
        y="650" 
        fontFamily="'Montserrat', 'Arial Black', sans-serif" 
        fontWeight="900" 
        fontStyle="italic" 
        fontSize="148" 
        fill="#FFFFFF" 
        letterSpacing="-3"
      >.FIX</text>

      {/* "By: Mauro Medina" - Clean White Bold Subtitle */}
      <text 
        x="820" 
        y="695" 
        textAnchor="end" 
        fontFamily="'Montserrat', 'Inter', 'Arial', sans-serif" 
        fontWeight="800" 
        fontSize="33" 
        fill="#FFFFFF" 
        letterSpacing="1.2"
      >By: Mauro Medina</text>
    </svg>
  );
};

export default BolFixLogo;
