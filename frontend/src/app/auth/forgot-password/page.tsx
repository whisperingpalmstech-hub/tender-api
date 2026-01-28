'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
    const { t, language } = useI18n();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const supabase = createClient();
    const isRtl = language === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setSent(true);
            toast.success(t('passwordResetSent'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t('resetPassword')} subtitle={t('resetPasswordSubtitle')}>
            <Card className="p-8 shadow-2xl shadow-surface-200/50 border-surface-100">
                {sent ? (
                    <div className={cn("text-center py-6", isRtl && "text-right")}>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-surface-900 mb-2">
                            {t('checkYourEmail')}
                        </h3>
                        <p className="text-surface-500 mb-6">
                            {t('passwordResetLinkSent')} <strong>{email}</strong>
                        </p>
                        <Link href="/auth/login">
                            <Button variant="secondary" fullWidth className="h-11 rounded-xl font-bold">
                                {t('backToSignIn')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <Mail className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400",
                                isRtl ? "right-4" : "left-4"
                            )} />
                            <input
                                type="email"
                                placeholder={t('emailAddress')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cn(
                                    "input h-12",
                                    isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4"
                                )}
                                required
                                dir={isRtl ? 'rtl' : 'ltr'}
                            />
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            isLoading={loading}
                            className="h-12 rounded-xl shadow-xl shadow-primary-500/20 font-bold text-base"
                        >
                            {t('sendResetLink')}
                        </Button>

                        <Link
                            href="/auth/login"
                            className={cn(
                                "flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-surface-700 mt-4 font-medium transition-colors",
                                isRtl && "flex-row-reverse"
                            )}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('backToSignIn')}
                        </Link>
                    </form>
                )}
            </Card>
        </AuthLayout>
    );
}
