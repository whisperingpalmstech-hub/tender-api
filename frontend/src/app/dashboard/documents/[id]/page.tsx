'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import { formatDate, getStatusLabel, getStatusBadgeClass } from '@/lib/utils';
import type { Document, Requirement, Response, MatchReport } from '@/types';

type TabType = 'analysis' | 'responses';

export default function DocumentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const documentId = params.id as string;

    const [document, setDocument] = useState<Document | null>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('analysis');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchDocument();

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
                    setDocument(payload.new as Document);
                    if (payload.new.status === 'READY') {
                        fetchMatchReport();
                        fetchResponses();
                    }
                }
            )
            .subscribe();

        // Realtime subscription for responses - auto-update when new responses come in
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
                    console.log('[REALTIME] New response inserted:', payload.new);
                    // Add new response to state
                    setResponses((prev) => {
                        // Avoid duplicates
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
                    console.log('[REALTIME] Response updated:', payload.new);
                    // Update existing response in state
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

    // Stop generating spinner when responses arrive via realtime
    useEffect(() => {
        if (generating && responses.length > 0) {
            setGenerating(false);
            toast.success('Responses ready!');
        }
    }, [responses.length, generating]);

    const fetchDocument = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error) {
            toast.error('Document not found');
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
        const { data, error } = await supabase
            .from('requirements')
            .select('*')
            .eq('document_id', documentId)
            .order('extraction_order', { ascending: true });

        const requirements = (data || []) as Requirement[];
        console.log("[DEBUG] Fetched requirements:", requirements.length, "Error:", error);
        if (requirements.length > 0) {
            console.log("[DEBUG] Sample requirement ID:", requirements[0].id);
        }
        setRequirements(requirements);
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

        const responseData = (data || []) as Response[];
        console.log("[DEBUG] Fetched responses:", responseData.length);

        setResponses(responseData);
    };

    const handleGenerateResponses = async () => {
        setGenerating(true);
        setActiveTab('responses');
        try {
            // SAFEGUARD: Fetch latest requirements fresh from DB to avoid 404 (Stale IDs)
            const { data: latestReqs } = await supabase
                .from('requirements')
                .select('id')
                .eq('document_id', documentId);

            if (!latestReqs || latestReqs.length === 0) {
                toast.error("No requirements found to process.");
                setGenerating(false);
                return;
            }

            const validIds = latestReqs.map((r: any) => r.id);
            console.log("Generating for validated IDs:", validIds);

            // Backend returns immediately, processes in background
            await apiClient.generateResponses(documentId, validIds);

            toast.success('Responses are being prepared... They will appear automatically.');

            // Responses will appear via realtime subscription (INSERT events)
            // Stop the loading spinner after 2 minutes max (safety timeout)
            // The actual responses appear immediately via realtime, this is just for UI state
            setTimeout(() => {
                setGenerating(false);
            }, 120000);

        } catch (error) {
            console.error(error);
            toast.error('Failed to generate responses');
            setGenerating(false);
        }
    };

    const handleSaveResponse = async (responseId: string, text: string) => {
        await apiClient.updateResponse(responseId, text);
        toast.success('Response saved');
        await fetchResponses();
    };

    const handleSubmitResponse = async (responseId: string) => {
        await apiClient.submitForReview(responseId);
        toast.success('Submitted for review');
        await fetchResponses();
    };

    const handleApproveResponse = async (responseId: string) => {
        await apiClient.approveResponse(responseId);
        toast.success('Response approved');
        await fetchResponses();
    };

    const handleRegenerateResponse = async (requirementId: string) => {
        try {
            // Backend processes in background, realtime subscription will handle the update
            await apiClient.generateResponses(documentId, [requirementId]);
            toast.success('Regenerating response... It will update automatically.');
            // No need to manually fetch - realtime subscription will update the UI
        } catch (error) {
            toast.error('Failed to regenerate');
        }
    };

    const handleExport = async () => {
        toast.loading('Preparing export...');
        try {
            const blob = await apiClient.exportDocument(documentId);
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            if (document) {
                a.download = `${document.tender_name || 'tender-response'}.docx`;
            } else {
                a.download = 'tender-response.docx';
            }
            a.click();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('Document exported!');
        } catch (error) {
            toast.dismiss();
            toast.error('Export failed');
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
            <div className="mb-6">
                <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center gap-2 text-sm text-surface-500 
                   hover:text-surface-700 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Documents
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-surface-900">
                        {document.tender_name || document.file_name}
                    </h1>
                    <Badge className={getStatusBadgeClass(document.status)}>
                        {getStatusLabel(document.status)}
                    </Badge>
                </div>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-surface-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {document.file_name}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(document.created_at)}
                            </span>
                        </p>
                    </div>

                    {isReady && (
                        <div className="flex items-center gap-3">
                            {responses.length === 0 && (
                                <Button
                                    variant="secondary"
                                    onClick={handleGenerateResponses}
                                    isLoading={generating}
                                    leftIcon={<RefreshCw className="w-4 h-4" />}
                                >
                                    Prepare Responses
                                </Button>
                            )}
                            <Button
                                onClick={handleExport}
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                Export DOCX
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Processing State */}
            {isProcessing && (
                <Card className="p-8 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center 
                          justify-center mx-auto mb-4">
                            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold text-surface-900 mb-2">
                            Processing Document
                        </h2>
                        <p className="text-surface-500 mb-6">
                            {document.status === 'PARSING' && 'Extracting text from document...'}
                            {document.status === 'EXTRACTING' && 'Identifying requirements...'}
                            {document.status === 'MATCHING' && 'Analyzing requirements against company data...'}
                        </p>
                        <Progress value={document.processing_progress} showLabel />
                    </div>
                </Card>
            )}

            {/* Error State */}
            {document.status === 'ERROR' && (
                <Card className="p-8 text-center border-red-200 bg-red-50">
                    <h2 className="text-xl font-semibold text-red-700 mb-2">
                        Processing Failed
                    </h2>
                    <p className="text-red-600 mb-4">
                        {document.error_message || 'An error occurred while processing the document.'}
                    </p>
                    <Button variant="secondary" onClick={fetchDocument}>
                        Retry
                    </Button>
                </Card>
            )}

            {/* Ready State - Tabs */}
            {isReady && (
                <>
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 mb-6 border-b border-surface-200">
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            Analysis Report
                        </button>
                        <button
                            onClick={() => setActiveTab('responses')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'responses'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            Responses
                            {responses.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs">
                                    {responses.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'analysis' && matchReport && (
                        <MatchReportView report={matchReport} />
                    )}

                    {activeTab === 'responses' && (
                        <>
                            {responses.length === 0 ? (
                                <Card className="p-8 text-center">
                                    {generating ? (
                                        /* Loader inside card while waiting for backend */
                                        <div className="py-4">
                                            <RefreshCw className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
                                            <h3 className="text-lg font-semibold text-surface-900 mb-2">
                                                Preparing Responses...
                                            </h3>
                                            <p className="text-surface-500">
                                                Refining content against your Knowledge Base. This may take a minute.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Default empty state */
                                        <>
                                            <CheckCircle className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-surface-900 mb-2">
                                                No Responses Yet
                                            </h3>
                                            <p className="text-surface-500 mb-6">
                                                Generate draft responses based on the analysis results
                                            </p>
                                            <Button
                                                onClick={handleGenerateResponses}
                                                isLoading={generating}
                                            >
                                                Prepare Responses
                                            </Button>
                                        </>
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
                                    canApprove={true}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
