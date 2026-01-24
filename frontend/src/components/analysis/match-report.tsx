'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, getCategoryLabel, getCategoryColor, getMatchColor } from '@/lib/utils';
import type { MatchReport, RequirementWithMatch } from '@/types';

interface MatchSummaryCardProps {
    label: string;
    value: number;
    total?: number;
    matched?: number;
}

function MatchSummaryCard({ label, value, total, matched }: MatchSummaryCardProps) {
    return (
        <Card className="p-5 text-center">
            <CircularProgress value={value} variant="match" size={90} />
            <h4 className="font-medium text-surface-900 mt-3">{label}</h4>
            {total !== undefined && matched !== undefined && (
                <p className="text-sm text-surface-500 mt-1">
                    {matched} of {total} matched
                </p>
            )}
        </Card>
    );
}

interface MatchReportViewProps {
    report: MatchReport;
}

export function MatchReportView({ report }: MatchReportViewProps) {
    const { summary, breakdown, requirements } = report;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MatchSummaryCard
                    label="Eligibility"
                    value={summary.eligibility_match}
                    total={breakdown.eligibility.total}
                    matched={breakdown.eligibility.matched}
                />
                <MatchSummaryCard
                    label="Technical"
                    value={summary.technical_match}
                    total={breakdown.technical.total}
                    matched={breakdown.technical.matched}
                />
                <MatchSummaryCard
                    label="Compliance"
                    value={summary.compliance_match}
                    total={breakdown.compliance.total}
                    matched={breakdown.compliance.matched}
                />
                <Card className="p-5 text-center bg-gradient-to-br from-primary-500 to-primary-600">
                    <CircularProgress
                        value={summary.overall_match}
                        size={90}
                        className="[&_circle:last-child]:stroke-white [&_span]:text-white"
                    />
                    <h4 className="font-medium text-white mt-3">Overall Match</h4>
                </Card>
            </div>

            {/* Requirements List */}
            <Card padding="none">
                <div className="p-4 border-b border-surface-200">
                    <h3 className="font-semibold text-surface-900">Requirements Breakdown</h3>
                    <p className="text-sm text-surface-500 mt-1">
                        Detailed matching analysis for each requirement
                    </p>
                </div>
                <div className="divide-y divide-surface-100">
                    {requirements.map((req) => (
                        <RequirementMatchRow key={req.id} requirement={req} />
                    ))}
                </div>
            </Card>
        </div>
    );
}

interface RequirementMatchRowProps {
    requirement: RequirementWithMatch;
}

function RequirementMatchRow({ requirement }: RequirementMatchRowProps) {
    const matchPercentage = requirement.match_percentage || 0;

    return (
        <div className="p-4 hover:bg-surface-50 transition-colors">
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge className={getCategoryColor(requirement.category)}>
                            {getCategoryLabel(requirement.category)}
                        </Badge>
                        {requirement.page_number && (
                            <span className="text-xs text-surface-400">
                                Page {requirement.page_number}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-surface-900 line-clamp-2">
                        {requirement.requirement_text}
                    </p>
                    {requirement.matched_content && (
                        <p className="text-xs text-surface-500 mt-2 line-clamp-1">
                            Matched: {requirement.matched_content}
                        </p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <span className={cn(
                        'text-lg font-semibold',
                        getMatchColor(matchPercentage)
                    )}>
                        {Math.round(matchPercentage)}%
                    </span>
                    <p className="text-xs text-surface-500">match</p>
                </div>
            </div>
        </div>
    );
}
