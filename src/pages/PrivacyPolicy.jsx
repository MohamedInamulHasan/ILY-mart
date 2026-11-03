import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, Trash2, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="max-w-7xl mx-auto px-2 relative min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col items-center text-center pt-1">
                            <h1 className="text-[16px] font-bold text-gray-900 dark:text-gray-900 tracking-tight leading-tight">{t('Privacy Policy')}</h1>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-600 mt-0.5">{t('Last Updated: May 2026')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-28 pb-12 max-w-3xl mx-auto px-6">
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-8 text-gray-700 dark:text-gray-300">
                    
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="text-[#2E5A2E]" size={24} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Introduction')}</h2>
                        </div>
                        <p className="leading-relaxed">
                            Welcome to <strong>ILY mart</strong>, a mobile application developed and operated by <strong>Ilayangudi Mart</strong> (Package ID: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm">com.ilayangudimart.app</code>). This Privacy Policy explains how we collect, use, and protect your personal data when you use the ILY mart app.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="text-[#2E5A2E]" size={24} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Data Collection')}</h2>
                        </div>
                        <p className="mb-2">We collect the following information to provide and improve our services:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li><strong>Personal Identification:</strong> Name, phone number, and delivery address.</li>
                            <li><strong>Device Information:</strong> Device model, operating system version, and unique device identifiers.</li>
                            <li><strong>Location Data:</strong> Precise location for accurate delivery services.</li>
                        </ul>
                        <p className="italic text-sm text-[#2E5A2E] bg-[#E8F5E9] p-3 rounded-xl">
                            <strong>Note:</strong> We exclusively use Cash on Delivery (COD). We do not collect or store financial or payment card information.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="text-[#2E5A2E]" size={24} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Data Usage & Sharing')}</h2>
                        </div>
                        <p>Your data is used solely to fulfill orders, communicate updates, and enhance app functionality. We do not sell your personal data to third parties. We may share data with service providers only as necessary to perform delivery services.</p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Trash2 className="text-[#2E5A2E]" size={24} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Data Retention & Deletion')}</h2>
                        </div>
                        <p>We retain your information as long as your account is active. You have the right to request the deletion of your account and associated personal data at any time by contacting us via email.</p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="text-[#2E5A2E]" size={24} />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Your Legal Rights')}</h2>
                        </div>
                        <p>Under applicable data protection laws, you have the right to access, rectify, or erase your personal data. We are committed to ensuring your privacy and protecting your rights as a user of ILY mart.</p>
                    </section>

                    <section className="pt-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="text-[#2E5A2E]" size={24} />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Contact Us')}</h2>
                        </div>
                        <p>Developed by <strong>Ilayangudi Mart</strong>. If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
                        <p className="mt-2 font-bold text-[#2E5A2E]">ilymart.28@gmail.com</p>
                    </section>

                    <section className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col items-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                            {t('If you wish to permanently delete your account and all associated data, you can request it here:')}
                        </p>
                        <button
                            onClick={() => navigate('/delete-account')}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold rounded-full text-xs uppercase tracking-wider transition-all"
                        >
                            <Trash2 size={14} />
                            {t('Request Account Deletion')}
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
