import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store'
import { Button, Input, Card } from '@/components/ui'

export function LoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { signIn, isLoading } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')

    useEffect(() => {
        // Check if user has been redirected here after email verification
        if (location.hash.includes('access_token')) {
            setInfo('Email verified successfully! Please sign in to your account.')
        }
    }, [location])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
        } else {
            navigate('/dashboard')
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
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-display font-bold mb-2">{t('auth.login.title')}</h1>
                        <p className="text-surface-400">{t('auth.login.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            type="email"
                            label={t('auth.login.email')}
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

                        <Input
                            type="password"
                            label={t('auth.login.password')}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        {info && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"
                            >
                                {info}
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="flex justify-end">
                            <Link
                                to="/auth/forgot-password"
                                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                {t('auth.login.forgotPassword')}
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            {t('auth.login.submit')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-surface-400">
                        {t('auth.login.noAccount')}{' '}
                        <Link
                            to="/auth/signup"
                            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                        >
                            {t('auth.login.signUp')}
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}

export default LoginPage
