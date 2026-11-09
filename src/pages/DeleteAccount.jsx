import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Mail, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { apiService } from '../utils/api';

const DeleteAccount = () => {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiService.requestDeleteAccount({ email, reason });
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="max-w-7xl mx-auto px-2 relative min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button
                                onClick={() => safeNavigateBack(navigate, '/profile')}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col items-center text-center pt-1">
                            <h1 className="text-[16px] font-bold text-gray-900 tracking-tight leading-tight">Delete Account</h1>
                            <p className="text-[11px] font-medium text-gray-500 mt-0.5">ILY mart — Data Deletion Request</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-28 pb-12 max-w-2xl mx-auto px-6">
                {!submitted ? (
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">

                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Warning */}
                        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                            <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
                            <div>
                                <p className="font-bold text-red-700 dark:text-red-400 text-sm">This action is permanent</p>
                                <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                                    Deleting your account will permanently remove all your personal data, order history, and account information from ILY mart. This cannot be undone.
                                </p>
                            </div>
                        </div>

                        {/* What gets deleted */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">What will be deleted:</h2>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                                {[
                                    'Your name, email address, and phone number',
                                    'Your delivery addresses',
                                    'Your order history',
                                    'Your account login credentials',
                                    'Your location data',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Trash2 size={14} className="text-red-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Your Account Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5A2E]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Reason for deletion (optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    placeholder="Tell us why you're leaving..."
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5A2E] resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Submitting Request...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Submit Deletion Request
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Contact info */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Mail size={14} />
                                <span>Or email us directly at: <strong className="text-[#2E5A2E]">ilymart.28@gmail.com</strong></span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">We will process your request within 7 days.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center space-y-4">
                        <CheckCircle className="mx-auto text-green-500" size={56} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Request Submitted</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Your account deletion request has been sent to our team. We will process it within <strong>7 days</strong> and send a confirmation to <strong>{email}</strong>.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 bg-[#2E5A2E] text-white font-bold py-3 px-8 rounded-2xl transition-all active:scale-95"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeleteAccount;
