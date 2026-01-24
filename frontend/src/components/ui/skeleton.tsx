'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('loading-shimmer rounded-md', className)} />
    );
}

export function CardSkeleton() {
    return (
        <div className="card p-6">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr>
            <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
            <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
            <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
            <td className="py-4 px-6"><Skeleton className="h-4 w-16" /></td>
        </tr>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="stat-card">
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
        </div>
    );
}
