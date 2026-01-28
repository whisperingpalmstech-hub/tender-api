'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthLayout } from '../../../components/layout/auth-layout';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
    const { t, language } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    const supabase = createClient();
    const isRtl = language === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error(t('passwordsDoNotMatch'));
            return;
        }

        if (formData.password.length < 6) {
            toast.error(t('passwordMinLength'));
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password,
            });

            if (error) throw error;

            toast.success(t('passwordResetSent'));
            router.push('/auth/login');
        } catch (error: any) {
            toast.error(error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t('createNewPassword')} subtitle={t('resetPasswordSubtitle')}>
            <Card className="p-8 shadow-2xl shadow-surface-200/50 border-surface-100">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New Password Input */}
                    <div className="relative">
                        <Lock className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400",
                            isRtl ? "right-4" : "left-4"
                        )} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('password')}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={cn(
                                "input h-12",
                                isRtl ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                            )}
                            required
                            minLength={6}
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
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={cn(
                                "input h-12",
                                isRtl ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                            )}
                            required
                            minLength={6}
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

                    <Button
                        type="submit"
                        fullWidth
                        isLoading={loading}
                        className="h-12 rounded-xl shadow-xl shadow-primary-500/20 font-bold text-base"
                    >
                        {t('resetPassword')}
                    </Button>
                </form>
            </Card>
        </AuthLayout>
    );
}
