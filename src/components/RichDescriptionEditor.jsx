import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, X, Sparkles } from 'lucide-react';
import { parseProductDescription, serializeProductDescription } from '../utils/descriptionHelper';

const MODE_OPTIONS = [
    { value: 'normal', label: 'Normal mode' },
    { value: 'box', label: 'Box mode' },
    { value: 'card', label: 'Card mode' },
    { value: 'point', label: 'Point mode' }
];

const RichDescriptionEditor = ({ value, onChange, placeholder = 'Product description...' }) => {
    const [blocks, setBlocks] = useState([{ type: 'normal', content: '' }]);
    const [mentions, setMentions] = useState([]);
    const [newMentionInput, setNewMentionInput] = useState('');

    // Load initial value
    useEffect(() => {
        if (value !== undefined) {
            const parsed = parseProductDescription(value);
            setBlocks(parsed.blocks && parsed.blocks.length > 0 ? parsed.blocks : [{ type: 'normal', content: '' }]);
            setMentions(parsed.mentions || []);
        }
    }, [value]);

    const notifyChange = (updatedBlocks, updatedMentions) => {
        const serialized = serializeProductDescription({
            blocks: updatedBlocks,
            mentions: updatedMentions
        });
        onChange && onChange(serialized);
    };

    // Mode change for a block
    const handleModeChange = (index, newMode) => {
        const next = [...blocks];
        const current = next[index];
        if (newMode === 'box') {
            next[index] = {
                type: 'box',
                rows: current.rows && current.rows.length > 0 ? current.rows : [{ key: '', val: '' }]
            };
        } else if (newMode === 'point') {
            next[index] = {
                type: 'point',
                points: current.points && current.points.length > 0 ? current.points : ['']
            };
        } else {
            next[index] = {
                type: newMode,
                content: current.content || ''
            };
        }
        setBlocks(next);
        notifyChange(next, mentions);
    };

    // Update block content
    const handleBlockContentChange = (index, content) => {
        const next = [...blocks];
        next[index] = { ...next[index], content };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    // Add new description card
    const handleAddBlock = () => {
        const next = [...blocks, { type: 'normal', content: '' }];
        setBlocks(next);
        notifyChange(next, mentions);
    };

    // Remove description card
    const handleRemoveBlock = (index) => {
        if (blocks.length <= 1) {
            const next = [{ type: 'normal', content: '' }];
            setBlocks(next);
            notifyChange(next, mentions);
            return;
        }
        const next = blocks.filter((_, i) => i !== index);
        setBlocks(next);
        notifyChange(next, mentions);
    };

    // Box mode: row handling
    const handleBoxRowChange = (blockIdx, rowIdx, field, val) => {
        const next = [...blocks];
        const rows = [...(next[blockIdx].rows || [])];
        rows[rowIdx] = { ...rows[rowIdx], [field]: val };
        next[blockIdx] = { ...next[blockIdx], rows };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    const handleAddBoxRow = (blockIdx) => {
        const next = [...blocks];
        const rows = [...(next[blockIdx].rows || []), { key: '', val: '' }];
        next[blockIdx] = { ...next[blockIdx], rows };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    const handleRemoveBoxRow = (blockIdx, rowIdx) => {
        const next = [...blocks];
        const rows = (next[blockIdx].rows || []).filter((_, i) => i !== rowIdx);
        next[blockIdx] = { ...next[blockIdx], rows: rows.length ? rows : [{ key: '', val: '' }] };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    // Point mode: handling
    const handlePointChange = (blockIdx, pointIdx, val) => {
        const next = [...blocks];
        const points = [...(next[blockIdx].points || [])];
        points[pointIdx] = val;
        next[blockIdx] = { ...next[blockIdx], points };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    const handleAddPoint = (blockIdx, afterIdx) => {
        const next = [...blocks];
        const points = [...(next[blockIdx].points || [])];
        if (afterIdx !== undefined) {
            points.splice(afterIdx + 1, 0, '');
        } else {
            points.push('');
        }
        next[blockIdx] = { ...next[blockIdx], points };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    const handleRemovePoint = (blockIdx, pointIdx) => {
        const next = [...blocks];
        const points = (next[blockIdx].points || []).filter((_, i) => i !== pointIdx);
        next[blockIdx] = { ...next[blockIdx], points: points.length ? points : [''] };
        setBlocks(next);
        notifyChange(next, mentions);
    };

    // Mentions handling
    const handleAddMention = () => {
        const trimmed = newMentionInput.trim();
        if (!trimmed) return;
        if (!mentions.includes(trimmed)) {
            const next = [...mentions, trimmed];
            setMentions(next);
            notifyChange(blocks, next);
        }
        setNewMentionInput('');
    };

    const handleRemoveMention = (toRemove) => {
        const next = mentions.filter(m => m !== toRemove);
        setMentions(next);
        notifyChange(blocks, next);
    };

    return (
        <div className="space-y-4">
            {/* Description Blocks List */}
            {blocks.map((block, bIdx) => (
                <div
                    key={bIdx}
                    className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs relative space-y-3"
                >
                    {/* Header: Card number + White Rectangular Tag Dropdown + Delete */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-2.5">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Card {bIdx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                            {/* Small White Rectangular Tag Dropdown */}
                            <div className="relative inline-block">
                                <select
                                    value={block.type || 'normal'}
                                    onChange={(e) => handleModeChange(bIdx, e.target.value)}
                                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 pr-7 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-xs hover:border-black cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
                                >
                                    {MODE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                            </div>

                            {blocks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBlock(bIdx)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                    title="Remove this card"
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Block Editor Content */}
                    {block.type === 'normal' && (
                        <div>
                            <textarea
                                value={block.content || ''}
                                onChange={(e) => handleBlockContentChange(bIdx, e.target.value)}
                                rows="4"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                                placeholder={placeholder}
                            />
                        </div>
                    )}

                    {block.type === 'box' && (
                        <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex justify-between px-1">
                                <span>Column 1 (Title / Key)</span>
                                <span>Column 2 (Detail / Value)</span>
                            </div>
                            {(block.rows || [{ key: '', val: '' }]).map((row, rIdx) => (
                                <div key={rIdx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={row.key}
                                        onChange={(e) => handleBoxRowChange(bIdx, rIdx, 'key', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddBoxRow(bIdx);
                                            }
                                        }}
                                        placeholder="e.g. Weight"
                                        className="w-1/2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-1 focus:ring-black outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={row.val}
                                        onChange={(e) => handleBoxRowChange(bIdx, rIdx, 'val', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddBoxRow(bIdx);
                                            }
                                        }}
                                        placeholder="e.g. 500g"
                                        className="w-1/2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-1 focus:ring-black outline-none"
                                    />
                                    {(block.rows || []).length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBoxRow(bIdx, rIdx)}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleAddBoxRow(bIdx)}
                                className="text-xs font-bold text-[#2E5A2E] dark:text-[#CBF9B2] hover:underline flex items-center gap-1 pt-1"
                            >
                                <Plus size={14} /> Add Row (or press Enter)
                            </button>
                        </div>
                    )}

                    {block.type === 'card' && (
                        <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-900/30">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Card Display Box
                            </span>
                            <textarea
                                value={block.content || ''}
                                onChange={(e) => handleBlockContentChange(bIdx, e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-black outline-none"
                                placeholder="Text inside rectangular card..."
                            />
                        </div>
                    )}

                    {block.type === 'point' && (
                        <div className="space-y-2">
                            {(block.points || ['']).map((pt, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2">
                                    <span className="text-gray-500 font-black">•</span>
                                    <input
                                        type="text"
                                        value={pt}
                                        onChange={(e) => handlePointChange(bIdx, pIdx, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddPoint(bIdx, pIdx);
                                            }
                                        }}
                                        placeholder="Bullet point sentence..."
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-1 focus:ring-black outline-none"
                                    />
                                    {(block.points || []).length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePoint(bIdx, pIdx)}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleAddPoint(bIdx)}
                                className="text-xs font-bold text-[#2E5A2E] dark:text-[#CBF9B2] hover:underline flex items-center gap-1 pt-1"
                            >
                                <Plus size={14} /> Add Point (or press Enter)
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* Add Description Card Button */}
            <button
                type="button"
                onClick={handleAddBlock}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
                <Plus size={16} /> Add Description Card
            </button>

            {/* Mentions Section (e.g. S, M, L, XL) */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Add Mention (Sizes / Variants, e.g. S, M, L, XL)
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={newMentionInput}
                        onChange={(e) => setNewMentionInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddMention();
                            }
                        }}
                        placeholder="e.g. S, M, L, XL, 500g..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-1 focus:ring-black outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleAddMention}
                        className="px-3.5 py-1.5 bg-black text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
                    >
                        Add Mention
                    </button>
                </div>

                {mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {mentions.map((m, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                            >
                                {m}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMention(m)}
                                    className="hover:text-red-500"
                                >
                                    <X size={13} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichDescriptionEditor;
