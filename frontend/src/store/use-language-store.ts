import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'ar' | 'de' | 'zh' | 'ja' | 'pt' | 'ru';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'language-storage',
        }
    )
);
