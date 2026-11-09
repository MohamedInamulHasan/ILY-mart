import { useState, useEffect, useMemo } from 'react';

/**
 * Clean title to strictly respect language settings:
 * - English mode: NEVER mention Tamil characters or parenthesized Tamil text
 * - Tamil mode: extract Tamil portion when available
 */
export const cleanSearchTitle = (raw, language = 'en') => {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw.replace(/\[[^\]]+\]/g, '').trim();

    const parenMatch = text.match(/^(.*?)\s*\(\s*(.*?)\s*\)$/);
    if (parenMatch) {
        const part1 = parenMatch[1].trim();
        const part2 = parenMatch[2].trim();
        const p1Tamil = /[\u0B80-\u0BFF]/.test(part1);
        const p2Tamil = /[\u0B80-\u0BFF]/.test(part2);

        if (language === 'ta') {
            if (p1Tamil) return part1;
            if (p2Tamil) return part2;
            return part1;
        } else {
            // English mode: MUST NOT mention Tamil
            if (!p1Tamil) return part1;
            if (!p2Tamil) return part2;
            return part1.replace(/[\u0B80-\u0BFF]/g, '').trim();
        }
    }

    if (language === 'ta') {
        const tamilMatch = text.match(/[\u0B80-\u0BFF].*/);
        if (tamilMatch) return tamilMatch[0].trim();
        return text;
    } else {
        // English mode: remove any Tamil characters
        return text.replace(/[\u0B80-\u0BFF]/g, '').replace(/[-–—\/]\s*$/, '').trim();
    }
};

/**
 * Zepto-style typewriter animated placeholder hook:
 * Types out each item letter-by-letter, pauses, deletes letter-by-letter, then moves to next item.
 */
export const useTypewriterPlaceholder = (words = [], prefix = 'Search', enabled = true) => {
    const [subText, setSubText] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter valid non-empty words
    const validWords = useMemo(() => {
        if (!Array.isArray(words)) return [];
        return words.map(w => String(w || '').trim()).filter(w => w.length > 0);
    }, [words]);

    useEffect(() => {
        if (!enabled || validWords.length === 0) {
            setSubText('');
            return;
        }

        const currentWord = validWords[wordIndex % validWords.length];
        const typingSpeed = isDeleting ? 35 : 70;
        const pauseEnd = 1600;
        const pauseStart = 250;

        let timer;
        if (!isDeleting && subText === currentWord) {
            timer = setTimeout(() => setIsDeleting(true), pauseEnd);
        } else if (isDeleting && subText === '') {
            setIsDeleting(false);
            setWordIndex(prev => (prev + 1) % validWords.length);
            timer = setTimeout(() => {}, pauseStart);
        } else {
            timer = setTimeout(() => {
                const next = isDeleting
                    ? currentWord.substring(0, subText.length - 1)
                    : currentWord.substring(0, subText.length + 1);
                setSubText(next);
            }, typingSpeed);
        }

        return () => clearTimeout(timer);
    }, [subText, isDeleting, wordIndex, validWords, enabled]);

    if (!enabled || validWords.length === 0) {
        return `${prefix}...`;
    }

    return subText ? `${prefix} "${subText}"` : `${prefix}...`;
};

export default useTypewriterPlaceholder;
