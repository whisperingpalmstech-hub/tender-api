'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    const { language } = useI18n();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const isRtl = language === 'ar';

    // Update the body direction for the entire app when language changes
    useEffect(() => {
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language;

        if (isRtl) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }, [isRtl, language]);

    return (
        <div className={cn(
            "min-h-screen bg-surface-50 transition-colors duration-500",
            isRtl ? "font-arabic" : ""
        )} dir={isRtl ? 'rtl' : 'ltr'}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div
                className={cn(
                    'transition-all duration-300',
                    isRtl
                        ? (sidebarCollapsed ? 'mr-20 ml-0' : 'mr-64 ml-0')
                        : (sidebarCollapsed ? 'ml-20 mr-0' : 'ml-64 mr-0')
                )}
            >
                <Header title={title} subtitle={subtitle} />
                <main className="p-6 md:p-8 max-w-[1600px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
