import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'horizontal' | 'compact' | 'monogram';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string; // default is #3B2314 (Sepia Accent)
  showTagline?: boolean;
  showUrdu?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  color = '#3B2314',
  showTagline = true,
  showUrdu = true,
}) => {
  // Sizing maps
  const emblemSizes = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const fullSizes = {
    xs: 'w-32',
    sm: 'w-40',
    md: 'w-56',
    lg: 'w-72',
    xl: 'w-88',
  };

  // Botanical Monogram SVG (Intertwined Serif "L", Crescent "D", and Organic Botanical Sprig with floral buds)
  const MonogramSvg = ({ sizeClass = 'w-12 h-12' }: { sizeClass?: string }) => (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0`}
      aria-label="Libas e Dastaan Monogram"
    >
      {/* Serif "L" */}
      {/* Top serif */}
      <path
        d="M58 32 H92 V38 H78 V126 H108 C116 126 120 125 124 122 C126 120 128 116 129 110 H135 V132 H58 V126 H70 V38 H58 V32 Z"
        fill={color}
      />
      
      {/* Crescent / Curved "D" intertwined */}
      <path
        d="M96 58 C116 57 142 66 154 85 C164 100 165 119 156 135 C147 150 131 161 113 164 C104 165 96 163 91 158 C86 153 87 146 91 142 C96 137 103 138 108 141 C117 146 127 144 135 136 C143 128 147 114 144 101 C140 86 127 75 110 73 C101 72 94 76 89 82 L84 76 C91 66 100 59 112 58 Z"
        fill={color}
      />

      {/* Botanical Sprig & Vine emerging through center */}
      {/* Main vine stem */}
      <path
        d="M106 142 C99 133 93 121 95 107 C97 93 103 82 108 72 C110 68 111 63 111 58"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Secondary twig left */}
      <path
        d="M95 107 C88 104 83 97 81 92"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Leaf on left twig */}
      <path
        d="M81 92 C82 86 87 84 92 86 C88 89 85 91 81 92 Z"
        fill={color}
      />
      {/* Leaf lower right */}
      <path
        d="M97 122 C103 121 110 125 112 131 C106 131 100 128 97 122 Z"
        fill={color}
      />
      {/* Elegant Leaf middle right */}
      <path
        d="M101 105 C107 101 116 103 120 109 C113 112 106 110 101 105 Z"
        fill={color}
      />
      {/* Upper twig right */}
      <path
        d="M107 74 C112 70 116 66 117 62"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Flower buds / berries cluster */}
      <circle cx="111" cy="56" r="2.8" fill={color} />
      <circle cx="117" cy="60" r="2.5" fill={color} />
      <circle cx="106" cy="62" r="2.2" fill={color} />
      <circle cx="104" cy="70" r="2" fill={color} />
      {/* Tiny connecting bud stems */}
      <path d="M110 59 L111 57" stroke={color} strokeWidth="1.2" />
      <path d="M114 63 L117 61" stroke={color} strokeWidth="1.2" />
      <path d="M108 65 L106 63" stroke={color} strokeWidth="1.2" />
    </svg>
  );

  // Decorative Ornament Divider (Thin line with clover floret)
  const DividerOrnament = ({ widthClass = 'w-full max-w-[220px]' }: { widthClass?: string }) => (
    <div className={`flex items-center justify-center gap-2 ${widthClass} my-1`}>
      <div className="h-[1px] flex-1" style={{ backgroundColor: color, opacity: 0.35 }} />
      {/* 4-petal floral clover motif */}
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="4" r="2" fill={color} />
        <circle cx="8" cy="12" r="2" fill={color} />
        <circle cx="4" cy="8" r="2" fill={color} />
        <circle cx="12" cy="8" r="2" fill={color} />
        <circle cx="8" cy="8" r="1.3" fill={color} />
      </svg>
      <div className="h-[1px] flex-1" style={{ backgroundColor: color, opacity: 0.35 }} />
    </div>
  );

  // Urdu Calligraphy: "لباس داستان" in graceful Nastaliq vector
  const UrduCalligraphy = ({ textClass = 'text-lg' }: { textClass?: string }) => (
    <div
      className={`font-serif tracking-normal text-center select-none ${textClass}`}
      style={{
        color: color,
        fontFamily: "'Noto Nastaliq Urdu', 'Amiri', 'Traditional Arabic', serif",
        direction: 'rtl',
      }}
      aria-label="لباس داستان"
    >
      لباس داستان
    </div>
  );

  // 1. MONOGRAM ONLY VARIANT
  if (variant === 'monogram') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <MonogramSvg sizeClass={emblemSizes[size]} />
      </div>
    );
  }

  // 2. HORIZONTAL HEADER VARIANT (Emblem + Wordmark Side-by-Side)
  if (variant === 'horizontal') {
    const isSmall = size === 'xs' || size === 'sm';
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="p-1 rounded-sm border" style={{ borderColor: `${color}20`, backgroundColor: `${color}06` }}>
          <MonogramSvg sizeClass={emblemSizes[size]} />
        </div>
        <div className="flex flex-col text-left">
          <span
            className={`font-serif uppercase tracking-[0.2em] font-semibold leading-tight ${
              isSmall ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
            }`}
            style={{ color: color }}
          >
            Libas e Dastaan
          </span>
          {showTagline && (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[9px] uppercase tracking-[0.25em] font-sans font-medium"
                style={{ color: color, opacity: 0.75 }}
              >
                Haute Couture
              </span>
              {showUrdu && (
                <>
                  <span className="text-[10px]" style={{ color: color, opacity: 0.4 }}>•</span>
                  <span
                    className="text-xs font-serif leading-none"
                    style={{
                      color: color,
                      fontFamily: "'Noto Nastaliq Urdu', 'Amiri', serif",
                      direction: 'rtl',
                    }}
                  >
                    لباس داستان
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. COMPACT VARIANT (Single line text with miniature emblem)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <MonogramSvg sizeClass="w-6 h-6" />
        <span
          className="font-serif uppercase tracking-[0.2em] font-bold text-xs"
          style={{ color: color }}
        >
          Libas e Dastaan
        </span>
      </div>
    );
  }

  // 4. FULL HERO / ARTISANAL VERTICAL VARIANT (Identical to logo.jpeg)
  return (
    <div className={`flex flex-col items-center justify-center text-center ${fullSizes[size]} ${className}`}>
      {/* Monogram */}
      <MonogramSvg sizeClass={emblemSizes[size]} />

      {/* Brand Title */}
      <h2
        className={`font-serif tracking-[0.22em] uppercase font-medium mt-3 leading-tight ${
          size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'
        }`}
        style={{ color: color }}
      >
        Libas e Dastaan
      </h2>

      {/* Decorative Divider with floret */}
      <DividerOrnament widthClass={size === 'xl' ? 'w-48' : size === 'lg' ? 'w-40' : 'w-32'} />

      {/* Urdu Calligraphy */}
      {showUrdu && (
        <UrduCalligraphy
          textClass={size === 'xl' ? 'text-2xl mt-1' : size === 'lg' ? 'text-xl mt-0.5' : 'text-base'}
        />
      )}

      {showTagline && (
        <p
          className="text-[10px] tracking-[0.3em] uppercase font-sans mt-2 font-light"
          style={{ color: color, opacity: 0.7 }}
        >
          Timeless Elegance &amp; Artisanal Heritage
        </p>
      )}
    </div>
  );
};
