'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function SignUpPage() {
    const { t, language } = useI18n();
    const router = useRouter();
    const supabase = createClient();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isRtl = language === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error(t('passwordMinLength'));
            return;
        }

        if (password !== confirmPassword) {
            toast.error(t('passwordsDoNotMatch'));
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            toast.success(t('checkYourEmail'));
            router.push('/auth/login');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t('signUp')} subtitle={t('signUpSubtitle')}>
            <Card className="p-8 shadow-2xl shadow-surface-200/50 border-surface-100">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name Input */}
                    <div className="relative">
                        <User className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400",
                            isRtl ? "right-4" : "left-4"
                        )} />
                        <input
                            type="text"
                            placeholder={t('fullName')}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={cn(
                                "input h-12",
                                isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4"
                            )}
                            required
                            dir={isRtl ? 'rtl' : 'ltr'}
                        />
                    </div>

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

                    {/* Confirm Password Input */}
                    <div className="relative">
                        <Lock className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400",
                            isRtl ? "right-4" : "left-4"
                        )} />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={t('confirmPassword')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                                "input h-12",
                                isRtl ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                            )}
                            required
                            dir={isRtl ? 'rtl' : 'ltr'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors",
                                isRtl ? "left-4" : "right-4"
                            )}
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={loading}
                        className="h-12 rounded-xl shadow-xl shadow-primary-500/20 font-bold text-base"
                    >
                        {loading ? t('signingUp') : t('signUp')}
                    </Button>
                </form>

                {/* Login Link */}
                <div className={cn("mt-8 pt-6 border-t border-surface-100 text-center", isRtl && "text-right")}>
                    <p className="text-surface-500 font-medium">
                        {t('alreadyHaveAccount')}{' '}
                        <Link
                            href="/auth/login"
                            className="text-primary-600 hover:text-primary-700 font-bold transition-colors"
                        >
                            {t('signIn')}
                        </Link>
                    </p>
                </div>
            </Card>
        </AuthLayout>
    );
}
