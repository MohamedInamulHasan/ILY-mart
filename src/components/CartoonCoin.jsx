import React from 'react';

/**
 * CartoonCoin - A vibrant, chunky, 3D game-style cartoon gold coin.
 * Features:
 * - 3D extruded cartoon bottom rim & dark cartoon contour outline
 * - Juicy multi-stop golden gradient fills
 * - Stamped inner ridge with dotted rim detail
 * - Chubby 5-point cartoon star (or stamped number when count is passed)
 * - Glossy curved candy-shine glare + 4-pointed sparkle glint
 */
export const CartoonCoin = ({ 
    size = 24, 
    className = '', 
    showSparkle = true,
    count = null,
    style = {} 
}) => {
    // Unique ID suffix to prevent gradient clashes if multiple coins render
    const id = React.useId().replace(/:/g, '');

    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`inline-block select-none flex-shrink-0 transition-transform active:scale-95 ${className}`}
            style={{ 
                filter: 'drop-shadow(0 2px 3px rgba(120, 53, 15, 0.28)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15))',
                ...style 
            }}
        >
            <defs>
                {/* 3D Depth Bottom Edge */}
                <linearGradient id={`coinDepth_${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="60%" stopColor="#B45309" />
                    <stop offset="100%" stopColor="#78350F" />
                </linearGradient>

                {/* Outer Rim Golden Bevel */}
                <linearGradient id={`coinRim_${id}`} x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor="#FFF9C4" />
                    <stop offset="25%" stopColor="#FDE047" />
                    <stop offset="60%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                {/* Coin Face (Center Stamped Circle) */}
                <radialGradient id={`coinFace_${id}`} cx="42%" cy="38%" r="62%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="45%" stopColor="#FBBF24" />
                    <stop offset="85%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </radialGradient>

                {/* Star / Emblem Gradient */}
                <linearGradient id={`starGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="40%" stopColor="#FEF08A" />
                    <stop offset="80%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                </linearGradient>

                {/* Glossy Candy Glare Gradient */}
                <linearGradient id={`glareGrad_${id}`} x1="0%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* 1. 3D Cartoon Depth (Chunky bottom edge) */}
            <circle cx="50" cy="54" r="43" fill={`url(#coinDepth_${id})`} />
            <circle cx="50" cy="54" r="43" stroke="#592503" strokeWidth="3" />

            {/* 2. Main Coin Outer Rim */}
            <circle cx="50" cy="48" r="43" fill={`url(#coinRim_${id})`} stroke="#6A2E05" strokeWidth="4" />

            {/* 3. Inner Recessed Ridge (Stamped Face) */}
            <circle cx="50" cy="48" r="33" fill={`url(#coinFace_${id})`} stroke="#8C4405" strokeWidth="3" />

            {/* 4. Dotted / Beaded Ring (Cartoon Game Token detailing) */}
            <circle 
                cx="50" 
                cy="48" 
                r="30" 
                fill="none" 
                stroke="#FEF08A" 
                strokeWidth="1.6" 
                strokeDasharray="2.8 2.8" 
                opacity="0.75" 
            />

            {/* 5. Center Motif: Either Stamped Number or Chubby Cartoon Star */}
            {count !== null && count !== undefined ? (
                <g>
                    {/* Bottom 3D bevel / golden edge */}
                    <text 
                        x="50" 
                        y="49.5" 
                        textAnchor="middle" 
                        dominantBaseline="central"
                        fontSize={Number(count) > 99 ? '24' : Number(count) > 9 ? '30' : '36'} 
                        fontWeight="900" 
                        fontFamily="'Arial Rounded MT Bold', 'Fredoka', 'Nunito', 'Segoe UI', system-ui, sans-serif"
                        fill="#FFFBEB"
                        opacity="0.85"
                    >
                        {count}
                    </text>
                    {/* Chunky Cartoon Number */}
                    <text 
                        x="50" 
                        y="48" 
                        textAnchor="middle" 
                        dominantBaseline="central"
                        fontSize={Number(count) > 99 ? '24' : Number(count) > 9 ? '30' : '36'} 
                        fontWeight="900" 
                        fontFamily="'Arial Rounded MT Bold', 'Fredoka', 'Nunito', 'Segoe UI', system-ui, sans-serif"
                        fill="#542A06" 
                        stroke="#3A1700"
                        strokeWidth="1.2"
                        paintOrder="stroke fill"
                    >
                        {count}
                    </text>
                </g>
            ) : (
                /* Chubby 5-pointed Cartoon Star */
                <polygon 
                    points="50,29 54,40.5 66,40.5 56.5,47.8 60,59 50,52 40,59 43.5,47.8 34,40.5 46,40.5" 
                    fill={`url(#starGrad_${id})`} 
                    stroke="#78350F" 
                    strokeWidth="2.2" 
                    strokeLinejoin="round" 
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(120, 53, 15, 0.35))' }}
                />
            )}

            {/* 6. Cartoon Gloss Shine (Curved Crescent Glare) */}
            <path 
                d="M 23 44 C 23 28 35 18 50 18 C 39 22 32 30 29 41 C 27 47 24 49 23 44 Z" 
                fill={`url(#glareGrad_${id})`} 
            />

            {/* 7. Secondary Soft Rim Highlight Pill */}
            <ellipse 
                cx="38" 
                cy="13" 
                rx="8" 
                ry="2.6" 
                transform="rotate(-24 38 13)" 
                fill="#FFFFFF" 
                opacity="0.8" 
            />

            {/* 8. 4-Pointed Sparkle Twinkle Glint on the top right */}
            {showSparkle && (
                <g transform="translate(68, 12)">
                    <path 
                        d="M 10 0 C 10 5.5 15.5 10 21 10 C 15.5 10 10 14.5 10 20 C 10 14.5 4.5 10 -1 10 C 4.5 10 10 5.5 10 0 Z" 
                        fill="#FFFFFF" 
                        opacity="0.95"
                    />
                    <circle cx="10" cy="10" r="1.5" fill="#FFFBEB" />
                </g>
            )}
        </svg>
    );
};

/**
 * CartoonCoinBadge - A playful cartoon game-style badge showing the CartoonCoin and coin count.
 */
export const CartoonCoinBadge = ({ 
    count = 0, 
    size = 20, 
    className = '',
    onClick = null,
    showLabel = false,
    label = 'Coin'
}) => {
    return (
        <div 
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 dark:from-amber-500 dark:via-amber-600 dark:to-yellow-600 border-2 border-amber-600/70 dark:border-amber-400/60 shadow-[0_2px_6px_rgba(217,119,6,0.35),inset_0_1px_1px_rgba(255,255,255,0.7)] active:scale-95 transition-all select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            <CartoonCoin size={size} showSparkle={true} />
            <span className="text-[12px] font-black text-[#5C2B05] dark:text-white leading-none tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {count} {showLabel && <span className="text-[10px] font-bold opacity-90">{label}</span>}
            </span>
        </div>
    );
};

export default CartoonCoin;

