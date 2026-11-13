import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Copy, Loader2, Info } from 'lucide-react';
import { apiService } from '../../utils/api';
import { safeNavigateBack } from '../../utils/useBackButton';

const SAMPLE_CSV = `title,price,category,unit,description
Fresh Apple,180,Fruits,1 kg,Crisp naturally sweet apples
Country Tomato,35,Vegetables,1 kg,Fresh farm harvested red tomatoes
Toor Dal,140,Grocery,1 kg,High quality unpolished dal
Farm Fresh Milk,35,Dairy,500 ml,Pure pasteurized milk
Robusta Banana,45,Fruits,1 kg,Naturally ripened yellow bananas`;

export default function BulkImportProducts() {
    const navigate = useNavigate();
    const [csvText, setCsvText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

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
        if (!csvText.trim()) {
            setError('Please paste product details or select a CSV file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await apiService.bulkImportProducts({ text: csvText.trim() });
            const data = res?.data || res;
            if (data.success) {
                setResult(data.data || { inserted: 0, total: 0 });
                setCsvText('');
            } else {
                setError(data.message || 'Failed to import products');
            }
        } catch (err) {
            console.error('Bulk import error:', err);
            setError(err?.response?.data?.message || err?.message || 'Error uploading products');
        } finally {
            setIsLoading(false);
        }
    };

    const rowCount = csvText.trim()
        ? csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0).length - 1
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
                    <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300">Auto-Cloudinary & DB</p>
                </div>
                <div className="w-10" />
            </div>

            <div className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
                {/* Feature highlight banner */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Sparkles size={16} />
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Auto-Photo & Cloudinary Upload</p>
                        <p className="leading-relaxed">
                            No image links needed! The server automatically finds high-quality product photos, uploads them to your Cloudinary, and saves them to MongoDB.
                        </p>
                    </div>
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
                        placeholder={`Paste CSV from ChatGPT here...\n\nExample:\ntitle,price,category,unit,description\nApple,180,Fruits,1 kg,Crisp and sweet\nTomato,35,Vegetables,1 kg,Fresh country tomatoes`}
                        rows={10}
                        className="w-full font-mono text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
                    />

                    {/* File upload alternative */}
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {rowCount > 0 ? `Detected ~${rowCount} products` : 'Or select a .csv file:'}
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
                            Successfully added <strong>{result.inserted}</strong> of <strong>{result.total}</strong> products to your store. All photos uploaded to Cloudinary.
                        </p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg mt-2 inline-block"
                        >
                            View in Shop →
                        </button>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleImport}
                    disabled={isLoading || !csvText.trim()}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Uploading to Cloudinary & Saving to DB...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            <span>Import Products Now</span>
                        </>
                    )}
                </button>

                {/* Helper info */}
                <div className="bg-white dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Info size={13} />
                        Prompt to ask ChatGPT on Mobile:
                    </div>
                    <p className="font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded text-[10px] select-all">
                        "Give me a list of 20 grocery products in CSV format with columns: title, price, category, unit, description. No image links needed."
                    </p>
                </div>
            </div>
        </div>
    );
}
