import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Copy, Loader2, Info, PlusCircle, Store as StoreIcon } from 'lucide-react';
import { apiService } from '../../utils/api';
import { safeNavigateBack } from '../../utils/useBackButton';
import { useStores } from '../../hooks/queries/useStores';

const SAMPLE_CSV = `title,price,category,subcategory,unit,description,store
Fresh Apple,180,Fruits,Fresh Fruits,1 kg,Crisp naturally sweet apples,Super Market
Country Tomato,35,Vegetables,Organic,1 kg,Fresh farm harvested red tomatoes,Grocery Store
Toor Dal,140,Grocery,Dals & Pulses,1 kg,High quality unpolished dal,Super Market
Farm Fresh Milk,35,Dairy,Milk & Cream,500 ml,Pure pasteurized milk,Super Market
Robusta Banana,45,Fruits,Fresh Fruits,1 kg,Naturally ripened yellow bananas,Grocery Store`;

// Client-side CSV parser to support direct importing, store resolution, and fallback
function parseClientCSV(text, storesList = [], defaultStoreId = '') {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const parseRow = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const firstRow = parseRow(lines[0]);
    const isHeader = firstRow.some(col =>
        ['title', 'name', 'price', 'category', 'subcategory', 'sub_category', 'unit', 'description', 'stock', 'store', 'store_name', 'storename'].includes(col.toLowerCase())
    );

    let headers;
    let dataLines;
    if (isHeader) {
        headers = firstRow.map(h => h.toLowerCase().trim());
        dataLines = lines.slice(1);
    } else {
        headers = ['title', 'price', 'category', 'subcategory', 'unit', 'description', 'store'];
        dataLines = lines;
    }

    const items = [];
    for (const line of dataLines) {
        const cols = parseRow(line);
        if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;
        const obj = {};
        headers.forEach((h, idx) => {
            if (cols[idx] !== undefined) {
                obj[h] = cols[idx];
            }
        });

        const title = (obj.title || obj.name || '').trim();
        const rawPrice = (obj.price || '').toString().replace(/[^0-9.]/g, '');
        const price = parseFloat(rawPrice);

        if (title && !isNaN(price)) {
            // Stock is completely optional: default to 999 so items are always in stock
            const rawStock = obj.stock !== undefined && obj.stock !== ''
                ? parseInt(obj.stock.toString().replace(/[^0-9]/g, ''), 10)
                : 999;
            const stock = !isNaN(rawStock) ? rawStock : 999;

            const rawSub = (obj.subcategory || obj.subCategory || obj.sub_category || '').toString().trim();
            const subcategory = rawSub
                ? rawSub.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0)
                : [];

            // Match store name from CSV or fall back to selected store dropdown
            const rowStoreName = (obj.store || obj.store_name || obj.storename || '').toString().trim().toLowerCase();
            let matchedStore = null;
            if (rowStoreName && Array.isArray(storesList)) {
                matchedStore = storesList.find(s => (s.name || '').toLowerCase().trim() === rowStoreName);
            }
            const storeId = matchedStore ? (matchedStore._id || matchedStore.id) : (defaultStoreId || undefined);

            items.push({
                title,
                price,
                category: (obj.category || 'Grocery').trim(),
                subcategory,
                unit: (obj.unit || obj.weight || '').trim(),
                description: (obj.description || title).trim(),
                stock,
                storeId: storeId || undefined,
                isAvailable: true
            });
        }
    }
    return items;
}

export default function BulkImportProducts() {
    const navigate = useNavigate();
    const { data: stores = [] } = useStores();
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [csvText, setCsvText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [progressText, setProgressText] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isDedupRunning, setIsDedupRunning] = useState(false);

    const handleDedup = async () => {
        if (!window.confirm('Remove duplicate products from all stores? This keeps the oldest copy of each product.')) return;
        setIsDedupRunning(true);
        setError(null);
        try {
            const res = await apiService.dedupProducts();
            if (res?.success) {
                alert(res.message || `Removed ${res.data?.removed || 0} duplicates.`);
            } else {
                throw new Error(res?.message || 'Dedup failed');
            }
        } catch (err) {
            setError(err?.message || 'Failed to remove duplicates.');
        } finally {
            setIsDedupRunning(false);
        }
    };

    const handlePasteClipboard = async () => {
        try {
            if (navigator?.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                if (text) setCsvText(text);
            }
        } catch {
            // Clipboard access might require user permission
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === 'string') {
                setCsvText(content);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        const trimmed = csvText.trim();
        if (!trimmed) {
            setError('Please paste product details or select a CSV file first.');
            return;
        }

        const parsedProducts = parseClientCSV(trimmed, stores, selectedStoreId);
        if (parsedProducts.length === 0) {
            setError('No valid products found. Ensure each line has a title and price.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setProgressText('Importing products to database...');

        try {
            // api interceptor already unwraps response.data, so res = { success, data, message }
            let importedCount = 0;

            const res = await apiService.bulkImportProducts({
                products: parsedProducts,
                storeId: selectedStoreId || undefined
            });

            // res is already { success: true, data: { inserted: N }, message: "..." }
            if (res?.success) {
                importedCount = res?.data?.inserted ?? parsedProducts.length;
            } else {
                throw new Error(res?.message || 'Bulk import returned failure.');
            }

            if (importedCount > 0) {
                const skipped = res?.data?.skipped || 0;
                setResult({ inserted: importedCount, total: parsedProducts.length, skipped });
                setCsvText('');
            } else if (res?.data?.skipped > 0) {
                setResult({ inserted: 0, total: parsedProducts.length, skipped: res.data.skipped });
                setCsvText('');
            } else {
                setError('Failed to import products. Please check the format and try again.');
            }
        } catch (err) {
            console.error('Bulk import error:', err);
            setError(err?.response?.data?.message || err?.message || 'Error importing products');
        } finally {
            setIsLoading(false);
            setProgressText('');
        }
    };

    const rowCount = csvText.trim()
        ? parseClientCSV(csvText.trim(), stores, selectedStoreId).length
        : 0;

    return (
        <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-900 pb-16">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#CBF9B2] dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => safeNavigateBack(navigate, '/admin')}
                    className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-gray-700 rounded-full text-gray-800 dark:text-white shadow-sm active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Bulk Product Import</h1>
                    <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300">Direct Database Import</p>
                </div>
                <div className="w-10" />
            </div>

            <div className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
                {/* Store Selector */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                        <StoreIcon size={16} className="text-[#2E5A2E] dark:text-[#7CA90E]" />
                        <span>Assign to Store:</span>
                    </div>
                    <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7CA90E] max-w-[200px]"
                    >
                        <option value="">General (No Store / From CSV)</option>
                        {Array.isArray(stores) && stores.map(store => (
                            <option key={store._id || store.id} value={store._id || store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} className="text-emerald-600" />
                            Paste Product List / CSV
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCsvText(SAMPLE_CSV)}
                                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg"
                            >
                                Insert Sample
                            </button>
                            <button
                                type="button"
                                onClick={handlePasteClipboard}
                                className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg active:scale-95 transition-transform"
                            >
                                <Copy size={12} />
                                Paste
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder={`Paste CSV from ChatGPT here...\n\nExample:\ntitle,price,category,subcategory,unit,description,store\nApple,180,Fruits,Fresh Fruits,1 kg,Crisp sweet apples,Super Market\nTomato,35,Vegetables,Organic,1 kg,Fresh country tomatoes,Grocery Store`}
                        rows={10}
                        className="w-full font-mono text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
                    />

                    {/* File upload alternative */}
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {rowCount > 0 ? `Detected ~${rowCount} valid products` : 'Or select a .csv file:'}
                        </span>
                        <label className="cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-transform">
                            <Upload size={14} />
                            Upload CSV File
                            <input
                                type="file"
                                accept=".csv,.txt,.json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success Card */}
                {result && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span>Bulk Import Complete!</span>
                        </div>
                        <p className="text-xs">
                            Successfully added <strong>{result.inserted}</strong> of <strong>{result.total}</strong> products directly to the store database.
                            {result.skipped > 0 && <> (<strong>{result.skipped}</strong> duplicates skipped)</>}
                        </p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg mt-2 inline-block shadow-sm"
                        >
                            View in Shop →
                        </button>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleImport}
                    disabled={isLoading || !csvText.trim()}
                    className="w-full py-3.5 px-4 bg-[#2E5A2E] hover:bg-[#1a3d1a] text-white font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{progressText || 'Importing products to database...'}</span>
                        </>
                    ) : (
                        <>
                            <PlusCircle size={18} />
                            <span>Import Products Now</span>
                        </>
                    )}
                </button>

                {/* Clean Duplicates Button */}
                <button
                    onClick={handleDedup}
                    disabled={isDedupRunning}
                    className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isDedupRunning ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Cleaning duplicates...</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={18} />
                            <span>🧹 Clean Duplicate Products</span>
                        </>
                    )}
                </button>

                {/* Helper info */}
                <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Info size={13} />
                        Prompt to ask ChatGPT on Mobile:
                    </div>
                    <p className="font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded text-[10px] select-all leading-relaxed">
                        "Give me a list of 20 grocery products in CSV format with columns: title, price, category, subcategory, unit, description, store. No image links needed."
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-1">
                        💡 Note: Stock is automatically set to always in-stock (stock is not needed in the CSV).
                    </p>
                </div>
            </div>
        </div>
    );
}
