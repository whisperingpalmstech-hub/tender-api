'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DocumentList } from '@/components/documents/document-card';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function DocumentsPage() {
    const { t, language } = useI18n();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const supabase = createClient();
    const isRtl = language === 'ar';

    useEffect(() => {
        fetchDocuments();

        // Set up realtime subscription
        const channel = supabase
            .channel('documents-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'documents' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setDocuments((prev) => [payload.new as Document, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setDocuments((prev) =>
                            prev.map((doc) =>
                                doc.id === payload.new.id ? (payload.new as Document) : doc
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setDocuments((prev) =>
                            prev.filter((doc) => doc.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error(isRtl ? 'فشل تحميل المستندات' : 'Failed to load documents');
        } else {
            setDocuments(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', deleteId);

        if (error) {
            toast.error(isRtl ? 'فشل حذف المستند' : 'Failed to delete document');
        } else {
            toast.success(isRtl ? 'تم حذف المستند' : 'Document deleted');
        }
        setDeleting(false);
        setDeleteId(null);
    };

    const handleExport = async (id: string) => {
        toast.loading(isRtl ? 'جاري تحضير التصدير...' : 'Preparing export...');
        try {
            const response = await fetch(`/api/backend/api/documents/${id}/export`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tender-response-${id}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success(isRtl ? 'تم تصدير المستند!' : 'Document exported!');
        } catch (error) {
            toast.dismiss();
            toast.error(isRtl ? 'فشل التصدير' : 'Export failed');
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tender_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title={t('documents')}
            subtitle={t('documentsSubtitle')}
        >
            {/* Toolbar */}
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mb-8", isRtl && "sm:flex-row-reverse")}>
                <div className="relative w-full sm:w-96 group">
                    <Search className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors",
                        isRtl ? "right-4" : "left-4"
                    )} />
                    <input
                        type="text"
                        placeholder={t('searchDocuments')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "w-full h-12 bg-white border border-surface-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-sm",
                            isRtl ? "pr-11 pl-4 text-right" : "pl-11 pr-4"
                        )}
                        dir={isRtl ? 'rtl' : 'ltr'}
                    />
                </div>
                <div className={cn("flex items-center gap-3 w-full sm:w-auto", isRtl && "flex-row-reverse")}>
                    <Button
                        variant="secondary"
                        leftIcon={!isRtl && <Filter className="w-4 h-4" />}
                        rightIcon={isRtl && <Filter className="w-4 h-4" />}
                        className="rounded-xl font-bold flex-1 sm:flex-initial"
                    >
                        {t('filter')}
                    </Button>
                    <Link href="/dashboard/upload" className="flex-1 sm:flex-initial">
                        <Button
                            leftIcon={!isRtl && <Plus className="w-4 h-4" />}
                            rightIcon={isRtl && <Plus className="w-4 h-4" />}
                            className="rounded-xl font-bold w-full shadow-lg shadow-primary-500/20"
                        >
                            {t('upload')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm">
                            <CardSkeleton />
                        </div>
                    ))}
                </div>
            ) : (
                <DocumentList
                    documents={filteredDocuments}
                    onDelete={setDeleteId}
                    onExport={handleExport}
                    emptyMessage={
                        searchQuery
                            ? t('noDocsMatch')
                            : t('noDocsYet')
                    }
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={t('deleteDocument')}
                description={t('deleteConfirmDescription')}
                confirmText={t('delete')}
                variant="danger"
                isLoading={deleting}
            />
        </DashboardLayout>
    );
}
