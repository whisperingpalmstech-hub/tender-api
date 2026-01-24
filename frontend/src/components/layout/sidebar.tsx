'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import {
    LayoutDashboard,
    Upload,
    FileText,
    Database,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    User,
} from 'lucide-react';

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: Database },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserEmail(user.email || '');

            // Try to get profile from user_profiles table
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            setUserName(
                profile?.full_name ||
                user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                'User'
            );
        }
    };

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Failed to sign out');
        } else {
            toast.success('Signed out successfully');
            router.push('/auth/login');
        }
    };

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-screen bg-white border-r border-surface-200',
                'flex flex-col transition-all duration-300 z-40',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 
                          flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-surface-900">Tender Analysis</span>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-full flex justify-center">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 
                          flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && <span>{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Toggle button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border 
                 border-surface-200 shadow-sm flex items-center justify-center
                 text-surface-400 hover:text-surface-600 hover:bg-surface-50 
                 transition-colors"
            >
                {collapsed ? (
                    <ChevronRight className="w-4 h-4" />
                ) : (
                    <ChevronLeft className="w-4 h-4" />
                )}
            </button>

            {/* User section */}
            <div className="p-4 border-t border-surface-200">
                {!collapsed && (
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{userName}</p>
                            <p className="text-xs text-surface-500 truncate">{userEmail}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                        'text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors',
                        collapsed && 'justify-center'
                    )}
                    title={collapsed ? 'Sign Out' : undefined}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
