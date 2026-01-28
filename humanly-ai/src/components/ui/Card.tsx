import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'hover' | 'glow'
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ children, variant = 'default', padding = 'md', className = '', ...props }, ref) => {
        const baseStyles = 'bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl shadow-xl shadow-black/20'

        const variants = {
            default: '',
            hover: 'transition-all duration-300 hover:bg-surface-800/60 hover:border-surface-700/50 hover:shadow-2xl hover:shadow-primary-500/10',
            glow: 'relative before:absolute before:inset-[-1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary-500/30 before:to-accent-500/30 before:opacity-0 before:transition-opacity hover:before:opacity-100',
        }

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        }

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'

// Animated card variant
export const AnimatedCard = forwardRef<HTMLDivElement, CardProps>(
    ({ children, ...props }, ref) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <Card ref={ref} {...props}>
                    {children}
                </Card>
            </motion.div>
        )
    }
)

AnimatedCard.displayName = 'AnimatedCard'

export default Card
