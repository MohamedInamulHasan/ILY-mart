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
        tagClassName = 'text-[11px] font-bold text-red-500 dark:text-red-400 align-super ml-0.5 inline-block -top-1 relative'
    } = options;

    // Extract tag if present, e.g. [1], [2], [1/2]
    const tagMatch = fullTitle.match(/\[([^\]]+)\]/);
    const tagContent = tagMatch ? tagMatch[1] : null;

    // Remove [tag] from title string for parsing
    const cleanTitle = fullTitle.replace(/\[[^\]]+\]/g, '').trim();

    const bracketIndex = cleanTitle.indexOf('(');

    if (bracketIndex === -1) {
        // Single language title
        return (
            <span className={`inline-flex items-baseline gap-0.5 ${mainClassName}`}>
                <span>{cleanTitle}</span>
                {tagContent && <sup className={tagClassName}>[{tagContent}]</sup>}
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

    let tamStr = '';
    let engStr = '';
    let firstPartIsTamil = false;

    if (isPart1Tamil && !isPart2Tamil) {
        tamStr = part1;
        engStr = part2;
        firstPartIsTamil = true;
    } else if (isPart2Tamil && !isPart1Tamil) {
        tamStr = part2;
        engStr = part1;
        firstPartIsTamil = false;
    } else {
        engStr = part1;
        tamStr = part2;
        firstPartIsTamil = false;
    }

    // Determine main and subtitle based on active language preference
    let mainText = '';
    let subText = '';
    let mainHasTag = false;
    let subHasTag = false;

    if (language === 'ta') {
        mainText = tamStr || engStr;
        subText = tamStr && engStr ? engStr : '';
        if (tagContent) {
            if (firstPartIsTamil) {
                mainHasTag = true;
            } else {
                subHasTag = true;
            }
        }
    } else {
        mainText = engStr || tamStr;
        subText = engStr && tamStr ? tamStr : '';
        if (tagContent) {
            if (!firstPartIsTamil) {
                mainHasTag = true;
            } else {
                subHasTag = true;
            }
        }
    }

    return (
        <span className="inline-flex flex-col max-w-full">
            <span className={`truncate ${mainClassName}`}>
                {mainText}
                {mainHasTag && <sup className={tagClassName}>[{tagContent}]</sup>}
            </span>
            {subText && (
                <span className={`truncate ${subClassName}`}>
                    ({subText}{subHasTag ? <sup className={tagClassName}>[{tagContent}]</sup> : ''})
                </span>
            )}
        </span>
    );
};
