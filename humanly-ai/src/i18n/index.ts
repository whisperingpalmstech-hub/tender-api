import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import language files
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import mr from '@/locales/mr.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import pt from '@/locales/pt.json'
import ar from '@/locales/ar.json'
import zh from '@/locales/zh.json'
import ja from '@/locales/ja.json'

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    pt: { translation: pt },
    ar: { translation: ar },
    zh: { translation: zh },
    ja: { translation: ja },
}

// Get saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('lang') || 'en'

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    })

export default i18n

export const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
]

export const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)

    // Handle RTL languages
    const lang = languages.find(l => l.code === code)
    if (lang?.rtl) {
        document.documentElement.dir = 'rtl'
    } else {
        document.documentElement.dir = 'ltr'
    }
}
