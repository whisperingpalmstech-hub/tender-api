import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { languages, changeLanguage } from '@/i18n'
import { useAppStore } from '@/store'

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false)
    const { currentLanguage, setLanguage } = useAppStore()
    const containerRef = useRef<HTMLDivElement>(null)

    const currentLangObj = languages.find(l => l.code === currentLanguage) || languages[0]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (code: string) => {
        changeLanguage(code)
        setLanguage(code)
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-800 transition-colors border border-transparent hover:border-surface-700"
            >
                <span className="text-xl">{currentLangObj.flag}</span>
                <span className="text-sm font-medium text-surface-200 uppercase">{currentLangObj.code}</span>
                <svg
                    className={`w-3 h-3 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-surface-900 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                    >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleSelect(lang.code)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-800 transition-colors
                    ${currentLanguage === lang.code ? 'bg-primary-500/10 text-primary-400' : 'text-surface-200'}
                  `}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-medium">{lang.nativeName}</span>
                                        <span className="text-xs text-surface-500">{lang.name}</span>
                                    </div>
                                    {currentLanguage === lang.code && (
                                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
