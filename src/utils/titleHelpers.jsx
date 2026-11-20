import React from 'react';

/**
 * Utility to extract and display only the chosen unit/size near product price.
 * Filters out raw unselected comma/pipe-separated multi-variant strings (e.g. "s, l, m" -> "").
 */
export const getSelectedUnitDisplay = (item) => {
    if (!item) return '';
    const sel = item.selectedMention || item.selectedUnit;
    if (sel && typeof sel === 'string') {
        const trimmed = sel.trim();
        if (trimmed && !/[,|]/.test(trimmed)) return trimmed;
    }
    const raw = item.unit || item.mention || item.weight || item.product?.unit || '';
    if (!raw || typeof raw !== 'string') return '';
    const trimmedRaw = raw.trim();
    // Multi-option strings should not be rendered as a single unit
    if (/[,|]/.test(trimmedRaw)) return '';
    return trimmedRaw;
};

/**
 * Utility to parse and render bilingual product and ads titles.
 * Example input: "Chicken Kothu Parotta (சிக்கன் கொத்து பரோட்டா)" or "Chapati [2*] (சப்பாத்தி)"
 *
 * Rules:
 * 1. Put the product/ad name in the first line, keeping any [ words ] directly as plain text.
 * 2. Put the bracket in the second line.
 * 3. If there is no bracket, the name can occupy and wrap into the second line.
 * 4. No 3D box, no black box, no badge — just plain text [ words ] exactly as typed.
 */
export const renderBilingualTitle = (fullTitle, language, options = {}) => {
    if (!fullTitle) return '';
    if (typeof fullTitle === 'object' && fullTitle !== null) {
        fullTitle = fullTitle.title || fullTitle.name || fullTitle.adTitle || '';
    }
    if (typeof fullTitle !== 'string') return '';

    const {
        mainClassName = '',
        subClassName,
        hideTag = false
    } = options;

    const resolvedSubClass = subClassName !== undefined ? subClassName : (mainClassName || 'opacity-90 font-medium');

    // If hideTag is explicitly requested (e.g. for ultra-compact cart view)
    const processedTitle = hideTag
        ? fullTitle.replace(/\[[^\]]+\]/g, '').replace(/\s{2,}/g, ' ').trim()
        : fullTitle.trim();

    const bracketIndex = processedTitle.indexOf('(');

    // If NO bracket: name in first line, and can wrap into second line (line-clamp-2)
    if (bracketIndex === -1) {
        const multilineMainClass = mainClassName
            .replace(/\btruncate\b/g, '')
            .replace(/\bwhitespace-nowrap\b/g, '')
            .trim();

        return (
            <span className="flex flex-col w-full max-w-full min-w-0">
                <span className={`w-full max-w-full leading-tight ${multilineMainClass}`}>
                    <span className="line-clamp-2 break-words whitespace-normal">{processedTitle}</span>
                </span>
            </span>
        );
    }

    // Has bracket: put name in first line, bracket in second line
    const namePart = processedTitle.substring(0, bracketIndex).trim();
    let bracketPart = processedTitle.substring(bracketIndex).trim();
    if (!bracketPart.startsWith('(')) {
        bracketPart = `(${bracketPart}`;
    }
    if (!bracketPart.endsWith(')')) {
        bracketPart = `${bracketPart})`;
    }

    const firstLineClass = mainClassName.trim();
    const secondLineClass = resolvedSubClass.trim();

    return (
        <span className="flex flex-col w-full max-w-full min-w-0">
            {/* First line: Product Name (with [ words ] as normal plain text) */}
            <span className={`truncate w-full max-w-full min-w-0 leading-tight block ${firstLineClass}`}>
                {namePart}
            </span>
            {/* Second line: Bracket - strictly truncated to 1 line with ellipsis */}
            <span className={`leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis w-full block min-w-0 ${secondLineClass}`}>
                {bracketPart}
            </span>
        </span>
    );
};
