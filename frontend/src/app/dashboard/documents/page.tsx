'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DocumentList } from '@/components/documents/document-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const supabase = createClient();

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
            toast.error('Failed to load documents');
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
            toast.error('Failed to delete document');
        } else {
            toast.success('Document deleted');
        }
        setDeleting(false);
        setDeleteId(null);
    };

    const handleExport = async (id: string) => {
        toast.loading('Preparing export...');
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
            toast.success('Document exported!');
        } catch (error) {
            toast.dismiss();
            toast.error('Export failed');
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tender_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Documents"
            subtitle="Manage your tender documents"
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                        Filter
                    </Button>
                    <Link href="/dashboard/upload">
                        <Button leftIcon={<Plus className="w-4 h-4" />}>
                            Upload
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <DocumentList
                    documents={filteredDocuments}
                    onDelete={setDeleteId}
                    onExport={handleExport}
                    emptyMessage={
                        searchQuery
                            ? 'No documents match your search'
                            : 'No documents yet. Upload your first tender document!'
                    }
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Document"
                description="Are you sure you want to delete this document? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={deleting}
            />
        </DashboardLayout>
    );
}
