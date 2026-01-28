'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Clock,
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
import { useI18n } from '@/lib/i18n';

interface DocumentCardProps {
    document: Document;
    onDelete?: (id: string) => void;
    onExport?: (id: string) => void;
}

export function DocumentCard({ document, onDelete, onExport }: DocumentCardProps) {
    const { t, language } = useI18n();
    const isRtl = language === 'ar';

    const isProcessing = ['PARSING', 'EXTRACTING', 'MATCHING'].includes(document.status);
    const statusLabelKey = getStatusLabel(document.status);

    return (
        <Card className="p-0 overflow-hidden border-surface-200 group hover:shadow-xl hover:border-primary-200 transition-all duration-300 rounded-2xl bg-white">
            <div className={cn("p-5 flex items-start gap-4", isRtl && "flex-row-reverse")}>
                <div className="p-3 rounded-xl bg-surface-50 text-surface-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors border border-surface-100 group-hover:border-primary-100">
                    <FileText className="w-6 h-6" />
                </div>

                <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                    <div className={cn("flex items-start justify-between gap-2 mb-1", isRtl && "flex-row-reverse")}>
                        <div className="min-w-0">
                            <Link
                                href={`/dashboard/documents/${document.id}`}
                                className="font-bold text-surface-900 group-hover:text-primary-600 
                         transition-colors line-clamp-1 tracking-tight text-base"
                            >
                                {document.tender_name || document.file_name}
                            </Link>
                            <p className="text-xs font-medium text-surface-400 mt-1 font-mono truncate">
                                {document.file_name}
                            </p>
                        </div>
                        <Badge variant={getStatusBadgeClass(document.status) as any} className="rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0">
                            {t(statusLabelKey as any)}
                        </Badge>
                    </div>

                    {isProcessing && (
                        <div className="mt-4">
                            <div className={cn("flex justify-between items-center mb-1.5", isRtl && "flex-row-reverse")}>
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t(statusLabelKey as any)}...</span>
                                <span className="text-[10px] font-black text-amber-600 font-mono">{Math.round(document.processing_progress || 0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500 animate-pulse"
                                    style={{ width: `${document.processing_progress || 5}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className={cn("mt-4 pt-4 border-t border-surface-50 flex items-center justify-between", isRtl && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-4 text-[10px] font-bold text-surface-400 uppercase tracking-tight", isRtl && "flex-row-reverse")}>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span className="font-mono">{formatDate(document.created_at)}</span>
                            </span>
                            {document.file_size_bytes && (
                                <span className="font-mono">{formatFileSize(document.file_size_bytes)}</span>
                            )}
                        </div>

                        <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                            <Link
                                href={`/dashboard/documents/${document.id}`}
                                className="p-2 rounded-lg hover:bg-surface-50 text-surface-400 
                         hover:text-primary-600 transition-all border border-transparent hover:border-surface-100"
                                title={t('view')}
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                            {document.status === 'READY' && onExport && (
                                <button
                                    onClick={() => onExport(document.id)}
                                    className="p-2 rounded-lg hover:bg-surface-50 text-surface-400 
                                   hover:text-primary-600 transition-all border border-transparent hover:border-surface-100"
                                    title={t('export')}
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(document.id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-surface-400 
                                   hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                    title={t('delete')}
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
    emptyMessage
}: DocumentListProps) {
    const { t } = useI18n();
    if (documents.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-surface-200">
                <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-surface-100">
                    <FileText className="w-8 h-8 text-surface-200" />
                </div>
                <p className="text-surface-500 font-medium">{emptyMessage || t('noDocsYet')}</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
