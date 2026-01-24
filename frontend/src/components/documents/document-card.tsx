'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    FileText,
    Clock,
    MoreVertical,
    Eye,
    Trash2,
    Download
} from 'lucide-react';
import {
    formatDate,
    formatFileSize,
    getStatusLabel,
    getStatusBadgeClass,
    cn
} from '@/lib/utils';
import type { Document } from '@/types';

interface DocumentCardProps {
    document: Document;
    onDelete?: (id: string) => void;
    onExport?: (id: string) => void;
}

export function DocumentCard({ document, onDelete, onExport }: DocumentCardProps) {
    const isProcessing = ['PARSING', 'EXTRACTING', 'MATCHING'].includes(document.status);
    const statusVariant = document.status === 'READY' ? 'success'
        : document.status === 'ERROR' ? 'error'
            : isProcessing ? 'warning'
                : 'neutral';

    return (
        <Card hover className="p-5">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-100 flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary-600" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <Link
                                href={`/dashboard/documents/${document.id}`}
                                className="font-medium text-surface-900 hover:text-primary-600 
                         transition-colors line-clamp-1"
                            >
                                {document.tender_name || document.file_name}
                            </Link>
                            <p className="text-sm text-surface-500 mt-0.5">
                                {document.file_name}
                            </p>
                        </div>
                        <Badge variant={statusVariant}>
                            {getStatusLabel(document.status)}
                        </Badge>
                    </div>

                    {isProcessing && (
                        <div className="mt-3">
                            <Progress
                                value={document.processing_progress}
                                size="sm"
                                showLabel
                            />
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-surface-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(document.created_at)}
                            </span>
                            {document.file_size_bytes && (
                                <span>{formatFileSize(document.file_size_bytes)}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <Link
                                href={`/dashboard/documents/${document.id}`}
                                className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 
                         hover:text-surface-600 transition-colors"
                                title="View"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                            {document.status === 'READY' && onExport && (
                                <button
                                    onClick={() => onExport(document.id)}
                                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 
                           hover:text-surface-600 transition-colors"
                                    title="Export"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(document.id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-surface-400 
                           hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

interface DocumentListProps {
    documents: Document[];
    onDelete?: (id: string) => void;
    onExport?: (id: string) => void;
    emptyMessage?: string;
}

export function DocumentList({
    documents,
    onDelete,
    onExport,
    emptyMessage = 'No documents found'
}: DocumentListProps) {
    if (documents.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                <p className="text-surface-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
                <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={onDelete}
                    onExport={onExport}
                />
            ))}
        </div>
    );
}
