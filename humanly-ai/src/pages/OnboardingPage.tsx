import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { useAvatar } from '@/hooks'
import { Avatar } from '@/components/Avatar'
import { Button, Card, Input } from '@/components/ui'
import { languages, changeLanguage as i18nChangeLanguage } from '@/i18n'

export function OnboardingPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { setOnboarded, resetToFree, setLanguage, setUserDetails, userNickname, userProfession, currentLanguage } = useAppStore()
    const avatar = useAvatar()
    const [step, setStep] = useState(0)

    // Form state
    const [nickname, setNickname] = useState(userNickname || '')
    const [profession, setProfession] = useState(userProfession || 'Content Creator')

    const professions = [
        'Content Creator',
        'Student',
        'Professional Writer',
        'Business Owner',
        'Academic / Researcher',
        'Other'
    ]

    const onboardingSteps = [
        {
            id: 'welcome',
            title: t('onboarding.step1.title', 'Welcome to HumanlyAI'),
            description: t('onboarding.step1.description', "I'm your AI assistant. I'll help you transform your AI-generated text into authentic human writing."),
            avatarMessage: t('avatar.onboarding.step1', "Hi there! I'm so glad to meet you. I'm here to help you make your content sound more natural and human."),
        },
        {
            id: 'language',
            title: t('onboarding.language.title', 'Choose Your Language'),
            description: t('onboarding.language.description', "Select the language you'd like to use for the interface."),
            avatarMessage: t('avatar.onboarding.language', "What language would you prefer? You can always change this later in the settings."),
        },
        {
            id: 'profile',
            title: t('onboarding.profile.title', 'Tell me about yourself'),
            description: t('onboarding.profile.description', "This helps me personalize your experience."),
            avatarMessage: t('avatar.onboarding.profile', "I'd love to know what to call you and what you do. It helps me assist you better!"),
        },
        {
            id: 'dashboard',
            title: t('onboarding.step2.title', 'Your AI Workspace'),
            description: t('onboarding.step2.description', "In your dashboard, you can upload files or paste text. Customize the tone, intensity, and let me handle the rest."),
            avatarMessage: t('avatar.onboarding.step2', "Your dashboard is where the magic happens. You have full control over how human you want your text to be."),
        },
        {
            id: 'ready',
            title: t('onboarding.step4.title', 'Ready to Start?'),
            description: t('onboarding.step4.description', "You're all set! Let's head over to the dashboard and start humanizing your first piece of content."),
            avatarMessage: t('avatar.onboarding.ready', "Great! We're all set. Let's go to your dashboard and get to work!"),
        }
    ]

    // Unified effect to speak on step or language change
    useEffect(() => {
        // Stop any current speech
        avatar.stop()

        const message = onboardingSteps[step].avatarMessage

        const timer = setTimeout(() => {
            avatar.speakCustom(message)
        }, 500)

        return () => {
            clearTimeout(timer)
            avatar.stop()
        }
    }, [step, i18n.language]) // Re-speak when language changes

    const handleNext = () => {
        if (onboardingSteps[step].id === 'profile') {
            if (!nickname.trim()) return
            setUserDetails(nickname, profession)
        }

        if (step < onboardingSteps.length - 1) {
            setStep(step + 1)
        } else {
            completeOnboarding()
        }
    }

    const completeOnboarding = () => {
        resetToFree()
        setOnboarded(true)
        navigate('/dashboard')
    }

    const selectLanguage = (code: string) => {
        setLanguage(code)
        i18nChangeLanguage(code)
        // The useEffect will trigger on i18n.language change
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-surface-950">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-soft" />
            </div>

            <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left: Avatar Column */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative order-2 lg:order-1"
                >
                    <div className="aspect-square w-full max-w-sm mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
                        <Avatar className="h-full relative z-10" showMessage={true} />
                    </div>
                </motion.div>

                {/* Right: Content Column */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="order-1 lg:order-2"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card padding="lg" className="glass-card-hover border-primary-500/20 shadow-2xl">
                                <div className="mb-6 flex gap-2">
                                    {onboardingSteps.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx === step ? 'bg-primary-500' : idx < step ? 'bg-primary-500/50' : 'bg-surface-800'
                                                }`}
                                        />
                                    ))}
                                </div>

                                <h2 className="text-3xl font-display font-bold mb-4 text-white">
                                    {onboardingSteps[step].title}
                                </h2>
                                <p className="text-lg text-surface-300 mb-8 leading-relaxed">
                                    {onboardingSteps[step].description}
                                </p>

                                {/* Step Specific Content */}
                                <div className="mb-8">
                                    {onboardingSteps[step].id === 'language' && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => selectLanguage(lang.code)}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${currentLanguage === lang.code
                                                        ? 'bg-primary-500/20 border-primary-500 text-white shadow-lg'
                                                        : 'bg-surface-800/50 border-surface-700 text-surface-400 hover:border-surface-600'
                                                        }`}
                                                >
                                                    <span className="text-3xl mb-2">{lang.flag}</span>
                                                    <span className="font-medium text-center text-sm">{lang.nativeName}</span>
                                                    <span className="text-[10px] text-surface-500">{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {onboardingSteps[step].id === 'profile' && (
                                        <div className="space-y-6">
                                            <Input
                                                label={t('onboarding.profile.nickname', 'What should I call you?')}
                                                placeholder={t('onboarding.profile.nicknamePlaceholder', 'Enter your nickname...')}
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                autoFocus
                                            />
                                            <div>
                                                <label className="label">{t('onboarding.profile.profession', 'What is your profession?')}</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {professions.map((p) => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setProfession(p)}
                                                            className={`text-sm p-3 rounded-xl border transition-all duration-200 ${profession === p
                                                                ? 'bg-accent-500/20 border-accent-500 text-white'
                                                                : 'bg-surface-800/50 border-surface-700 text-surface-400 hover:border-surface-600'
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {onboardingSteps[step].id === 'dashboard' && (
                                        <div className="p-4 bg-surface-950 rounded-2xl border border-surface-800 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{t('onboarding.workspace.title', 'Interactive Controls')}</p>
                                                <p className="text-sm text-surface-400">{t('onboarding.workspace.description', 'Sliders for intensity and passes.')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <Button variant="ghost" onClick={completeOnboarding} className="text-surface-500">
                                        {t('common.skip', 'Skip')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleNext}
                                        className="min-w-[140px]"
                                        disabled={onboardingSteps[step].id === 'profile' && !nickname.trim()}
                                    >
                                        {step === onboardingSteps.length - 1 ? t('common.getStarted', 'Get Started') : t('common.continue', 'Continue')}
                                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}

export default OnboardingPage
