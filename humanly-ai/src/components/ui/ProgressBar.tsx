import { motion } from 'framer-motion'

interface ProgressBarProps {
    value: number
    max?: number
    label?: string
    showPercentage?: boolean
    variant?: 'default' | 'gradient' | 'success'
    size?: 'sm' | 'md' | 'lg'
}

export const ProgressBar = ({
    value,
    max = 100,
    label,
    showPercentage = true,
    variant = 'gradient',
    size = 'md',
}: ProgressBarProps) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizes = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    }

    const variants = {
        default: 'bg-primary-500',
        gradient: 'bg-gradient-to-r from-primary-500 to-accent-500',
        success: 'bg-green-500',
    }

    return (
        <div className="w-full">
            {(label || showPercentage) && (
                <div className="flex justify-between mb-2 text-sm">
                    {label && <span className="text-surface-300">{label}</span>}
                    {showPercentage && (
                        <span className="text-surface-400 font-medium">{Math.round(percentage)}%</span>
                    )}
                </div>
            )}
            <div className={`w-full bg-surface-800 rounded-full overflow-hidden ${sizes[size]}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${variants[variant]}`}
                />
            </div>
        </div>
    )
}

export default ProgressBar
