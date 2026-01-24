'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Building, Eye, EyeOff, Briefcase } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        company: '',
        department: '',
    });

    const supabase = createClient();

    useEffect(() => {
        // Check if already logged in
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.push('/dashboard');
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });

                if (error) throw error;

                toast.success('Welcome back!');
                router.push('/dashboard');
            } else {
                // Validate signup fields
                if (!formData.fullName.trim()) {
                    toast.error('Please enter your full name');
                    setLoading(false);
                    return;
                }

                // Sign up the user
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            company: formData.company,
                            department: formData.department,
                        },
                    },
                });

                if (signUpError) throw signUpError;

                // Create user profile in user_profiles table
                if (authData.user) {
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert({
                            id: authData.user.id,
                            full_name: formData.fullName,
                            department: formData.department,
                            role: 'USER',
                        });

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        // Don't throw - user is created, profile can be created later
                    }
                }

                toast.success('Account created! Please check your email to verify.');
                setIsLogin(true);
            }
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
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
                    <h1 className="text-2xl font-bold text-surface-900">Tender Analysis</h1>
                    <p className="text-surface-500 mt-1">Streamline your tender responses</p>
                </div>

                <Card className="p-8">
                    {/* Tab Toggle */}
                    <div className="flex rounded-lg bg-surface-100 p-1 mb-6">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${isLogin
                                ? 'bg-white text-surface-900 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${!isLogin
                                ? 'bg-white text-surface-900 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        type="text"
                                        placeholder="Full Name *"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="input pl-10"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="input pl-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        type="text"
                                        placeholder="Department"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input pl-10"
                                    />
                                </div>
                            </>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input pl-10"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input pl-10 pr-10"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <Button type="submit" fullWidth isLoading={loading}>
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>
                </Card>

                <p className="text-center text-sm text-surface-500 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
