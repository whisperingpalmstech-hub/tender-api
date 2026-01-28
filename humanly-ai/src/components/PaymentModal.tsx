import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { useAppStore } from '@/store'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
    const { upgradeToPro } = useAppStore()
    const [loading, setLoading] = useState(false)

    const handleUpgrade = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500))

        upgradeToPro()
        setLoading(false)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Pro">
            <div className="space-y-6">
                {/* Plan Details */}
                <div className="p-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-primary-500 text-xs font-bold text-white rounded-bl-xl">
                        MOST POPULAR
                    </div>

                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="font-bold text-xl text-white">Pro Plan</h3>
                            <p className="text-surface-400 text-sm">Unlock limitless potential</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-white">$29</span>
                            <span className="text-surface-400 text-sm">/month</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[
                            'Unlimited document uploads',
                            'Unlimited characters per file',
                            'Priority AI processing',
                            'Advanced AI detection bypass',
                            '24/7 Priority support'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-surface-200">
                                <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mock Form */}
                <div className="space-y-4">
                    <Input
                        label="Card Number"
                        placeholder="4242 4242 4242 4242"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        }
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Expiry Date" placeholder="MM / YY" />
                        <Input label="CVC" placeholder="123" />
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full h-12 text-lg shadow-lg shadow-primary-500/25"
                    onClick={handleUpgrade}
                    isLoading={loading}
                >
                    Activate Pro Membership
                </Button>

                <p className="text-center text-xs text-surface-500">
                    Secured by Stripe. Cancel anytime.
                </p>
            </div>
        </Modal>
    )
}
