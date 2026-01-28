'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import {
    Upload,
    FileText,
    CheckCircle,
    Clock,
    TrendingUp,
    ArrowRight,
    Plus,
    FolderOpen,
    Sparkles,
    BarChart3,
    Zap,
    Target,
    ArrowUpRight
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface Document {
    id: string;
    file_name: string;
    tender_name: string | null;
    status: string;
    created_at: string;
}

interface Stats {
    total: number;
    processing: number;
    ready: number;
    avgMatch: number;
}

export default function DashboardPage() {
    const { t, language } = useI18n();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ total: 0, processing: 0, ready: 0, avgMatch: 0 });
    const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
    const [matchRates, setMatchRates] = useState({ eligibility: 0, technical: 0, compliance: 0 });
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);

        try {
            // Get user name
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                setUserName((profile as any)?.full_name || user.user_metadata?.full_name || '');
            }

            // Get documents
            const { data: documents } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (documents) {
                const total = documents.length;
                const processing = documents.filter((d: Document) => ['PARSING', 'EXTRACTING', 'MATCHING'].includes(d.status)).length;
                const ready = documents.filter((d: Document) => d.status === 'READY').length;

                setStats({ total, processing, ready, avgMatch: 0 });
                setRecentDocuments(documents.slice(0, 5));

                // Get match summaries
                const { data: summaries } = await supabase
                    .from('match_summaries')
                    .select('eligibility_match, technical_match, compliance_match, overall_match');

                if (summaries && summaries.length > 0) {
                    const avgOverall = summaries.reduce((acc: number, s: { overall_match?: number }) => acc + (s.overall_match || 0), 0) / summaries.length;
                    const avgElig = summaries.reduce((acc: number, s: { eligibility_match?: number }) => acc + (s.eligibility_match || 0), 0) / summaries.length;
                    const avgTech = summaries.reduce((acc: number, s: { technical_match?: number }) => acc + (s.technical_match || 0), 0) / summaries.length;
                    const avgComp = summaries.reduce((acc: number, s: { compliance_match?: number }) => acc + (s.compliance_match || 0), 0) / summaries.length;

                    setStats(prev => ({ ...prev, avgMatch: Math.round(avgOverall) }));
                    setMatchRates({
                        eligibility: Math.round(avgElig),
                        technical: Math.round(avgTech),
                        compliance: Math.round(avgComp)
                    });
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('goodMorning');
        if (hour < 17) return t('goodAfternoon');
        return t('goodEvening');
    };

    const isRtl = language === 'ar';

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'READY':
                return { label: t('ready'), className: "bg-emerald-100 text-emerald-700" };
            case 'ERROR':
                return { label: t('error'), className: "bg-red-100 text-red-700" };
            default:
                return { label: t('processing'), className: "bg-amber-100 text-amber-700" };
        }
    };

    return (
        <DashboardLayout
            title=""
            subtitle=""
        >
            {/* Welcome Header */}
            <div className={cn("mb-8", isRtl && "text-right")}>
                <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-wider font-mono">{getGreeting()}</span>
                </div>
                <h1 className="text-3xl font-black text-surface-900 tracking-tight">
                    {t('welcomeBack')}{userName ? `, ${userName.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-surface-500 mt-1 font-medium">{t('dashboardOverview')}</p>
            </div>

            {/* Stats Grid - Modern Design */}
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8", isRtl && "flex-row-reverse")}>
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-surface-100 shadow-sm">
                            <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))
                ) : (
                    <>
                        {/* Total Documents */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                            <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className={cn("text-3xl font-black text-surface-900", isRtl && "text-right")}>{stats.total}</p>
                            <p className={cn("text-sm font-bold text-surface-400 mt-1 uppercase tracking-tighter", isRtl && "text-right")}>{t('totalDocuments')}</p>
                        </div>

                        {/* Processing */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300">
                            <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className={cn("text-3xl font-black text-surface-900", isRtl && "text-right")}>{stats.processing}</p>
                            <p className={cn("text-sm font-bold text-surface-400 mt-1 uppercase tracking-tighter", isRtl && "text-right")}>{t('processing')}</p>
                        </div>

                        {/* Ready for Review */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                            <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className={cn("text-3xl font-black text-surface-900", isRtl && "text-right")}>{stats.ready}</p>
                            <p className={cn("text-sm font-bold text-surface-400 mt-1 uppercase tracking-tighter", isRtl && "text-right")}>{t('readyDocs')}</p>
                        </div>

                        {/* Avg Match Rate */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                            <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className={cn("text-3xl font-black text-surface-900", isRtl && "text-right")}>
                                {stats.avgMatch > 0 ? `${stats.avgMatch}%` : '—'}
                            </p>
                            <p className={cn("text-sm font-bold text-surface-400 mt-1 uppercase tracking-tighter", isRtl && "text-right")}>{t('matchRate')}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Documents - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
                        <div className={cn(
                            "p-5 border-b border-surface-100 flex items-center justify-between",
                            isRtl && "flex-row-reverse"
                        )}>
                            <div className={isRtl ? "text-right" : ""}>
                                <h3 className="font-bold text-surface-900 tracking-tight">{t('recentDocuments')}</h3>
                                <p className="text-xs font-medium text-surface-500">{t('latestUploads')}</p>
                            </div>
                            <Link
                                href="/dashboard/documents"
                                className={cn(
                                    "flex items-center gap-1 text-xs font-black text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-widest",
                                    isRtl && "flex-row-reverse"
                                )}
                            >
                                {isRtl ? 'عرض الكل' : 'View all'} <ArrowRight className={cn("w-4 h-4", isRtl && "rotate-180")} />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="p-5 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="w-12 h-12 rounded-xl" />
                                        <div className="flex-1">
                                            <Skeleton className="h-5 w-48 mb-2" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentDocuments.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-surface-50 flex items-center justify-center mx-auto mb-4 border border-surface-100">
                                    <FolderOpen className="w-10 h-10 text-surface-300" />
                                </div>
                                <h4 className="font-bold text-surface-900 mb-2">{t('noDocumentsIndex')}</h4>
                                <Link href="/dashboard/upload">
                                    <Button leftIcon={<Plus className="w-4 h-4" />} className="rounded-xl font-bold shadow-lg shadow-primary-500/20 mt-4">
                                        {t('newDocument')}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100">
                                {recentDocuments.map((doc) => {
                                    const statusInfo = getStatusInfo(doc.status);
                                    return (
                                        <Link
                                            key={doc.id}
                                            href={`/dashboard/documents/${doc.id}`}
                                            className={cn(
                                                "flex items-center justify-between p-5 hover:bg-surface-50 transition-all duration-200 group",
                                                isRtl && "flex-row-reverse"
                                            )}
                                        >
                                            <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                                                <div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors border border-surface-100 group-hover:border-primary-100">
                                                    <FileText className="w-6 h-6 text-surface-400 group-hover:text-primary-600" />
                                                </div>
                                                <div className={isRtl ? "text-right" : ""}>
                                                    <p className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors tracking-tight">
                                                        {doc.tender_name || doc.file_name}
                                                    </p>
                                                    <p className="text-xs font-medium text-surface-400 font-mono">
                                                        {formatDate(doc.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                                                <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", statusInfo.className)}>
                                                    {statusInfo.label}
                                                </span>
                                                <ArrowRight className={cn(
                                                    "w-4 h-4 text-surface-300 group-hover:text-primary-600 transition-all",
                                                    isRtl ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"
                                                )} />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Match Rates Card */}
                    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 overflow-hidden relative">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-50/50 rounded-full blur-2xl" />

                        <div className={cn("flex items-center gap-2 mb-6 relative z-10", isRtl && "flex-row-reverse")}>
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            <h3 className="font-bold text-surface-900 tracking-tight">{t('matchRate')}</h3>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        ) : stats.avgMatch > 0 ? (
                            <div className="space-y-4 relative z-10">
                                {/* Overall Match */}
                                <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100/50">
                                    <p className="text-4xl font-black text-primary-600 tracking-tighter">{stats.avgMatch}%</p>
                                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-1">{t('overallMatch')}</p>
                                </div>

                                {/* Breakdown */}
                                <div className="space-y-4 pt-4">
                                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                                        <span className="text-xs font-bold text-surface-600 uppercase tracking-wider">{t('eligibility')}</span>
                                        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                                            <div className="w-24 h-1.5 bg-surface-50 rounded-full overflow-hidden border border-surface-100">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${matchRates.eligibility}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black w-8 text-right font-mono">
                                                {matchRates.eligibility > 0 ? `${matchRates.eligibility}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                                        <span className="text-xs font-bold text-surface-600 uppercase tracking-wider">{t('technical')}</span>
                                        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                                            <div className="w-24 h-1.5 bg-surface-50 rounded-full overflow-hidden border border-surface-100">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${matchRates.technical}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black w-8 text-right font-mono">
                                                {matchRates.technical > 0 ? `${matchRates.technical}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                                        <span className="text-xs font-bold text-surface-600 uppercase tracking-wider">{t('compliance')}</span>
                                        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                                            <div className="w-24 h-1.5 bg-surface-50 rounded-full overflow-hidden border border-surface-100">
                                                <div
                                                    className="h-full bg-purple-500 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${matchRates.compliance}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black w-8 text-right font-mono">
                                                {matchRates.compliance > 0 ? `${matchRates.compliance}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-surface-50 flex items-center justify-center mx-auto mb-3 border border-surface-100">
                                    <TrendingUp className="w-8 h-8 text-surface-200" />
                                </div>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Upload CTA */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-blue-600 p-6 shadow-xl shadow-primary-500/30 group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-5 border border-white/20">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-black text-white text-xl mb-2 tracking-tight">{t('newDocument')}</h4>
                            <Link href="/dashboard/upload">
                                <button className="w-full py-3 px-4 rounded-xl bg-white text-primary-700 font-bold hover:bg-surface-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                                    <Upload className="w-5 h-5" />
                                    {t('uploadTitle')}
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
