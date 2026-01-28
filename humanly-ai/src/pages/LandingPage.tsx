import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { Avatar } from '@/components/Avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function LandingPage() {
    const { t } = useTranslation()

    const features = t('landing.features.items', { returnObjects: true }) as Array<{ title: string; description: string }>
    const steps = t('landing.howItWorks.steps', { returnObjects: true }) as Array<{ number: string; title: string; description: string }>

    const featureIcons = [
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>,
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    ]

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="text-xl font-display font-bold text-white">HumanlyAI</span>
                        </Link>

                        <div className="flex items-center gap-2 md:gap-4">
                            <LanguageSwitcher />
                            <Link to="/api-docs">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                    API & Devs
                                </Button>
                            </Link>
                            <a href="#pricing">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                    {t('landing.pricing.title', 'Pricing')}
                                </Button>
                            </a>
                            <Link to="/auth/login">
                                <Button variant="ghost" size="sm">
                                    {t('auth.login.submit')}
                                </Button>
                            </Link>
                            <Link to="/auth/signup">
                                <Button variant="primary" size="sm">
                                    {t('landing.hero.ctaPrimary')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                                {t('landing.hero.title')}{' '}
                                <span className="text-gradient">{t('landing.hero.titleHighlight')}</span>
                            </h1>
                            <p className="text-xl text-surface-300 mb-8 leading-relaxed">
                                {t('landing.hero.subtitle')}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/auth/signup">
                                    <Button variant="primary" size="lg">
                                        {t('landing.hero.ctaPrimary')}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Button>
                                </Link>
                                <a href="#how-it-works">
                                    <Button variant="outline" size="lg">
                                        {t('landing.hero.ctaSecondary')}
                                    </Button>
                                </a>
                            </div>
                        </motion.div>

                        {/* Right: Avatar */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="aspect-square max-w-lg mx-auto">
                                <Avatar showMessage={false} className="h-full" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-display font-bold mb-4">{t('landing.features.title')}</h2>
                        <p className="text-xl text-surface-400">{t('landing.features.subtitle')}</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card variant="hover" className="h-full">
                                    <div className="p-2 w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 text-primary-400 mb-4 flex items-center justify-center">
                                        {featureIcons[idx]}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-surface-400">{feature.description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-6 bg-surface-950/50">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-display font-bold mb-4">{t('landing.howItWorks.title')}</h2>
                        <p className="text-xl text-surface-400">{t('landing.howItWorks.subtitle')}</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold">
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-surface-400">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-display font-bold mb-4">{t('landing.pricing.title')}</h2>
                        <p className="text-xl text-surface-400">{t('landing.pricing.subtitle')}</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <Card className="h-full">
                                <h3 className="text-2xl font-bold mb-2">{t('landing.pricing.free.name')}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold">{t('landing.pricing.free.price')}</span>
                                    <span className="text-surface-400">{t('landing.pricing.free.period')}</span>
                                </div>
                                <p className="text-surface-400 mb-6">{t('landing.pricing.free.description')}</p>
                                <ul className="space-y-3 mb-8">
                                    {(t('landing.pricing.free.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-surface-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/auth/signup">
                                    <Button variant="secondary" className="w-full">
                                        {t('landing.pricing.free.cta')}
                                    </Button>
                                </Link>
                            </Card>
                        </motion.div>

                        {/* Pro Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <Card className="h-full relative overflow-visible border-primary-500/50">
                                {/* Badge */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-sm font-medium">
                                        {t('landing.pricing.pro.badge')}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 mt-2">{t('landing.pricing.pro.name')}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-gradient">{t('landing.pricing.pro.price')}</span>
                                    <span className="text-surface-400">{t('landing.pricing.pro.period')}</span>
                                </div>
                                <p className="text-surface-400 mb-6">{t('landing.pricing.pro.description')}</p>
                                <ul className="space-y-3 mb-8">
                                    {(t('landing.pricing.pro.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-surface-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="primary" className="w-full">
                                    {t('landing.pricing.pro.cta')}
                                </Button>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-surface-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-white font-bold">H</span>
                            </div>
                            <span className="text-lg font-display font-semibold">HumanlyAI</span>
                        </div>
                        <p className="text-surface-400 max-w-md">
                            {t('landing.footer.privacy')}
                        </p>
                        <div className="flex gap-6 mb-2">
                            <Link to="/api-docs" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">Developer API</Link>
                            <Link to="/auth/login" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">Login</Link>
                            <Link to="/auth/signup" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">Sign Up</Link>
                        </div>
                        <p className="text-surface-500 text-sm">
                            {t('landing.footer.copyright')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
