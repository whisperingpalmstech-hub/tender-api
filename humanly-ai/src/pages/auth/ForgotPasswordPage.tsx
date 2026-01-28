import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store'
import { Button, Input, Card } from '@/components/ui'

export function ForgotPasswordPage() {
    const { t } = useTranslation()
    const { resetPassword, isLoading } = useAuthStore()

    const [email, setEmail] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const { error } = await resetPassword(email)

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }
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
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">H</span>
                    </div>
                    <span className="text-2xl font-display font-bold text-white">HumanlyAI</span>
                </Link>

                <Card padding="lg">
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
                            <p className="text-surface-400 mb-6">
                                We've sent password reset instructions to {email}
                            </p>
                            <Link to="/auth/login">
                                <Button variant="secondary" className="w-full">
                                    {t('auth.forgotPassword.backToLogin')}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-display font-bold mb-2">{t('auth.forgotPassword.title')}</h1>
                                <p className="text-surface-400">{t('auth.forgotPassword.subtitle')}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input
                                    type="email"
                                    label={t('auth.forgotPassword.email')}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    }
                                />

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    isLoading={isLoading}
                                >
                                    {t('auth.forgotPassword.submit')}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/auth/login"
                                    className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                >
                                    {t('auth.forgotPassword.backToLogin')}
                                </Link>
                            </div>
                        </>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}

export default ForgotPasswordPage
