'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Search, User, Settings, ChevronDown, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const supabase = createClient();
    const [userName, setUserName] = useState('');
    const [userInitials, setUserInitials] = useState('U');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const name = profile?.full_name || user.user_metadata?.full_name || '';
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
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-surface-200/50 px-6 flex items-center justify-between sticky top-0 z-30">
            <div>
                {title && (
                    <h1 className="text-xl font-semibold text-surface-900">{title}</h1>
                )}
                {subtitle && (
                    <p className="text-sm text-surface-500">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* Quick Add Button */}
                <Link href="/dashboard/upload">
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20">
                        <Plus className="w-4 h-4" />
                        New Document
                    </button>
                </Link>

                {/* Search */}
                <div className="relative hidden lg:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-64 pl-10 pr-4 py-2.5 text-sm bg-surface-50 border-0 rounded-xl 
                                 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl bg-surface-50 hover:bg-surface-100 
                         text-surface-500 hover:text-surface-700 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
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
                                {userName || 'Account'}
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
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-100 py-2 z-50">
                                <div className="px-4 py-3 border-b border-surface-100">
                                    <p className="text-sm font-medium text-surface-900">{userName || 'User'}</p>
                                    <p className="text-xs text-surface-500">Manage your account</p>
                                </div>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
