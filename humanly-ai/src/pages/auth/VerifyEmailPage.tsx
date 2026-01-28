import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store'
import { Button, Card } from '@/components/ui'

export function VerifyEmailPage() {
    const { t } = useTranslation()
    const location = useLocation()
    const { resendVerificationEmail, isLoading } = useAuthStore()
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const email = location.state?.email || ''

    const handleResend = async () => {
        if (!email) {
            setStatus('error')
            setMessage('Email not found. Please try signing up again.')
            return
        }

        const { error } = await resendVerificationEmail(email)
        if (error) {
            setStatus('error')
            setMessage(error.message)
        } else {
            setStatus('success')
            setMessage('Verification email sent successfully!')
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
                    <div className="text-center">
                        {/* Email Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-display font-bold mb-2">
                            {t('auth.verification.title')}
                        </h1>
                        <p className="text-surface-400 mb-6">
                            {t('auth.verification.subtitle')}
                            {email && <><br /><span className="text-primary-400 font-medium">{email}</span></>}
                        </p>

                        {status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`mb-6 p-3 rounded-xl text-sm border ${status === 'success'
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}
                            >
                                {message}
                            </motion.div>
                        )}

                        {/* Resend Button */}
                        <Button
                            variant="secondary"
                            className="w-full mb-4"
                            onClick={handleResend}
                            isLoading={isLoading}
                            disabled={status === 'success'}
                        >
                            {t('auth.verification.resend')}
                        </Button>

                        <Link to="/auth/login">
                            <Button variant="ghost" className="w-full">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}

export default VerifyEmailPage
