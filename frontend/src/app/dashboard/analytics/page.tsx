'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, FileText, CheckCircle, Clock, BarChart3, FolderOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            <p className="text-2xl font-bold text-surface-900 mt-4">{value}</p>
            <p className="text-sm text-surface-500 mt-1">{label}</p>
        </Card>
    );
}

export default function AnalyticsPage() {
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
                documents.slice(0, 5).forEach((doc: { status: string; tender_name: string | null; file_name: string; created_at: string }) => {
                    let action = 'Document uploaded';
                    if (doc.status === 'READY') action = 'Analysis completed';
                    else if (doc.status === 'ERROR') action = 'Processing failed';

                    activities.push({
                        action,
                        item: doc.tender_name || doc.file_name,
                        time: formatDate(doc.created_at)
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

    if (loading) {
        return (
            <DashboardLayout title="Analytics" subtitle="Track your tender analysis performance">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </Card>
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Analytics"
            subtitle="Track your tender analysis performance"
        >
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                    icon={FileText}
                    label="Total Documents"
                    value={data.totalDocuments}
                    color="bg-primary-500"
                />
                <StatCard
                    icon={BarChart3}
                    label="Average Match Rate"
                    value={data.avgMatchRate > 0 ? `${data.avgMatchRate}%` : '-'}
                    color="bg-green-500"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Responses Approved"
                    value={data.responsesApproved}
                    color="bg-purple-500"
                />
                <StatCard
                    icon={Clock}
                    label="Processing"
                    value={data.processing}
                    color="bg-amber-500"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Match Rate Distribution */}
                <Card className="p-6">
                    <h3 className="font-semibold text-surface-900 mb-6">Match Rate Distribution</h3>
                    {data.totalDocuments > 0 ? (
                        <>
                            <div className="flex items-center justify-center">
                                <CircularProgress value={data.avgMatchRate} size={160} variant="match" />
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                                <div>
                                    <p className="text-lg font-semibold text-emerald-600">{data.matchDistribution.high}</p>
                                    <p className="text-xs text-surface-500">High (80%+)</p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-amber-600">{data.matchDistribution.medium}</p>
                                    <p className="text-xs text-surface-500">Medium (50-79%)</p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-red-600">{data.matchDistribution.low}</p>
                                    <p className="text-xs text-surface-500">Low (&lt;50%)</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <p className="text-surface-500">No data available yet</p>
                        </div>
                    )}
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2 p-6">
                    <h3 className="font-semibold text-surface-900 mb-4">Recent Activity</h3>
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-surface-900">{activity.action}</p>
                                        <p className="text-sm text-surface-500">{activity.item}</p>
                                    </div>
                                    <span className="text-xs text-surface-400">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FolderOpen className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                            <p className="text-surface-500">No recent activity</p>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
