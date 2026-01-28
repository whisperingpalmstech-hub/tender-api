import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function APIPage() {
    useTranslation()

    const endpoints = [
        {
            method: 'POST',
            path: '/api/humanize',
            description: 'Humanize raw text directly.',
            payload: `{
  "text": "Your AI content here...",
  "style": "professional",
  "mode": "balanced",
  "max_ai_percentage": 30
}`,
        },
        {
            method: 'POST',
            path: '/api/humanize/file',
            description: 'Upload a file (PDF, DOCX, TXT) to humanize content.',
            payload: 'multipart/form-data: { file: File, style: string, ... }',
        }
    ]

    return (
        <div className="min-h-screen pt-24 pb-20 px-6">
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="text-xl font-display font-bold text-white">HumanlyAI</span>
                        </Link>
                        <div className="flex items-center gap-2 md:gap-4">
                            <LanguageSwitcher />
                            <Link to="/api-docs">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                    API & Devs
                                </Button>
                            </Link>
                            <Link to="/#pricing">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                    Pricing
                                </Button>
                            </Link>
                            <Link to="/auth/login">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/auth/signup">
                                <Button variant="primary" size="sm">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto mt-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                >
                    <h1 className="text-4xl lg:text-6xl font-display font-bold mb-6">
                        Developer <span className="text-gradient">API</span>
                    </h1>
                    <p className="text-xl text-surface-300 max-w-2xl mx-auto leading-relaxed">
                        Integrate HumanlyAI directly into your applications. Our robust API allows for high-volume content humanization at scale.
                    </p>
                </motion.div>

                <div className="grid gap-12">
                    {/* Authentication Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            Authentication
                        </h2>
                        <Card padding="lg">
                            <p className="text-surface-300 mb-4">
                                All API requests require a Bearer token in the header. You can find your API key in your Pro dashboard settings.
                            </p>
                            <div className="bg-surface-950 p-4 rounded-xl border border-surface-800 font-mono text-sm">
                                <span className="text-primary-400">Authorization:</span> Bearer YOUR_API_KEY
                            </div>
                        </Card>
                    </motion.section>

                    {/* Endpoints Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            Endpoints
                        </h2>
                        <div className="space-y-8">
                            {endpoints.map((ep, idx) => (
                                <Card key={idx} padding="lg" variant="hover">
                                    <div className="flex flex-wrap items-center gap-4 mb-4">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ep.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {ep.method}
                                        </span>
                                        <code className="text-surface-200 bg-surface-800 px-3 py-1 rounded-lg">
                                            {ep.path}
                                        </code>
                                    </div>
                                    <p className="text-surface-400 mb-4">{ep.description}</p>
                                    <div className="bg-surface-950 p-4 rounded-xl border border-surface-800">
                                        <p className="text-xs text-surface-500 mb-2 uppercase tracking-widest font-bold">Request Body Example</p>
                                        <pre className="font-mono text-sm text-surface-200 overflow-x-auto">
                                            {ep.payload}
                                        </pre>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </motion.section>

                    {/* SDK Section Placeholder */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Card className="bg-gradient-to-br from-primary-900/40 to-accent-900/40 border-primary-500/30">
                            <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-4">Ready for the Pro API?</h2>
                                    <p className="text-surface-300 mb-6 font-display italic">
                                        "Integrating HumanlyAI reduced our content production time by 70% while improving our SEO performance significantly."
                                    </p>
                                    <Link to="/auth/signup">
                                        <Button variant="primary">Get API Key Now</Button>
                                    </Link>
                                </div>
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse-soft">
                                    <span className="text-5xl font-bold text-white">API</span>
                                </div>
                            </div>
                        </Card>
                    </motion.section>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-20 py-12 border-t border-surface-800 text-center">
                <p className="text-surface-500 text-sm">
                    © 2024 HumanlyAI. Built for developers by creators.
                </p>
            </footer>
        </div>
    )
}

export default APIPage
