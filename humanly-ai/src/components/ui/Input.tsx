import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { motion } from 'framer-motion'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, rightIcon, className = '', type = 'text', ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false)
        const isPassword = type === 'password'

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        type={isPassword && showPassword ? 'text' : type}
                        className={`
              w-full px-4 py-3 bg-surface-900/80 border border-surface-700 rounded-xl 
              text-surface-100 placeholder-surface-500 
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 
              transition-all duration-200
              ${icon ? 'pl-12' : ''}
              ${rightIcon || isPassword ? 'pr-12' : ''}
              ${error ? 'border-red-500 focus:ring-red-500/50' : ''}
              ${className}
            `}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-300 transition-colors"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    )}
                    {rightIcon && !isPassword && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-400"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input
