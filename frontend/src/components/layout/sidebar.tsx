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
    Search,
    Users,
    ShieldCheck,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const { t, language } = useI18n();
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState<string>('BID_WRITER');

    const navigation = [
        { name: t('dashboard'), originalName: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: t('upload'), originalName: 'Upload', href: '/dashboard/upload', icon: Upload, roles: ['ADMIN', 'MANAGER', 'BID_WRITER'] },
        { name: t('documents'), originalName: 'Documents', href: '/dashboard/documents', icon: FileText },
        { name: t('knowledgeBase'), originalName: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: Database, roles: ['ADMIN', 'MANAGER', 'AUDITOR'] },
        { name: t('analytics'), originalName: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Tender Discovery', originalName: 'Discovery', href: '/dashboard/discovery', icon: Search, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Admin Panel', originalName: 'Admin', href: '/dashboard/admin', icon: ShieldCheck, roles: ['ADMIN'] },
        { name: t('settings'), originalName: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Enterprise Matrix', originalName: 'Company', href: '/dashboard/settings/company', icon: User, roles: ['ADMIN', 'MANAGER', 'AUDITOR'] },
    ].filter(item => !item.roles || item.roles.includes(userRole));

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserEmail(user.email || '');

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name, role')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserName((profile as any).full_name || user.email?.split('@')[0] || 'User');
                setUserRole((profile as any).role || 'BID_WRITER');
            }
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

    const isRtl = language === 'ar';

    return (
        <aside
            className={cn(
                'fixed top-0 h-screen bg-white border-r border-surface-200 shadow-xl shadow-surface-200/20',
                'flex flex-col transition-all duration-300 z-40',
                isRtl ? 'right-0 border-l border-r-0' : 'left-0 border-r',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn(
                "h-16 flex items-center px-4 border-b border-surface-200",
                collapsed ? "justify-center" : "justify-between"
            )}>
                {!collapsed && (
                    <Link href="/dashboard" className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 
                          flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-surface-900 tracking-tight text-lg">{t('appName')}</span>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 
                      flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <li key={item.originalName}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                                        isActive
                                            ? 'bg-primary-50 text-primary-700 font-bold shadow-sm'
                                            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                                        collapsed && 'justify-center',
                                        isRtl && 'flex-row-reverse'
                                    )}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-600")} />
                                    {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Toggle button */}
            <button
                onClick={onToggle}
                className={cn(
                    "absolute top-20 w-6 h-6 rounded-full bg-white border border-surface-200 shadow-md flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-all z-50",
                    isRtl ? "-left-3" : "-right-3"
                )}
            >
                {collapsed ? (
                    isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : (
                    isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                )}
            </button>

            {/* User section */}
            <div className="p-4 border-t border-surface-200 bg-surface-50/30">
                {!collapsed && (
                    <div className={cn(
                        "flex items-center gap-3 mb-3 px-2 border border-surface-200/50 p-2 rounded-xl bg-white shadow-sm",
                        isRtl && "flex-row-reverse text-right"
                    )}>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-surface-100 to-surface-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-surface-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-surface-900 truncate tracking-tight">{userName}</p>
                            <p className="text-[10px] uppercase font-black text-surface-400 truncate tracking-tight">{userEmail}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        'text-surface-600 hover:bg-red-50 hover:text-red-600 font-medium',
                        collapsed && 'justify-center',
                        isRtl && 'flex-row-reverse text-right'
                    )}
                    title={collapsed ? t('signOut') : undefined}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="text-sm">{t('signOut')}</span>}
                </button>
            </div>
        </aside>
    );
}
