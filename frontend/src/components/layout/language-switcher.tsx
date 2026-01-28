'use client';

import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguageStore, Language } from '@/store/use-language-store';
import { cn } from '@/lib/utils';

const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguageStore();
    const [isOpen, setIsOpen] = useState(false);

    const currentLanguage = languages.find((l) => l.code === language) || languages[0];
    const isRtl = language === 'ar';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 hover:bg-surface-100 transition-all border border-surface-200/50 hover:border-surface-300"
            >
                <Globe className="w-4 h-4 text-surface-500" />
                <span className="text-sm font-medium text-surface-700 hidden sm:inline">
                    {currentLanguage.name}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-surface-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={cn(
                        "absolute mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-surface-300/20 border border-surface-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
                        isRtl ? "left-0" : "right-0"
                    )}>
                        <div className={cn("px-4 py-2 border-b border-surface-50 mb-1", isRtl && "text-right")}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                                {isRtl ? 'اختر اللغة' : 'Select Language'}
                            </span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors group",
                                        language === lang.code
                                            ? "bg-primary-50 text-primary-700 font-semibold"
                                            : "text-surface-600 hover:bg-surface-50",
                                        isRtl && "flex-row-reverse"
                                    )}
                                >
                                    <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                                        <span className="text-base group-hover:scale-110 transition-transform">{lang.flag}</span>
                                        <span>{lang.name}</span>
                                    </div>
                                    {language === lang.code && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
