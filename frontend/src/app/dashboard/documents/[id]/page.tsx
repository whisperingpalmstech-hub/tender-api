'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MatchReportView } from '@/components/analysis/match-report';
import { ResponseList } from '@/components/responses/response-editor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Download,
    RefreshCw,
    FileText,
    Clock,
    CheckCircle,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import { formatDate, getStatusLabel, getStatusBadgeClass, cn } from '@/lib/utils';
import type { Document, Requirement, Response, MatchReport } from '@/types';

import { useI18n } from '@/lib/i18n';

type TabType = 'analysis' | 'responses';

export default function DocumentDetailPage() {
    const { t, language } = useI18n();
    const params = useParams();
    const router = useRouter();
    const documentId = params.id as string;

    const [document, setDocument] = useState<Document | null>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as TabType) || 'analysis';
    const [activeTab, setTabState] = useState<TabType>(initialTab);
    const [userRole, setUserRole] = useState<string>('BID_WRITER');

    const setActiveTab = (tab: TabType) => {
        setTabState(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const supabase = createClient();

    const isRtl = language === 'ar';

    useEffect(() => {
        const initialize = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setAuthToken(session.access_token);
                // Get role
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (profile) setUserRole((profile as any).role);
            }
            fetchDocument();
        };
        initialize();

        // Realtime subscription for document updates
        const documentChannel = supabase
            .channel(`document-${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'documents',
                    filter: `id=eq.${documentId}`
                },
                (payload: any) => {
                    const newDoc = payload.new as Document;
                    setDocument(newDoc);
                    if (newDoc.status === 'READY') {
                        fetchRequirements();
                        fetchMatchReport();
                        fetchResponses();
                    }
                }
            )
            .subscribe();

        // Realtime subscription for responses
        const responsesChannel = supabase
            .channel(`responses-${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'responses',
                    filter: `document_id=eq.${documentId}`
                },
                (payload: any) => {
                    setResponses((prev) => {
                        const exists = prev.some((r) => r.id === payload.new.id);
                        if (exists) return prev;
                        return [...prev, payload.new as Response];
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'responses',
                    filter: `document_id=eq.${documentId}`
                },
                (payload: any) => {
                    setResponses((prev) =>
                        prev.map((r) =>
                            r.id === payload.new.id ? (payload.new as Response) : r
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(documentChannel);
            supabase.removeChannel(responsesChannel);
        };
    }, [documentId]);

    // Robust Polling Mechanism to ensure UI stays perfectly synced without reloading
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        const missingResponses = requirements.length > 0 && responses.length < requirements.length;

        if (generating || missingResponses) {
            pollInterval = setInterval(() => {
                fetchResponses();
            }, 3000); // Check every 3 seconds while incomplete
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [generating, responses.length, requirements.length, documentId]);

    useEffect(() => {
        if (generating && requirements.length > 0 && responses.length >= requirements.length) {
            setGenerating(false);
            toast.success(t('responses') + ' ready!');
        }
    }, [responses.length, requirements.length, generating, t]);

    const fetchDocument = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error) {
            toast.error(t('documentNotFound'));
            router.push('/dashboard/documents');
            return;
        }

        setDocument(data as Document);

        if ((data as Document).status === 'READY') {
            await Promise.all([
                fetchRequirements(),
                fetchMatchReport(),
                fetchResponses(),
            ]);
        }

        setLoading(false);
    };

    const fetchRequirements = async () => {
        const { data } = await supabase
            .from('requirements')
            .select('*')
            .eq('document_id', documentId)
            .order('extraction_order', { ascending: true });

        setRequirements((data || []) as Requirement[]);
    };

    const fetchMatchReport = async () => {
        try {
            const report = await apiClient.getMatchSummary(documentId);
            setMatchReport(report);
        } catch (error) {
            console.error('Failed to fetch match report');
        }
    };

    const fetchResponses = async () => {
        const { data } = await supabase
            .from('responses')
            .select('*')
            .eq('document_id', documentId)
            .order('created_at', { ascending: true });

        setResponses((data || []) as Response[]);
    };

    const handleGenerateResponses = async () => {
        setGenerating(true);
        setActiveTab('responses');
        try {
            const { data: latestReqs } = await supabase
                .from('requirements')
                .select('id')
                .eq('document_id', documentId);

            if (!latestReqs || latestReqs.length === 0) {
                toast.error("No requirements found");
                setGenerating(false);
                return;
            }

            const validIds = latestReqs.map((r: any) => r.id);
            await apiClient.generateResponses(documentId, validIds);

            toast.success('Responses are being prepared...');
        } catch (error) {
            toast.error('Failed to generate responses');
            setGenerating(false);
        }
    };

    const handleSaveResponse = async (responseId: string, text: string) => {
        await apiClient.updateResponse(responseId, text);
        toast.success(t('save'));
        await fetchResponses();
    };

    const handleSubmitResponse = async (responseId: string) => {
        await apiClient.submitForReview(responseId);
        toast.success(t('submit'));
        await fetchResponses();
    };

    const handleApproveResponse = async (responseId: string) => {
        await apiClient.approveResponse(responseId);
        toast.success('Approved');
        await fetchResponses();
    };

    const handleRegenerateResponse = async (requirementId: string, mode?: string, tone?: string) => {
        try {
            await apiClient.generateResponses(documentId, [requirementId], mode, tone);
            toast.success('Regenerating...');
        } catch (error) {
            toast.error('Failed');
        }
    };

    const handleDeleteResponse = async (responseId: string) => {
        try {
            await apiClient.deleteResponse(responseId);
            toast.success('Response deleted');
            await fetchResponses();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleExport = async () => {
        toast.loading('Exporting...');
        try {
            const blob = await apiClient.exportDocument(documentId);
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `${document?.tender_name || 'response'}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('Exported!');
        } catch (error) {
            toast.dismiss();
            toast.error('Failed');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (!document) return null;

    const isProcessing = ['PARSING', 'EXTRACTING', 'MATCHING'].includes(document.status);
    const isReady = document.status === 'READY';

    return (
        <DashboardLayout>
            {/* Header */}
            <div className={cn("mb-6", isRtl && "text-right")}>
                <Link
                    href="/dashboard/documents"
                    className={cn(
                        "inline-flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-primary-600 mb-6 transition-colors group",
                        isRtl && "flex-row-reverse"
                    )}
                >
                    <ArrowLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRtl && "rotate-180 group-hover:translate-x-1")} />
                    {t('backToDocuments')}
                </Link>

                <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6", isRtl && "md:flex-row-reverse")}>
                    <div className={cn("flex-1", isRtl && "text-right")}>
                        <div className={cn("flex items-center gap-3 mb-2", isRtl && "flex-row-reverse")}>
                            <h1 className="text-3xl font-black text-surface-900 tracking-tight">
                                {document.tender_name || document.file_name}
                            </h1>
                            <Badge className={cn(getStatusBadgeClass(document.status), "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider")}>
                                {t(getStatusLabel(document.status) as any)}
                            </Badge>
                        </div>
                        <p className={cn("text-surface-500 flex items-center gap-6 font-medium", isRtl && "flex-row-reverse")}>
                            <span className={cn("flex items-center gap-1.5", isRtl && "flex-row-reverse")}>
                                <FileText className="w-4 h-4 text-surface-300" />
                                <span className="truncate max-w-[200px]">{document.file_name}</span>
                            </span>
                            <span className={cn("flex items-center gap-1.5", isRtl && "flex-row-reverse")}>
                                <Clock className="w-4 h-4 text-surface-300" />
                                {formatDate(document.created_at)}
                            </span>
                        </p>
                    </div>

                    {isReady && (
                        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                            {responses.length === 0 && userRole !== 'AUDITOR' && (
                                <Button
                                    variant="secondary"
                                    onClick={handleGenerateResponses}
                                    isLoading={generating}
                                    leftIcon={<RefreshCw className="w-4 h-4" />}
                                    className="rounded-xl font-bold border-surface-200"
                                >
                                    {t('prepareResponses')}
                                </Button>
                            )}
                            <Button
                                onClick={handleExport}
                                leftIcon={<Download className="w-4 h-4" />}
                                className="rounded-xl font-bold shadow-lg shadow-primary-500/20"
                            >
                                {t('exportDocx')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Processing State */}
            {isProcessing && (
                <Card className="p-12 text-center border-dashed border-2 border-primary-100 bg-primary-50/10">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-2xl bg-white shadow-xl shadow-primary-500/10 flex items-center 
                          justify-center mx-auto mb-6 border border-primary-50">
                            <RefreshCw className="w-10 h-10 text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-black text-surface-900 mb-3 tracking-tight">
                            {t('processingDocument')}
                        </h2>
                        <p className="text-surface-500 mb-8 font-medium">
                            {document.status === 'PARSING' && t('extractingText')}
                            {document.status === 'EXTRACTING' && t('identifyingRequirements')}
                            {document.status === 'MATCHING' && t('analyzingRequirements')}
                        </p>
                        <div className="space-y-2">
                            <div className={cn("flex justify-between text-[10px] font-black uppercase tracking-widest text-primary-600", isRtl && "flex-row-reverse")}>
                                <span>{t(getStatusLabel(document.status) as any)}...</span>
                                <span>{Math.round(document.processing_progress)}%</span>
                            </div>
                            <Progress value={document.processing_progress} className="h-2" />
                        </div>
                    </div>
                </Card>
            )}

            {/* Error State */}
            {document.status === 'ERROR' && (
                <Card className="p-12 text-center border-red-100 bg-red-50/30">
                    <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6 border border-red-200">
                        <Zap className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-red-700 mb-3 tracking-tight">
                        {t('processingFailedTitle')}
                    </h2>
                    <p className="text-red-600/70 mb-8 font-medium max-w-md mx-auto">
                        {document.error_message || 'An error occurred while processing the document.'}
                    </p>
                    <Button variant="secondary" onClick={fetchDocument} className="rounded-xl px-8 border-red-200 hover:bg-red-50 text-red-700">
                        {t('retry')}
                    </Button>
                </Card>
            )}

            {/* Ready State - Tabs */}
            {isReady && (
                <div className="space-y-8">
                    {/* Tab Navigation */}
                    <div className={cn(
                        "flex items-center gap-1 border-b border-surface-200",
                        isRtl && "flex-row-reverse"
                    )}>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={cn(
                                "px-8 py-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all duration-300",
                                activeTab === 'analysis'
                                    ? 'border-primary-500 text-primary-600 bg-primary-50/30'
                                    : 'border-transparent text-surface-400 hover:text-surface-600 hover:bg-surface-50/50'
                            )}
                        >
                            {t('analysisReportTab')}
                        </button>
                        <button
                            onClick={() => setActiveTab('responses')}
                            className={cn(
                                "px-8 py-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all duration-300 flex items-center gap-3",
                                activeTab === 'responses'
                                    ? 'border-primary-500 text-primary-600 bg-primary-50/30'
                                    : 'border-transparent text-surface-400 hover:text-surface-600 hover:bg-surface-50/50'
                            )}
                        >
                            {t('responsesTab')}
                            {responses.length > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-primary-100 text-primary-700 text-[10px] font-black">
                                    {responses.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'analysis' && matchReport && (
                            <MatchReportView report={matchReport} />
                        )}

                        {activeTab === 'responses' && (
                            <>
                                {responses.length === 0 ? (
                                    <Card className="p-16 text-center border-dashed border-2 border-surface-200">
                                        {generating ? (
                                            <div className="py-8">
                                                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                                                </div>
                                                <h3 className="text-xl font-black text-surface-900 mb-2">
                                                    {t('preparingResponses')}
                                                </h3>
                                                <p className="text-surface-500 max-w-sm mx-auto font-medium">
                                                    {t('refineAgainstKB')}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-surface-100">
                                                    <CheckCircle className="w-8 h-8 text-surface-300" />
                                                </div>
                                                <h3 className="text-xl font-black text-surface-900 mb-2">
                                                    {t('noResponsesYet')}
                                                </h3>
                                                <p className="text-surface-500 mb-8 max-w-sm mx-auto font-medium">
                                                    {userRole === 'AUDITOR' ? 'This document is currently pending technical response generation by a Bid Writer.' : t('generateDrafts')}
                                                </p>
                                                {userRole !== 'AUDITOR' && (
                                                    <Button
                                                        onClick={handleGenerateResponses}
                                                        isLoading={generating}
                                                        className="px-10 rounded-xl shadow-xl shadow-primary-500/20"
                                                    >
                                                        {t('prepareResponses')}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                ) : (
                                    <ResponseList
                                        responses={responses}
                                        requirements={requirements}
                                        onSave={handleSaveResponse}
                                        onSubmit={handleSubmitResponse}
                                        onApprove={handleApproveResponse}
                                        onRegenerate={handleRegenerateResponse}
                                        onDelete={handleDeleteResponse}
                                        canApprove={['ADMIN', 'MANAGER'].includes(userRole)}
                                        readOnly={userRole === 'AUDITOR'}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
