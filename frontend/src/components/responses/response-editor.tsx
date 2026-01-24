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
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { cn, getStatusLabel, getCategoryLabel, getCategoryColor } from '@/lib/utils';
import type { Response, Requirement } from '@/types';

interface ResponseEditorProps {
    response: Response;
    requirement?: Requirement;
    onSave: (text: string) => Promise<void>;
    onSubmit: () => Promise<void>;
    onApprove?: () => Promise<void>;
    onRegenerate?: () => Promise<void>;
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
    const [text, setText] = useState(response.response_text);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

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
            await onRegenerate();
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

    return (
        <Card padding="none" className="overflow-hidden">
            {/* Header */}
            <div
                className="p-4 border-b border-surface-200 cursor-pointer hover:bg-surface-50 
                   transition-colors flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {requirement && (
                        <Badge className={getCategoryColor(requirement.category)}>
                            {getCategoryLabel(requirement.category)}
                        </Badge>
                    )}
                    <span className="text-sm text-surface-900 break-words whitespace-normal">
                        {requirement?.requirement_text || 'General Response'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
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
                            'min-h-[200px] font-normal',
                            !isEditable && 'bg-surface-50'
                        )}
                        placeholder="Enter response text..."
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            {hasChanges && (
                                <button
                                    onClick={handleReset}
                                    className="text-sm text-surface-500 hover:text-surface-700 
                           flex items-center gap-1 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditable && (
                                <>
                                    {onRegenerate && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRegenerate}
                                            isLoading={isRegenerating}
                                            disabled={hasChanges} // Don't regenerate if unsaved changes
                                            title="Regenerate from Knowledge Base"
                                            leftIcon={<RotateCcw className="w-4 h-4" />}
                                        >
                                            Regenerate
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleSave}
                                        isLoading={isSaving}
                                        disabled={!hasChanges}
                                        leftIcon={<Save className="w-4 h-4" />}
                                    >
                                        Save
                                    </Button>
                                    {response.status === 'DRAFT' && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleSubmit}
                                            isLoading={isSubmitting}
                                            leftIcon={<Send className="w-4 h-4" />}
                                        >
                                            Submit for Review
                                        </Button>
                                    )}
                                </>
                            )}
                            {canApprove && response.status === 'PENDING_REVIEW' && onApprove && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleApprove}
                                    isLoading={isApproving}
                                    leftIcon={<Check className="w-4 h-4" />}
                                >
                                    Approve
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
    onRegenerate?: (id: string) => Promise<void>;
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
                    onRegenerate={onRegenerate ? () => onRegenerate(response.requirement_id!) : undefined}
                    canApprove={canApprove}
                />
            ))}
        </div>
    );
}
