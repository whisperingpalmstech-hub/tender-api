'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { t, language } = useI18n();
    const isRtl = language === 'ar';

    return (
        <div
            className={cn(
                "min-h-screen flex flex-col bg-white text-surface-900",
                isRtl && "font-arabic"
            )}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-200/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[5%] right-[-5%] w-[35%] h-[35%] bg-blue-200/20 blur-[100px] rounded-full" />
            </div>

            {/* Header */}
            <header className="relative z-50 w-full px-6 py-6 lg:px-12 flex justify-between items-center">
                <Link href="/" className={cn("flex items-center gap-3 group px-4 py-2 rounded-2xl hover:bg-surface-50 transition-all", isRtl && "flex-row-reverse")}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:rotate-6 transition-transform">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight">
                        Tender<span className="text-primary-600">Analysis</span>
                    </span>
                </Link>

                <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                    <LanguageSwitcher />
                    <Link href="/">
                        <button className={cn("flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-primary-600 transition-colors", isRtl && "flex-row-reverse")}>
                            <ArrowLeft className={cn("w-4 h-4", isRtl && "rotate-180")} />
                            <span className="hidden sm:inline">{t('backToDocuments')}</span>
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-[480px]">
                    <div className={cn("text-center mb-10", isRtl && "text-right")}>
                        <h1 className="text-4xl font-black tracking-tight text-surface-900 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-lg text-surface-500 font-medium animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="animate-in fade-in zoom-in-95 duration-500 delay-200">
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full py-8 text-center px-6">
                <p className="text-sm font-medium text-surface-400">
                    &copy; {new Date().getFullYear()} <span className="text-surface-600 font-bold">Tender Analysis</span>. {t('footerDesc')?.split('.')[0]}.
                </p>
            </footer>
        </div>
    );
}
