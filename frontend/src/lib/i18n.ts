'use client';

import { useLanguageStore } from '@/store/use-language-store';
import { translations, TranslationKeys } from './translations';

export function useI18n() {
    const { language } = useLanguageStore();

    const t = (key: TranslationKeys): string => {
        const langData = translations[language as keyof typeof translations] as Record<string, string>;
        return langData[key] || (translations.en as any)[key] || key;
    };

    return { t, language };
}
