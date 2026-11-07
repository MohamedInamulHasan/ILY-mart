import React, { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { parseProductDescription, serializeProductDescription } from '../utils/descriptionHelper';

const RichDescriptionEditor = ({ value, onChange, placeholder = 'Product description...' }) => {
    const [blocks, setBlocks] = useState([{ type: 'normal', content: '' }]);
    const [mentions, setMentions] = useState([]);
    const cellRefs = useRef({});

    // Load initial value
    useEffect(() => {
        if (value !== undefined) {
            const parsed = parseProductDescription(value);
            setBlocks(parsed.blocks && parsed.blocks.length > 0 ? parsed.blocks : [{ type: 'normal', content: '' }]);
            setMentions(parsed.mentions || []);
        }
    }, [value]);

    const notifyChange = (updatedBlocks, updatedMentions = mentions) => {
        const serialized = serializeProductDescription({
            blocks: updatedBlocks,
            mentions: updatedMentions
        });
        onChange && onChange(serialized);
    };

    // Add new block with specific type from header dropdown
    const handleAddBlock = (type) => {
        let newBlock = { type: 'normal', content: '' };
        if (type === 'table') {
            newBlock = { type: 'box', rows: [{ key: '', val: '' }] };
        } else if (type === 'point') {
            newBlock = { type: 'point', points: [''] };
        } else if (type === 'box') {
            newBlock = { type: 'card', content: '' };
        } else {
            newBlock = { type: 'normal', content: '' };
        }

        const next = [...blocks, newBlock];
        setBlocks(next);
        notifyChange(next);
    };

    // Remove block
    const handleRemoveBlock = (index) => {
        if (blocks.length <= 1) {
            const next = [{ type: 'normal', content: '' }];
            setBlocks(next);
            notifyChange(next);
            return;
        }
        const next = blocks.filter((_, i) => i !== index);
        setBlocks(next);
        notifyChange(next);
    };

    // Normal / Box text content change
    const handleBlockContentChange = (index, content) => {
        const next = [...blocks];
        next[index] = { ...next[index], content };
        setBlocks(next);
        notifyChange(next);
    };

    // Table / Box rows handling
    const handleTableRowChange = (blockIdx, rowIdx, field, val) => {
        const next = [...blocks];
        const rows = [...(next[blockIdx].rows || [])];
        rows[rowIdx] = { ...rows[rowIdx], [field]: val };
        next[blockIdx] = { ...next[blockIdx], rows };
        setBlocks(next);
        notifyChange(next);
    };

    const handleAddTableRow = (blockIdx, afterRowIdx) => {
        const next = [...blocks];
        const rows = [...(next[blockIdx].rows || [])];
        const newRowIdx = afterRowIdx !== undefined ? afterRowIdx + 1 : rows.length;
        rows.splice(newRowIdx, 0, { key: '', val: '' });
        next[blockIdx] = { ...next[blockIdx], rows };
        setBlocks(next);
        notifyChange(next);

        setTimeout(() => {
            const keyRef = cellRefs.current[`${blockIdx}-${newRowIdx}-key`];
            if (keyRef) keyRef.focus();
        }, 30);
    };

    const handleRemoveTableRow = (blockIdx, rowIdx) => {
        const next = [...blocks];
        const rows = (next[blockIdx].rows || []).filter((_, i) => i !== rowIdx);
        next[blockIdx] = { ...next[blockIdx], rows: rows.length ? rows : [{ key: '', val: '' }] };
        setBlocks(next);
        notifyChange(next);
    };

    // Points handling
    const handlePointChange = (blockIdx, pointIdx, val) => {
        const next = [...blocks];
        const points = [...(next[blockIdx].points || [])];
        points[pointIdx] = val;
        next[blockIdx] = { ...next[blockIdx], points };
        setBlocks(next);
        notifyChange(next);
    };

    const handleAddPoint = (blockIdx, afterPointIdx) => {
        const next = [...blocks];
        const points = [...(next[blockIdx].points || [])];
        const newIdx = afterPointIdx !== undefined ? afterPointIdx + 1 : points.length;
        points.splice(newIdx, 0, '');
        next[blockIdx] = { ...next[blockIdx], points };
        setBlocks(next);
        notifyChange(next);

        setTimeout(() => {
            const ptRef = cellRefs.current[`${blockIdx}-${newIdx}-point`];
            if (ptRef) ptRef.focus();
        }, 30);
    };

    const handleRemovePoint = (blockIdx, pointIdx) => {
        const next = [...blocks];
        const points = (next[blockIdx].points || []).filter((_, i) => i !== pointIdx);
        next[blockIdx] = { ...next[blockIdx], points: points.length ? points : [''] };
        setBlocks(next);
        notifyChange(next);

        setTimeout(() => {
            const prevIdx = Math.max(0, pointIdx - 1);
            const prevRef = cellRefs.current[`${blockIdx}-${prevIdx}-point`];
            if (prevRef) prevRef.focus();
        }, 30);
    };

    return (
        <div className="space-y-3">
            {/* Header: Description Label + Dropdown for Add Normal / Point / Table / Box */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                </span>

                <div className="relative inline-block">
                    <select
                        defaultValue=""
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAddBlock(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 pr-7 text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-xs hover:border-black dark:hover:border-white cursor-pointer focus:outline-none"
                    >
                        <option value="" disabled>+ Add block...</option>
                        <option value="normal">+ Add normal</option>
                        <option value="point">+ Add point</option>
                        <option value="table">+ Add table</option>
                        <option value="box">+ Add box</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
            </div>

            {/* Blocks List */}
            <div className="space-y-3">
                {blocks.map((block, bIdx) => (
                    <div
                        key={bIdx}
                        className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs relative"
                    >
                        {/* Overall Delete Icon in Top Right */}
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={() => handleRemoveBlock(bIdx)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                title="Delete card"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Normal Mode */}
                        {(block.type === 'normal' || (!block.type && !block.rows && !block.points)) && (
                            <textarea
                                value={block.content || ''}
                                onChange={(e) => handleBlockContentChange(bIdx, e.target.value)}
                                rows="3"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-black dark:focus:ring-white outline-none"
                                placeholder={placeholder}
                            />
                        )}

                        {/* Box / Card Mode */}
                        {block.type === 'card' && (
                            <div className="p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-900/30">
                                <textarea
                                    value={block.content || ''}
                                    onChange={(e) => handleBlockContentChange(bIdx, e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-black outline-none"
                                    placeholder={placeholder}
                                />
                            </div>
                        )}

                        {/* Table Mode (Box one row one column box, Enter to add, Backspace empty to remove) */}
                        {block.type === 'box' && (
                            <div className="space-y-2">
                                {(block.rows || [{ key: '', val: '' }]).map((row, rIdx) => (
                                    <div key={rIdx} className="flex items-center gap-2">
                                        <input
                                            ref={(el) => (cellRefs.current[`${bIdx}-${rIdx}-key`] = el)}
                                            type="text"
                                            value={row.key}
                                            onChange={(e) => handleTableRowChange(bIdx, rIdx, 'key', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTableRow(bIdx, rIdx);
                                                } else if (e.key === 'Backspace' && !row.key && !row.val && (block.rows || []).length > 1) {
                                                    e.preventDefault();
                                                    handleRemoveTableRow(bIdx, rIdx);
                                                }
                                            }}
                                            className="w-1/2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-black outline-none"
                                        />
                                        <input
                                            ref={(el) => (cellRefs.current[`${bIdx}-${rIdx}-val`] = el)}
                                            type="text"
                                            value={row.val}
                                            onChange={(e) => handleTableRowChange(bIdx, rIdx, 'val', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTableRow(bIdx, rIdx);
                                                } else if (e.key === 'Backspace' && !row.key && !row.val && (block.rows || []).length > 1) {
                                                    e.preventDefault();
                                                    handleRemoveTableRow(bIdx, rIdx);
                                                }
                                            }}
                                            className="w-1/2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-black outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Point Mode (Point in front, Enter to add another point, Backspace empty to remove) */}
                        {block.type === 'point' && (
                            <div className="space-y-2">
                                {(block.points || ['']).map((pt, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-2.5">
                                        <span className="text-gray-600 dark:text-gray-300 font-bold text-base select-none">•</span>
                                        <input
                                            ref={(el) => (cellRefs.current[`${bIdx}-${pIdx}-point`] = el)}
                                            type="text"
                                            value={pt}
                                            onChange={(e) => handlePointChange(bIdx, pIdx, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddPoint(bIdx, pIdx);
                                                } else if (e.key === 'Backspace' && !pt && (block.points || []).length > 1) {
                                                    e.preventDefault();
                                                    handleRemovePoint(bIdx, pIdx);
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-black outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RichDescriptionEditor;
