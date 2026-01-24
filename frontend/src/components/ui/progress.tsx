'use client';

import React from 'react';
import { cn, getMatchBgColor } from '@/lib/utils';

interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'match';
}

export function Progress({
    value,
    max = 100,
    className,
    showLabel = false,
    size = 'md',
    variant = 'default'
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
    };

    const barColor = variant === 'match'
        ? getMatchBgColor(percentage)
        : 'bg-gradient-to-r from-primary-500 to-primary-400';

    return (
        <div className={cn('w-full', className)}>
            <div className={cn('progress-bar', sizeStyles[size])}>
                <div
                    className={cn('progress-bar-fill', barColor)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-surface-500">{Math.round(percentage)}%</span>
                </div>
            )}
        </div>
    );
}

interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    showLabel?: boolean;
    variant?: 'default' | 'match';
}

export function CircularProgress({
    value,
    size = 80,
    strokeWidth = 8,
    className,
    showLabel = true,
    variant = 'default',
}: CircularProgressProps) {
    const percentage = Math.min(Math.max(value, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const getStrokeColor = () => {
        if (variant === 'match') {
            if (percentage >= 80) return '#10b981';
            if (percentage >= 60) return '#0ea5e9';
            if (percentage >= 40) return '#f59e0b';
            return '#ef4444';
        }
        return 'url(#gradient)';
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getStrokeColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold text-surface-900">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
        </div>
    );
}
