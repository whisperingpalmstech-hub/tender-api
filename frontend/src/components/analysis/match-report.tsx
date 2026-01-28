'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, getCategoryLabel, getCategoryColor, getMatchColor } from '@/lib/utils';
import type { MatchReport, RequirementWithMatch } from '@/types';
import { useI18n } from '@/lib/i18n';

interface MatchSummaryCardProps {
    label: string;
    value: number;
    total?: number;
    matched?: number;
}

function MatchSummaryCard({ label, value, total, matched }: MatchSummaryCardProps) {
    const { t, language } = useI18n();
    const isRtl = language === 'ar';

    return (
        <Card className="p-5 text-center hover:shadow-lg transition-shadow border-surface-200 group">
            <CircularProgress value={value} variant="match" size={90} className="mx-auto transition-transform group-hover:scale-110 duration-300" />
            <h4 className="font-bold text-surface-900 mt-4 tracking-tight">{label}</h4>
            {total !== undefined && matched !== undefined && (
                <p className="text-xs font-medium text-surface-500 mt-2 font-mono">
                    {isRtl
                        ? `${matched} من ${total} تمت مطابقتها`
                        : `${matched} ${t('ofMatched')} ${total}`}
                </p>
            )}
        </Card>
    );
}

interface MatchReportViewProps {
    report: MatchReport;
}

export function MatchReportView({ report }: MatchReportViewProps) {
    const { t, language } = useI18n();
    const isRtl = language === 'ar';
    const { summary, breakdown, requirements } = report;

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-6", isRtl && "flex-row-reverse")}>
                <MatchSummaryCard
                    label={t('eligibility')}
                    value={summary.eligibility_match}
                    total={breakdown.eligibility.total}
                    matched={breakdown.eligibility.matched}
                />
                <MatchSummaryCard
                    label={t('technical')}
                    value={summary.technical_match}
                    total={breakdown.technical.total}
                    matched={breakdown.technical.matched}
                />
                <MatchSummaryCard
                    label={t('compliance')}
                    value={summary.compliance_match}
                    total={breakdown.compliance.total}
                    matched={breakdown.compliance.matched}
                />
                <Card className="p-5 text-center bg-gradient-to-br from-primary-600 to-primary-700 shadow-xl shadow-primary-500/20 border-none group">
                    <CircularProgress
                        value={summary.overall_match}
                        size={90}
                        className="mx-auto [&_circle:last-child]:stroke-white [&_span]:text-white transition-transform group-hover:scale-110 duration-300"
                    />
                    <h4 className="font-black text-white mt-4 tracking-tight uppercase text-xs opacity-90">{t('overallMatch')}</h4>
                    <p className="text-white text-2xl font-black mt-1">{Math.round(summary.overall_match)}%</p>
                </Card>
            </div>

            {/* Requirements List */}
            <Card padding="none" className="overflow-hidden border-surface-200 shadow-sm rounded-3xl">
                <div className={cn("p-6 border-b border-surface-100 bg-surface-50/50", isRtl && "text-right")}>
                    <h3 className="font-black text-surface-900 tracking-tight text-lg">{t('requirementsBreakdown')}</h3>
                    <p className="text-sm font-medium text-surface-500 mt-1">
                        {t('detailedAnalysis')}
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
    const { t, language } = useI18n();
    const isRtl = language === 'ar';
    const matchPercentage = requirement.match_percentage || 0;

    return (
        <div className="p-6 hover:bg-surface-50 transition-all duration-200 group">
            <div className={cn("flex items-start gap-6", isRtl && "flex-row-reverse")}>
                <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                    <div className={cn("flex items-center gap-2 mb-3", isRtl && "flex-row-reverse")}>
                        <Badge className={cn("rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider", getCategoryColor(requirement.category))}>
                            {t(getCategoryLabel(requirement.category) as any)}
                        </Badge>
                        {requirement.page_number && (
                            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest bg-surface-100 px-2 py-0.5 rounded-lg">
                                {t('page')} {requirement.page_number}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-bold text-surface-900 leading-relaxed group-hover:text-primary-700 transition-colors">
                        {requirement.requirement_text}
                    </p>
                    {requirement.matched_content && (
                        <div className={cn("mt-4 p-3 rounded-xl bg-surface-100/50 border border-surface-200/50 relative", isRtl && "text-right")}>
                            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5">{t('matchedContent')}</p>
                            <p className="text-xs text-surface-600 font-medium italic leading-relaxed">
                                "{requirement.matched_content}"
                            </p>
                        </div>
                    )}
                </div>
                <div className={cn("text-right shrink-0 pt-1", isRtl && "text-left")}>
                    <div className={cn(
                        'text-2xl font-black font-mono tracking-tighter mb-1',
                        getMatchColor(matchPercentage)
                    )}>
                        {Math.round(matchPercentage)}%
                    </div>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{t('percentageMatch')}</p>
                </div>
            </div>
        </div>
    );
}
