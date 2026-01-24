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
import { formatDate } from '@/lib/utils';

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
                setUserName(profile?.full_name || user.user_metadata?.full_name || 'there');
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
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <DashboardLayout
            title=""
            subtitle=""
        >
            {/* Welcome Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600">{getGreeting()}</span>
                </div>
                <h1 className="text-3xl font-bold text-surface-900">
                    Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-surface-500 mt-1">Here's what's happening with your tender analysis today.</p>
            </div>

            {/* Stats Grid - Modern Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-surface-900">{stats.total}</p>
                            <p className="text-sm text-surface-500 mt-1">Total Documents</p>
                        </div>

                        {/* Processing */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                {stats.processing > 0 && (
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                )}
                            </div>
                            <p className="text-3xl font-bold text-surface-900">{stats.processing}</p>
                            <p className="text-sm text-surface-500 mt-1">Processing</p>
                        </div>

                        {/* Ready for Review */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-surface-900">{stats.ready}</p>
                            <p className="text-sm text-surface-500 mt-1">Ready for Review</p>
                        </div>

                        {/* Avg Match Rate */}
                        <div className="group bg-white rounded-2xl p-6 border border-surface-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-surface-900">
                                {stats.avgMatch > 0 ? `${stats.avgMatch}%` : '—'}
                            </p>
                            <p className="text-sm text-surface-500 mt-1">Avg. Match Rate</p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Documents - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-surface-900">Recent Documents</h3>
                                <p className="text-sm text-surface-500">Your latest tender uploads</p>
                            </div>
                            <Link
                                href="/dashboard/documents"
                                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                View all <ArrowRight className="w-4 h-4" />
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
                                <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                                    <FolderOpen className="w-10 h-10 text-surface-400" />
                                </div>
                                <h4 className="font-semibold text-surface-900 mb-2">No documents yet</h4>
                                <p className="text-surface-500 mb-6 max-w-sm mx-auto">
                                    Upload your first tender document to start analyzing requirements and generating responses.
                                </p>
                                <Link href="/dashboard/upload">
                                    <Button leftIcon={<Plus className="w-4 h-4" />}>
                                        Upload Your First Document
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100">
                                {recentDocuments.map((doc, index) => (
                                    <Link
                                        key={doc.id}
                                        href={`/dashboard/documents/${doc.id}`}
                                        className="flex items-center justify-between p-5 hover:bg-surface-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 transition-colors">
                                                <FileText className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-surface-900 group-hover:text-primary-600 transition-colors">
                                                    {doc.tender_name || doc.file_name}
                                                </p>
                                                <p className="text-sm text-surface-500">
                                                    {formatDate(doc.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {doc.status === 'READY' ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                    Ready
                                                </span>
                                            ) : doc.status === 'ERROR' ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    Error
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                    Processing
                                                </span>
                                            )}
                                            <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Match Rates Card */}
                    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            <h3 className="font-semibold text-surface-900">Match Rates</h3>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        ) : stats.avgMatch > 0 ? (
                            <div className="space-y-4">
                                {/* Overall Match */}
                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50">
                                    <p className="text-4xl font-bold text-primary-600">{stats.avgMatch}%</p>
                                    <p className="text-sm text-surface-500 mt-1">Overall Average</p>
                                </div>

                                {/* Breakdown */}
                                <div className="space-y-3 pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-surface-600">Eligibility</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-surface-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${matchRates.eligibility}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-10 text-right">
                                                {matchRates.eligibility > 0 ? `${matchRates.eligibility}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-surface-600">Technical</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-surface-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${matchRates.technical}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-10 text-right">
                                                {matchRates.technical > 0 ? `${matchRates.technical}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-surface-600">Compliance</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-surface-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${matchRates.compliance}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-10 text-right">
                                                {matchRates.compliance > 0 ? `${matchRates.compliance}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                                    <TrendingUp className="w-8 h-8 text-surface-400" />
                                </div>
                                <p className="text-sm text-surface-500">No match data yet</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Upload CTA */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-blue-500 p-6 shadow-lg shadow-primary-500/25">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <svg className="absolute right-0 top-0 w-40 h-40 transform translate-x-10 -translate-y-10" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="white" />
                            </svg>
                            <svg className="absolute left-0 bottom-0 w-32 h-32 transform -translate-x-10 translate-y-10" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="white" />
                            </svg>
                        </div>

                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-bold text-white text-lg mb-2">Upload New Tender</h4>
                            <p className="text-white/80 text-sm mb-5">
                                Start analyzing a new tender document in seconds
                            </p>
                            <Link href="/dashboard/upload">
                                <button className="w-full py-3 px-4 rounded-xl bg-white text-primary-600 font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Upload Document
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
