'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Search, User, Settings, ChevronDown, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LanguageSwitcher } from './language-switcher';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const { t, language } = useI18n();
    const supabase = createClient();
    const [userName, setUserName] = useState('');
    const [userInitials, setUserInitials] = useState('U');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        loadUser();
        // Handle RTL for Arabic
        if (language === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = 'ar';
        } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = language;
        }
    }, [language]);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const name = (profile as any)?.full_name || user.user_metadata?.full_name || '';
            setUserName(name);

            // Get initials
            const initials = name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U';
            setUserInitials(initials);
        }
    };

    return (
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-surface-200/40 px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <div>
                    {title && (
                        <h1 className="text-xl font-black text-surface-900 tracking-tight">{title}</h1>
                    )}
                    {subtitle && (
                        <p className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden lg:block">
                    <Search className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400",
                        language === 'ar' ? 'right-3' : 'left-3'
                    )} />
                    <input
                        type="text"
                        placeholder={t('searchDocuments')}
                        className={cn(
                            "w-64 py-2.5 text-sm bg-surface-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all",
                            language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'
                        )}
                    />
                </div>

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Quick Add Button */}
                <Link href="/dashboard/upload">
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20">
                        <Plus className="w-4 h-4" />
                        {t('newDocument')}
                    </button>
                </Link>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl bg-surface-50 hover:bg-surface-100 
                         text-surface-500 hover:text-surface-700 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className={cn(
                        "absolute top-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white",
                        language === 'ar' ? 'left-2' : 'right-2'
                    )} />
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-surface-50 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 
                            flex items-center justify-center shadow-sm">
                            <span className="text-sm font-semibold text-white">{userInitials}</span>
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-surface-900 leading-tight">
                                {userName || t('account')}
                            </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-surface-400 hidden md:block" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className={cn(
                                "absolute top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-surface-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
                                language === 'ar' ? 'left-0' : 'right-0'
                            )}>
                                <div className="px-4 py-3 border-b border-surface-100">
                                    <p className="text-sm font-medium text-surface-900">{userName || t('account')}</p>
                                    <p className="text-xs text-surface-500">{t('manageAccount')}</p>
                                </div>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    {t('settings')}
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <User className="w-4 h-4" />
                                    {t('profile')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
