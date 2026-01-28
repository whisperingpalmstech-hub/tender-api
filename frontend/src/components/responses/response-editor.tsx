'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import {
    Save,
    Check,
    Send,
    RotateCcw,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { cn, getStatusLabel, getCategoryLabel, getCategoryColor } from '@/lib/utils';
import type { Response, Requirement } from '@/types';

import { useI18n } from '@/lib/i18n';

interface ResponseEditorProps {
    response: Response;
    requirement?: Requirement;
    onSave: (text: string) => Promise<void>;
    onSubmit: () => Promise<void>;
    onApprove?: () => Promise<void>;
    onRegenerate?: (mode: string, tone: string) => Promise<void>;
    canApprove?: boolean;
}

export function ResponseEditor({
    response,
    requirement,
    onSave,
    onSubmit,
    onApprove,
    onRegenerate,
    canApprove = false,
}: ResponseEditorProps) {
    const { t, language } = useI18n();
    const [text, setText] = useState(response.response_text);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [mode, setMode] = useState('balanced');
    const [tone, setTone] = useState('professional');

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        setHasChanges(e.target.value !== response.response_text);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(text);
            setHasChanges(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRegenerate = async () => {
        if (!onRegenerate) return;
        setIsRegenerating(true);
        try {
            await onRegenerate(mode, tone);
            // Text update handled by parent refreshing data
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (hasChanges) {
                await onSave(text);
            }
            await onSubmit();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        if (!onApprove) return;
        setIsApproving(true);
        try {
            await onApprove();
        } finally {
            setIsApproving(false);
        }
    };

    const handleReset = () => {
        setText(response.response_text);
        setHasChanges(false);
    };

    // Update local text when prop changes (e.g. after regeneration)
    React.useEffect(() => {
        if (!hasChanges) {
            setText(response.response_text);
        }
    }, [response.response_text, hasChanges]);

    const isEditable = response.status === 'DRAFT' || response.status === 'PENDING_REVIEW';
    const statusVariant = response.status === 'APPROVED' ? 'success'
        : response.status === 'PENDING_REVIEW' ? 'warning'
            : 'neutral';

    const isRtl = language === 'ar';

    return (
        <Card padding="none" className="overflow-hidden border-surface-200">
            {/* Header */}
            <div
                className={cn(
                    "p-4 border-b border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors flex items-center justify-between",
                    isRtl && "flex-row-reverse text-right"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={cn("flex items-center gap-3 min-w-0", isRtl && "flex-row-reverse text-right")}>
                    {requirement && (
                        <Badge className={getCategoryColor(requirement.category)}>
                            {(requirement.category as any).toLowerCase() === 'technical' ? t('category') + ': ' + t('balanced') : getCategoryLabel(requirement.category)}
                        </Badge>
                    )}
                    <span className="text-sm font-medium text-surface-900 break-words whitespace-normal leading-relaxed">
                        {requirement?.requirement_text || 'General Response'}
                    </span>
                </div>
                <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                    <Badge variant={statusVariant}>
                        {getStatusLabel(response.status)}
                    </Badge>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-surface-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-surface-400" />
                    )}
                </div>
            </div>

            {/* Editor */}
            {isExpanded && (
                <div className="p-4">
                    <Textarea
                        value={text}
                        onChange={handleTextChange}
                        disabled={!isEditable}
                        className={cn(
                            'min-h-[220px] font-normal resize-none focus:ring-primary-500/10 leading-relaxed',
                            !isEditable && 'bg-surface-50',
                            isRtl && "text-right"
                        )}
                        dir={isRtl ? 'rtl' : 'ltr'}
                        placeholder={isRtl ? 'أدخل نص الرد...' : 'Enter response text...'}
                    />

                    {/* Actions & Controls */}
                    <div className={cn(
                        "flex items-center justify-between gap-4 mt-6 pt-4 border-t border-surface-100",
                        isRtl && "flex-row-reverse"
                    )}>
                        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                            {isEditable && (
                                <>
                                    {onRegenerate && (
                                        <div className={cn(
                                            "flex items-center bg-surface-50/50 p-1 rounded-xl border border-surface-200 shadow-sm transition-all hover:border-surface-300",
                                            isRtl && "flex-row-reverse"
                                        )}>
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 border-surface-200",
                                                isRtl ? "border-l" : "border-r"
                                            )}>
                                                <div className={cn("flex flex-col", isRtl && "text-right")}>
                                                    <span className="text-[8px] uppercase font-black text-surface-400 tracking-wider font-mono">{t('mode')}</span>
                                                    <select
                                                        value={mode}
                                                        onChange={(e) => setMode(e.target.value)}
                                                        className="text-xs bg-transparent border-none p-0 pr-4 focus:ring-0 cursor-pointer font-bold text-surface-800"
                                                    >
                                                        <option value="light">{t('light')}</option>
                                                        <option value="balanced">{t('balanced')}</option>
                                                        <option value="aggressive">{t('aggressive')}</option>
                                                        <option value="creative">{t('creative')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3">
                                                <div className={cn("flex flex-col", isRtl && "text-right")}>
                                                    <span className="text-[8px] uppercase font-black text-surface-400 tracking-wider font-mono">{t('tone')}</span>
                                                    <select
                                                        value={tone}
                                                        onChange={(e) => setTone(e.target.value)}
                                                        className="text-xs bg-transparent border-none p-0 pr-4 focus:ring-0 cursor-pointer font-bold text-surface-800"
                                                    >
                                                        <option value="professional">{t('professional')}</option>
                                                        <option value="casual">{t('casual')}</option>
                                                        <option value="formal">{t('formal')}</option>
                                                        <option value="simple">{t('simple')}</option>
                                                        <option value="academic">{t('academic')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleRegenerate}
                                                isLoading={isRegenerating}
                                                disabled={hasChanges}
                                                className="h-8 px-4 rounded-lg ml-1 shadow-sm font-bold bg-primary-600 hover:bg-primary-700"
                                                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                                            >
                                                {t('applySettings')}
                                            </Button>
                                        </div>
                                    )}

                                    <div className={cn("flex items-center gap-2 ml-1", isRtl && "flex-row-reverse")}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleSave}
                                            isLoading={isSaving}
                                            disabled={!hasChanges}
                                            title={t('save')}
                                            className="h-8 px-3 rounded-lg bg-white border-surface-200"
                                        >
                                            <Save className="w-4 h-4" />
                                        </Button>

                                        {hasChanges && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleReset}
                                                className="h-8 px-2 text-surface-400 hover:text-red-500 hover:bg-red-50"
                                                title="Reset"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                        )}

                                        <div className="w-px h-6 bg-surface-200 mx-1" />

                                        {response.status === 'DRAFT' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleSubmit}
                                                isLoading={isSubmitting}
                                                leftIcon={<Send className="w-4 h-4" />}
                                                className="h-8 px-5 rounded-lg font-bold shadow-md shadow-primary-500/10"
                                            >
                                                {t('submit')}
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                            {canApprove && response.status === 'PENDING_REVIEW' && onApprove && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleApprove}
                                    isLoading={isApproving}
                                    leftIcon={<Check className="w-4 h-4" />}
                                    className="h-9 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10"
                                >
                                    Approve Response
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

interface ResponseListProps {
    responses: Response[];
    requirements: Requirement[];
    onSave: (id: string, text: string) => Promise<void>;
    onSubmit: (id: string) => Promise<void>;
    onApprove?: (id: string) => Promise<void>;
    onRegenerate?: (requirementId: string, mode: string, tone: string) => Promise<void>;
    canApprove?: boolean;
}

export function ResponseList({
    responses,
    requirements,
    onSave,
    onSubmit,
    onApprove,
    onRegenerate,
    canApprove = false,
}: ResponseListProps) {
    // Debug: Log what we're working with
    console.log("[ResponseList] Requirements count:", requirements.length);
    console.log("[ResponseList] Responses count:", responses.length);
    if (responses.length > 0) {
        console.log("[ResponseList] First response requirement_id:", responses[0].requirement_id);
    }
    if (requirements.length > 0) {
        console.log("[ResponseList] First requirement id:", requirements[0].id);
    }

    const getRequirement = (requirementId: string | null) => {
        if (!requirementId) {
            console.log("[ResponseList] No requirement_id provided");
            return undefined;
        }
        const found = requirements.find((r) => r.id === requirementId);
        if (!found) {
            console.log("[ResponseList] Requirement NOT FOUND for ID:", requirementId);
        }
        return found;
    };

    return (
        <div className="space-y-4">
            {responses.map((response) => (
                <ResponseEditor
                    key={`${response.id}-v${response.version}`}
                    response={response}
                    requirement={getRequirement(response.requirement_id)}
                    onSave={(text) => onSave(response.id, text)}
                    onSubmit={() => onSubmit(response.id)}
                    onApprove={onApprove ? () => onApprove(response.id) : undefined}
                    onRegenerate={onRegenerate ? (mode, tone) => onRegenerate(response.requirement_id!, mode, tone) : undefined}
                    canApprove={canApprove}
                />
            ))}
        </div>
    );
}
