import React from 'react';

/**
 * Utility to parse and render bilingual product titles with superscript bracket tags.
 * Example input: "Parotta ( பரோட்டா ) [1]" or "பரோட்டா ( Parotta ) [1]"
 *
 * Rules:
 * 1. If [1] (or any [tag]) is mentioned, it displays near the primary word as an upper superscript tag.
 * 2. If Tamil word is first ("பரோட்டா ( Parotta ) [1]"), tag [1] attaches upper near Tamil word.
 * 3. If English word is first ("Parotta ( பரோட்டா ) [1]"), tag [1] attaches upper near English word.
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

    if (bracketIndex === -1) {
        // Single language title
        return (
            <span className={`inline-flex items-center gap-1 ${mainClassName}`}>
                <span>{cleanTitle}</span>
                {(!hideTag && tagContent) && <span className={resolvedTagClass}>{tagContent}</span>}
            </span>
        );
    }

    const part1 = cleanTitle.substring(0, bracketIndex).trim();
    let part2 = cleanTitle.substring(bracketIndex + 1).trim();
    if (part2.endsWith(')')) {
        part2 = part2.substring(0, part2.length - 1).trim();
    }

    const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
    const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);

    let mainText = '';
    let subText = '';

    if (isPart1Tamil && !isPart2Tamil) {
        if (language === 'ta') {
            mainText = part1;
            subText = part2;
        } else {
            mainText = part2;
            subText = part1;
        }
    } else if (isPart2Tamil && !isPart1Tamil) {
        if (language === 'ta') {
            mainText = part2;
            subText = part1;
        } else {
            mainText = part1;
            subText = part2;
        }
    } else {
        // Neither or both have Tamil: keep part1 as main, part2 as bracketed subtext below
        mainText = part1;
        subText = part2;
    }

    return (
        <span className="inline-flex flex-col max-w-full">
            <span className={`inline-flex items-center gap-1 max-w-full ${mainClassName}`}>
                <span className="truncate">{mainText}</span>
                {(!hideTag && tagContent) && <span className={resolvedTagClass}>{tagContent}</span>}
            </span>
            {subText && (
                <span className={`truncate ${subClassName}`}>
                    ({subText})
                </span>
            )}
        </span>
    );
};
