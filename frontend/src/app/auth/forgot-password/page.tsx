'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setSent(true);
            toast.success('Password reset email sent!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 to-surface-100 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                        bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-lg">
                        <span className="text-2xl font-bold text-white">T</span>
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900">Reset Password</h1>
                    <p className="text-surface-500 mt-1">We'll send you a reset link</p>
                </div>

                <Card className="p-8">
                    {sent ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-surface-900 mb-2">Check your email</h3>
                            <p className="text-surface-500 mb-6">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Link href="/auth/login">
                                <Button variant="secondary" fullWidth>
                                    Back to Sign In
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10"
                                    required
                                />
                            </div>

                            <Button type="submit" fullWidth isLoading={loading}>
                                Send Reset Link
                            </Button>

                            <Link
                                href="/auth/login"
                                className="flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-surface-700 mt-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
