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
 * Utility to parse and render bilingual product titles with superscript bracket tags.
 * Example input: "Chicken Kothu Parotta (சிக்கன் கொத்து பரோட்டா)" or "Parotta [1] (பரோட்டா)"
 *
 * Rules:
 * 1. Put the product name in the first line.
 * 2. Put the bracket in the second line.
 * 3. If there is no bracket, the name can occupy and wrap into the second line.
 * 4. Tag (e.g. [1], [2], [1/2]) attaches near the primary name as a badge.
 * 5. Do not alter or swap the name logic.
 */
export const renderBilingualTitle = (fullTitle, language, options = {}) => {
    if (!fullTitle || typeof fullTitle !== 'string') return fullTitle || '';

    const {
        mainClassName = '',
        subClassName = 'opacity-80 text-xs font-normal',
        tagClassName,
        hideTag = false
    } = options;

    const default3DTagClass = 'inline-flex items-center justify-center text-[10.5px] sm:text-[11.5px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-b from-[#FF4B4B] to-[#DC2626] text-white shadow-[0_2px_0_#991B1B] border-t border-white/40 tracking-tight leading-none select-none shrink-0 self-center';
    const resolvedTagClass = tagClassName || default3DTagClass;

    // Extract tag if present, e.g. [1], [2], [1/2]
    const tagMatch = fullTitle.match(/\[([^\]]+)\]/);
    const tagContent = tagMatch ? tagMatch[1] : null;

    // Remove [tag] from title string for parsing
    const cleanTitle = fullTitle.replace(/\[[^\]]+\]/g, '').trim();

    const bracketIndex = cleanTitle.indexOf('(');

    // If NO bracket: name in first line, and can wrap into second line (line-clamp-2)
    if (bracketIndex === -1) {
        const multilineMainClass = mainClassName
            .replace(/\btruncate\b/g, '')
            .replace(/\bwhitespace-nowrap\b/g, '')
            .trim();

        return (
            <span className="flex flex-col w-full max-w-full min-w-0">
                <span className={`inline-flex items-start gap-1 max-w-full leading-tight ${multilineMainClass}`}>
                    <span className="line-clamp-2 break-words whitespace-normal">{cleanTitle}</span>
                    {(!hideTag && tagContent) && <span className={resolvedTagClass}>{tagContent}</span>}
                </span>
            </span>
        );
    }

    // Has bracket: put name in first line, bracket in second line
    const namePart = cleanTitle.substring(0, bracketIndex).trim();
    let bracketPart = cleanTitle.substring(bracketIndex).trim();
    if (!bracketPart.startsWith('(')) {
        bracketPart = `(${bracketPart}`;
    }
    if (!bracketPart.endsWith(')')) {
        bracketPart = `${bracketPart})`;
    }

    const firstLineClass = mainClassName.trim();
    const secondLineClass = subClassName.trim();

    return (
        <span className="flex flex-col w-full max-w-full min-w-0">
            {/* First line: Product Name */}
            <span className={`inline-flex items-start gap-1 w-full max-w-full min-w-0 leading-tight ${firstLineClass}`}>
                <span className="truncate min-w-0">{namePart}</span>
                {(!hideTag && tagContent) && <span className={resolvedTagClass}>{tagContent}</span>}
            </span>
            {/* Second line: Bracket - truncated to 1 line, no extra lines */}
            <span className={`leading-tight truncate w-full block min-w-0 ${secondLineClass}`}>
                {bracketPart}
            </span>
        </span>
    );
};
