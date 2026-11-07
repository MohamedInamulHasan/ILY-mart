/**
 * Helper to parse and serialize rich product descriptions and mentions.
 * Fully backwards compatible with legacy string descriptions.
 */

export const parseProductDescription = (raw) => {
    if (!raw) {
        return {
            blocks: [{ type: 'normal', content: '' }],
            mentions: []
        };
    }

    if (typeof raw === 'object' && raw.__structured__) {
        return {
            blocks: Array.isArray(raw.blocks) ? raw.blocks : [{ type: 'normal', content: '' }],
            mentions: Array.isArray(raw.mentions) ? raw.mentions : []
        };
    }

    const str = String(raw).trim();

    // Check if JSON structured
    if (str.startsWith('{') && str.includes('__structured__')) {
        try {
            const parsed = JSON.parse(str);
            if (parsed.__structured__) {
                return {
                    blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [{ type: 'normal', content: '' }],
                    mentions: Array.isArray(parsed.mentions) ? parsed.mentions : []
                };
            }
        } catch (e) {
            // Not valid JSON, proceed to legacy parse
        }
    }

    // Legacy parse (separated by '|')
    const parts = str.split('|').map(s => s.trim()).filter(Boolean);
    const mainDesc = parts[0] || '';
    const descTags = parts.slice(1);

    const blocks = [];
    if (mainDesc) {
        blocks.push({ type: 'normal', content: mainDesc });
    }

    if (descTags.length > 0) {
        const rows = descTags.map(tag => {
            const dashMatch = tag.match(/[-–—:]/);
            if (dashMatch) {
                const idx = dashMatch.index;
                return {
                    key: tag.substring(0, idx).trim(),
                    val: tag.substring(idx + 1).trim()
                };
            }
            return { key: tag, val: '' };
        });
        blocks.push({ type: 'box', rows });
    }

    if (blocks.length === 0) {
        blocks.push({ type: 'normal', content: '' });
    }

    return { blocks, mentions: [] };
};

export const serializeProductDescription = ({ blocks = [], mentions = [] }) => {
    // If only one empty normal block and no mentions, return empty string
    if (blocks.length === 1 && blocks[0].type === 'normal' && !blocks[0].content?.trim() && mentions.length === 0) {
        return '';
    }

    return JSON.stringify({
        __structured__: true,
        blocks,
        mentions
    });
};
