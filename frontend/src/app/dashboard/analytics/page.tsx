'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import {
    TrendingUp,
    FileText,
    CheckCircle,
    Clock,
    BarChart3,
    FolderOpen,
    ArrowUpRight,
    Zap,
    Target,
    Activity
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface AnalyticsData {
    totalDocuments: number;
    avgMatchRate: number;
    responsesApproved: number;
    processing: number;
    matchDistribution: { high: number; medium: number; low: number };
}

interface RecentActivity {
    action: string;
    item: string;
    time: string;
    type: 'upload' | 'complete' | 'error';
}

function StatCard({ icon: Icon, label, value, color, isRtl }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    isRtl?: boolean;
}) {
    return (
        <Card className="p-6 overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-surface-100">
            <div className={cn("flex items-start justify-between mb-4", isRtl && "flex-row-reverse")}>
                <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="p-1 rounded-full bg-surface-50 group-hover:bg-primary-50 transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500" />
                </div>
            </div>
            <div className={isRtl ? "text-right" : ""}>
                <p className="text-3xl font-black text-surface-900 tracking-tighter">{value}</p>
                <p className="text-xs font-bold text-surface-400 mt-1 uppercase tracking-widest">{label}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-surface-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </Card>
    );
}

export default function AnalyticsPage() {
    const { t, language } = useI18n();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData>({
        totalDocuments: 0,
        avgMatchRate: 0,
        responsesApproved: 0,
        processing: 0,
        matchDistribution: { high: 0, medium: 0, low: 0 }
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    const isRtl = language === 'ar';

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);

        try {
            // Get documents count
            const { data: documents } = await supabase
                .from('documents')
                .select('id, status, created_at, tender_name, file_name')
                .order('created_at', { ascending: false });

            const totalDocuments = documents?.length || 0;
            const processing = documents?.filter((d: { status: string }) => ['PARSING', 'EXTRACTING', 'MATCHING'].includes(d.status)).length || 0;

            // Get approved responses count
            const { data: responses } = await supabase
                .from('responses')
                .select('id')
                .eq('status', 'APPROVED');

            const responsesApproved = responses?.length || 0;

            // Get match summaries for analytics
            const { data: summaries } = await supabase
                .from('match_summaries')
                .select('overall_match');

            let avgMatchRate = 0;
            let matchDistribution = { high: 0, medium: 0, low: 0 };

            if (summaries && summaries.length > 0) {
                avgMatchRate = summaries.reduce((acc: number, s: { overall_match?: number }) => acc + (s.overall_match || 0), 0) / summaries.length;

                summaries.forEach((s: { overall_match?: number }) => {
                    const match = s.overall_match || 0;
                    if (match >= 80) matchDistribution.high++;
                    else if (match >= 50) matchDistribution.medium++;
                    else matchDistribution.low++;
                });
            }

            setData({
                totalDocuments,
                avgMatchRate: Math.round(avgMatchRate),
                responsesApproved,
                processing,
                matchDistribution
            });

            // Build recent activity from documents
            const activities: RecentActivity[] = [];
            if (documents) {
                documents.slice(0, 8).forEach((doc: { status: string; tender_name: string | null; file_name: string; created_at: string }) => {
                    let action = t('documentUploaded');
                    let type: 'upload' | 'complete' | 'error' = 'upload';

                    if (doc.status === 'READY') {
                        action = t('analysisCompleted');
                        type = 'complete';
                    } else if (doc.status === 'ERROR') {
                        action = t('processingFailed');
                        type = 'error';
                    }

                    activities.push({
                        action,
                        item: doc.tender_name || doc.file_name,
                        time: formatDate(doc.created_at),
                        type
                    });
                });
            }
            setRecentActivity(activities);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout
            title={t('analytics')}
            subtitle={t('trackPerformance')}
        >
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </Card>
                    ))
                ) : (
                    <>
                        <StatCard
                            icon={FileText}
                            label={t('totalDocuments')}
                            value={data.totalDocuments}
                            color="from-primary-500 to-primary-600"
                            isRtl={isRtl}
                        />
                        <StatCard
                            icon={BarChart3}
                            label={t('avgMatchRate')}
                            value={data.avgMatchRate > 0 ? `${data.avgMatchRate}%` : '-'}
                            color="from-emerald-500 to-teal-600"
                            isRtl={isRtl}
                        />
                        <StatCard
                            icon={CheckCircle}
                            label={t('responsesApproved')}
                            value={data.responsesApproved}
                            color="from-purple-500 to-indigo-600"
                            isRtl={isRtl}
                        />
                        <StatCard
                            icon={Clock}
                            label={t('processing')}
                            value={data.processing}
                            color="from-amber-500 to-orange-600"
                            isRtl={isRtl}
                        />
                    </>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Match Rate Distribution */}
                <Card className="p-8 relative overflow-hidden border-surface-100">
                    <div className={cn("flex items-center gap-2 mb-8", isRtl && "flex-row-reverse")}>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-surface-900 tracking-tight text-lg">{t('matchDistribution')}</h3>
                    </div>

                    {data.totalDocuments > 0 ? (
                        <>
                            <div className="flex items-center justify-center py-6">
                                <CircularProgress
                                    value={data.avgMatchRate}
                                    size={180}
                                    strokeWidth={12}
                                    variant="match"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-10">
                                <div className="text-center p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                    <p className="text-xl font-black text-emerald-600">{data.matchDistribution.high}</p>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-1">{t('highMatch')}</p>
                                </div>
                                <div className="text-center p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
                                    <p className="text-xl font-black text-amber-600">{data.matchDistribution.medium}</p>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-tighter mt-1">{t('mediumMatch')}</p>
                                </div>
                                <div className="text-center p-3 rounded-2xl bg-red-50/50 border border-red-100">
                                    <p className="text-xl font-black text-red-600">{data.matchDistribution.low}</p>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter mt-1">{t('lowMatch')}</p>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-surface-100 text-center">
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">{t('overallAverage')}: <span className="text-surface-900">{data.avgMatchRate}%</span></p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <TrendingUp className="w-16 h-16 text-surface-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">{isRtl ? 'لا توجد بيانات متاحة بعد' : 'No data available yet'}</p>
                        </div>
                    )}
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2 p-8 border-surface-100">
                    <div className={cn("flex items-center justify-between mb-8", isRtl && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-surface-900 tracking-tight text-lg">{t('recentActivity')}</h3>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-surface-50 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                            {recentActivity.length} {isRtl ? 'الأحداث' : 'Events'}
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : recentActivity.length > 0 ? (
                        <div className="space-y-2">
                            {recentActivity.map((activity, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl hover:bg-surface-50 transition-all group border border-transparent hover:border-surface-100",
                                        isRtl && "flex-row-reverse"
                                    )}
                                >
                                    <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                            activity.type === 'complete' ? "bg-emerald-100 text-emerald-600" :
                                                activity.type === 'error' ? "bg-red-100 text-red-600" :
                                                    "bg-blue-100 text-blue-600"
                                        )}>
                                            {activity.type === 'complete' ? <CheckCircle className="w-5 h-5" /> :
                                                activity.type === 'error' ? <Zap className="w-5 h-5" /> :
                                                    <FileText className="w-5 h-5" />}
                                        </div>
                                        <div className={isRtl ? "text-right" : ""}>
                                            <p className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors">{activity.action}</p>
                                            <p className="text-xs font-medium text-surface-400 truncate max-w-[200px] md:max-w-md">{activity.item}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-surface-300 uppercase shrink-0 font-mono tracking-tighter">
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 rounded-2xl bg-surface-50 flex items-center justify-center mx-auto mb-4 border border-surface-100">
                                <FolderOpen className="w-10 h-10 text-surface-200" />
                            </div>
                            <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">{t('noRecentActivity')}</p>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
