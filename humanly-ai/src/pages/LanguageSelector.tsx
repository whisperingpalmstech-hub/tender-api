import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { languages, changeLanguage } from '@/i18n'
import { useAppStore } from '@/store'
import { Button, Card } from '@/components/ui'

export function LanguageSelector() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { setLanguage, setHasSelectedLanguage } = useAppStore()
    const [selectedLang, setSelectedLang] = useState(i18n.language)

    const handleSelect = (code: string) => {
        setSelectedLang(code)
        changeLanguage(code)
    }

    const handleContinue = () => {
        setLanguage(selectedLang)
        setHasSelectedLanguage(true)
        navigate('/auth/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative max-w-4xl w-full"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">H</span>
                    </div>
                    <span className="text-2xl font-display font-bold text-white">HumanlyAI</span>
                </div>

                {/* Title */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
                        {t('language.title')}
                    </h1>
                    <p className="text-surface-400 text-lg">
                        {t('language.subtitle')}
                    </p>
                </div>

                {/* Language Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
                    {languages.map((lang) => (
                        <motion.button
                            key={lang.code}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(lang.code)}
                            className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${selectedLang === lang.code
                                    ? 'border-primary-500 bg-primary-500/10'
                                    : 'border-surface-700 bg-surface-900/50 hover:border-surface-600 hover:bg-surface-800/50'
                                }
              `}
                        >
                            {/* Checkmark */}
                            {selectedLang === lang.code && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Flag */}
                            <div className="text-4xl mb-2">{lang.flag}</div>

                            {/* Names */}
                            <div className="font-medium text-white">{lang.nativeName}</div>
                            <div className="text-sm text-surface-400">{lang.name}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Continue Button */}
                <div className="flex justify-center">
                    <Button variant="primary" size="lg" onClick={handleContinue}>
                        {t('language.continue')}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}

export default LanguageSelector
