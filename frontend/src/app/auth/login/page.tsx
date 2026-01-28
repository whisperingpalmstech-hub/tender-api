'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const { t, language } = useI18n();
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isRtl = language === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success(t('signIn') + '!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t('signIn')} subtitle={t('signInSubtitle')}>
            <Card className="p-8 shadow-2xl shadow-surface-200/50 border-surface-100">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Input */}
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

                    {/* Password Input */}
                    <div className="relative">
                        <Lock className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400",
                            isRtl ? "right-4" : "left-4"
                        )} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={cn(
                                "input h-12",
                                isRtl ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                            )}
                            required
                            dir={isRtl ? 'rtl' : 'ltr'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors",
                                isRtl ? "left-4" : "right-4"
                            )}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Forgot Password Link */}
                    <div className={cn("flex", isRtl ? "justify-start" : "justify-end")}>
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            {t('forgotPassword')}
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={loading}
                        className="h-12 rounded-xl shadow-xl shadow-primary-500/20 font-bold text-base"
                    >
                        {loading ? t('signingIn') : t('signIn')}
                    </Button>
                </form>

                {/* Sign Up Link */}
                <div className={cn("mt-8 pt-6 border-t border-surface-100 text-center", isRtl && "text-right")}>
                    <p className="text-surface-500 font-medium">
                        {t('dontHaveAccount')}{' '}
                        <Link
                            href="/auth/signup"
                            className="text-primary-600 hover:text-primary-700 font-bold transition-colors"
                        >
                            {t('signUp')}
                        </Link>
                    </p>
                </div>
            </Card>
        </AuthLayout>
    );
}
