import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { useAuthStore, useAppStore } from '@/store'
import { useAvatar } from '@/hooks'
import { validateFile, humanizeDocument } from '@/lib'
import { Avatar } from '@/components/Avatar'
import { PaymentModal } from '@/components/PaymentModal'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, Card, ProgressBar } from '@/components/ui'

export function Dashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { user, signOut } = useAuthStore()
    const {
        currentLanguage,
        userPlan,
        isProcessing,
        processingStep,
        processingProgress,
        humanizedContent,
        originalAiScore,
        humanizedAiScore,
        setProcessing,
        setProcessingStep,
        setProcessingProgress,
        setHumanizedContent,
        setAiScores,
        incrementUploads,
        canUpload,
        getRemainingUploads,
        resetContent,
        userNickname,
        userProfession,
    } = useAppStore()

    const avatar = useAvatar()
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [textInput, setTextInput] = useState('')
    const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    // Humanization Options
    const [style, setStyle] = useState<'professional' | 'casual' | 'formal' | 'simple' | 'academic'>('professional')
    const [mode, setMode] = useState<'light' | 'balanced' | 'aggressive' | 'creative'>('balanced')
    const [maxAttempts, setMaxAttempts] = useState(10)
    const [maxAiPercentage, setMaxAiPercentage] = useState(30)

    // Greet user on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            avatar.speakWelcome()
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    // Narrate instruction when language changes
    const lastLanguageRef = useRef(currentLanguage)

    useEffect(() => {
        if (currentLanguage !== lastLanguageRef.current) {
            lastLanguageRef.current = currentLanguage

            // Give a small delay for voice loading/switching
            const timer = setTimeout(() => {
                avatar.speakWelcome()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [currentLanguage, avatar])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setError('')

        // Check upload limit
        if (!canUpload()) {
            setError(t('errors.uploadLimit'))
            avatar.speakLimitReached()
            return
        }

        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
            setError(t(`errors.${validation.error}`))
            return
        }

        setUploadedFile(file)
        avatar.speakFileReceived()
    }, [canUpload, userPlan.maxCharacters, t, avatar])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        maxFiles: 1,
        disabled: isProcessing,
    })

    const handleProcess = async () => {
        if (activeTab === 'upload' && !uploadedFile) return
        if (activeTab === 'text' && !textInput.trim()) return

        setProcessing(true)
        resetContent()

        try {
            // Simulate processing steps with avatar narration
            const steps: Array<{ key: 'analyzing' | 'reducing' | 'improving' | 'enhancing'; progress: number }> = [
                { key: 'analyzing', progress: 25 },
                { key: 'reducing', progress: 50 },
                { key: 'improving', progress: 75 },
                { key: 'enhancing', progress: 90 },
            ]

            for (const step of steps) {
                setProcessingStep(t(`avatar.processing.${step.key}`))
                setProcessingProgress(step.progress)
                avatar.speakProcessingStep(step.key)
                await new Promise(resolve => setTimeout(resolve, 2500))
            }

            // Make actual API call
            const result = await humanizeDocument(
                activeTab === 'upload' ? uploadedFile : null,
                activeTab === 'text' ? textInput : undefined,
                {
                    style,
                    mode,
                    maxAttempts,
                    maxAiPercentage
                }
            )

            setHumanizedContent(result.humanizedText)
            setAiScores(result.originalAiScore, result.humanizedAiScore)
            setProcessingProgress(100)
            incrementUploads()

            avatar.speakSuccess()
        } catch (err) {
            setError(t('errors.processing'))
            avatar.speakError()
        } finally {
            setProcessing(false)
            setProcessingStep('')
        }
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(humanizedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = (format: 'txt' | 'doc' | 'pdf') => {
        const blob = new Blob([humanizedContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `humanized-content.${format}`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass border-b border-surface-800/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="text-xl font-display font-bold text-white">HumanlyAI</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/api-docs">
                                <Button variant="ghost" size="sm" className="hidden md:flex">
                                    API Docs
                                </Button>
                            </Link>
                            <LanguageSwitcher />
                            {/* Plan Badge */}
                            <div className="px-3 py-1.5 rounded-full bg-surface-800 border border-surface-700 text-sm">
                                {userPlan.type === 'pro' ? (
                                    <span className="text-primary-400">{t('dashboard.plan.pro')}</span>
                                ) : (
                                    <span className="text-surface-300">
                                        {t('dashboard.plan.free')} • {getRemainingUploads()} {t('dashboard.upload.uploadsRemaining')}
                                    </span>
                                )}
                                {userPlan.type === 'free' && (
                                    <Button variant="secondary" size="sm" onClick={() => setShowPaymentModal(true)}>
                                        Upgrade
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-surface-300 hidden sm:block">
                                    {t('dashboard.greeting')}, {userNickname || user?.user_metadata?.name || user?.email?.split('@')[0]}
                                    {userProfession && <span className="text-xs text-surface-500 ml-2">({userProfession})</span>}
                                </span>
                                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - 3 Column Layout */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Column - Avatar */}
                    <div className="lg:col-span-3">
                        <Card className="sticky top-24" padding="none">
                            <div className="p-4 border-b border-surface-800">
                                <h2 className="font-semibold text-lg">AI Assistant</h2>
                            </div>
                            <div className="h-[350px]">
                                <Avatar className="h-full" showMessage={false} />
                            </div>
                        </Card>
                    </div>

                    {/* Center Column - Upload */}
                    <div className="lg:col-span-5">
                        <Card padding="lg">
                            <h2 className="text-xl font-semibold mb-6">{t('dashboard.upload.title')}</h2>

                            {/* Tabs */}
                            <div className="flex p-1 mb-6 bg-surface-800/50 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'upload'
                                        ? 'bg-surface-700 text-white shadow-sm'
                                        : 'text-surface-400 hover:text-surface-200'
                                        }`}
                                >
                                    Upload File
                                </button>
                                <button
                                    onClick={() => setActiveTab('text')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'text'
                                        ? 'bg-surface-700 text-white shadow-sm'
                                        : 'text-surface-400 hover:text-surface-200'
                                        }`}
                                >
                                    Paste Text
                                </button>
                            </div>

                            {/* Content Area */}
                            {activeTab === 'upload' ? (
                                <>
                                    {/* Dropzone */}
                                    <div
                                        {...getRootProps()}
                                        className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragActive
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-surface-700 hover:border-surface-600 hover:bg-surface-800/50'
                                            }
                  ${isProcessing ? 'pointer-events-none opacity-60' : ''}
                `}
                                    >
                                        <input {...getInputProps()} />

                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-800 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>

                                        <p className="text-surface-300 mb-2">{t('dashboard.upload.subtitle')}</p>
                                        <p className="text-sm text-surface-500">{t('dashboard.upload.formats')}</p>
                                    </div>

                                    {/* Uploaded File */}
                                    {uploadedFile && !isProcessing && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-4 bg-surface-800/50 rounded-xl flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium truncate max-w-[200px]">{uploadedFile.name}</p>
                                                    <p className="text-sm text-surface-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <Button variant="primary" onClick={handleProcess}>
                                                Humanize
                                            </Button>
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <textarea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Paste your text here..."
                                        className="w-full h-64 p-4 bg-surface-800/30 border border-surface-700 rounded-xl 
                                                 text-surface-100 placeholder-surface-500 resize-none
                                                 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 
                                                 transition-all duration-200 mb-4"
                                        disabled={isProcessing}
                                    />
                                    <div className="flex justify-between items-center mb-4 text-sm">
                                        <span className="text-surface-500">
                                            Characters: <span className={textInput.length > userPlan.maxCharacters ? 'text-red-400 font-bold' : 'text-surface-300'}>{textInput.length}</span> / {userPlan.maxCharacters === Infinity ? '∞' : userPlan.maxCharacters}
                                        </span>
                                        <Button
                                            variant="primary"
                                            onClick={handleProcess}
                                            disabled={!textInput.trim() || isProcessing || textInput.length > userPlan.maxCharacters}
                                        >
                                            Humanize Text
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Processing State */}
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center animate-pulse">
                                            <svg className="w-4 h-4 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        </div>
                                        <span className="text-surface-300">{processingStep || t('dashboard.upload.processing')}</span>
                                    </div>
                                    <ProgressBar value={processingProgress} />
                                </motion.div>
                            )}

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-4"
                                >
                                    <span className="text-red-400">{error}</span>
                                    {error === t('errors.uploadLimit') && (
                                        <Button size="sm" variant="secondary" onClick={() => setShowPaymentModal(true)}>
                                            Upgrade now
                                        </Button>
                                    )}
                                </motion.div>
                            )}
                        </Card>

                        {/* Settings Card */}
                        <Card padding="lg" className="mt-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                Humanization Settings
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tone/Style */}
                                <div>
                                    <label className="label">Writing Tone</label>
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value as any)}
                                        className="input"
                                        disabled={isProcessing}
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="casual">Casual</option>
                                        <option value="formal">Formal</option>
                                        <option value="simple">Simple / Clear</option>
                                        <option value="academic">Academic</option>
                                    </select>
                                </div>

                                {/* Creative Mode */}
                                <div>
                                    <label className="label">Humanization Intensity</label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as any)}
                                        className="input"
                                        disabled={isProcessing}
                                    >
                                        <option value="light">Light (Fast)</option>
                                        <option value="balanced">Balanced (Default)</option>
                                        <option value="aggressive">Aggressive (High Humanize)</option>
                                        <option value="creative">Creative (Natural Flow)</option>
                                    </select>
                                </div>

                                {/* Max AI Score */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="label mb-0">Max AI Score Target</label>
                                        <span className="text-sm font-medium text-primary-400">{maxAiPercentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="5"
                                        value={maxAiPercentage}
                                        onChange={(e) => setMaxAiPercentage(parseInt(e.target.value))}
                                        className="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                        disabled={isProcessing}
                                    />
                                    <p className="text-[10px] text-surface-500 mt-2">Target humanization threshold. Lower is more human.</p>
                                </div>

                                {/* Max Attempts/Loops */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="label mb-0">Refinement Loops</label>
                                        <span className="text-sm font-medium text-accent-400">{maxAttempts} passes</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        step="1"
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                                        className="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-accent-500"
                                        disabled={isProcessing}
                                    />
                                    <p className="text-[10px] text-surface-500 mt-2">Number of AI rewrite cycles to reach target.</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Output */}
                    <div className="lg:col-span-4">
                        <Card padding="lg">
                            <h2 className="text-xl font-semibold mb-6">{t('dashboard.output.title')}</h2>

                            {humanizedContent ? (
                                <>
                                    {/* AI Score Comparison */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-surface-800/50 rounded-xl text-center">
                                            <p className="text-sm text-surface-400 mb-1">{t('dashboard.output.aiScore.before')}</p>
                                            <p className="text-2xl font-bold text-red-400">{originalAiScore}%</p>
                                        </div>
                                        <div className="p-4 bg-surface-800/50 rounded-xl text-center">
                                            <p className="text-sm text-surface-400 mb-1">{t('dashboard.output.aiScore.after')}</p>
                                            <p className="text-2xl font-bold text-green-400">{humanizedAiScore}%</p>
                                        </div>
                                    </div>

                                    {/* Reduction Badge */}
                                    <div className="mb-6 text-center">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            {originalAiScore - humanizedAiScore}% {t('dashboard.output.aiScore.reduction')}
                                        </span>
                                    </div>

                                    {/* Content - Editable Output */}
                                    <div className="mb-4">
                                        <textarea
                                            value={humanizedContent}
                                            onChange={(e) => setHumanizedContent(e.target.value)}
                                            className="w-full h-[300px] p-4 bg-surface-800/50 border border-surface-700/50 rounded-xl 
                                                     text-surface-200 text-sm leading-relaxed resize-none
                                                     focus:outline-none focus:ring-1 focus:ring-primary-500/30
                                                     custom-scrollbar"
                                            placeholder="Humanized content will appear here..."
                                        />
                                        <div className="mt-2 text-xs text-surface-500 text-right">
                                            Characters: <span className="text-surface-400">{humanizedContent.length}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="secondary"
                                            onClick={handleCopy}
                                            className="flex-1"
                                        >
                                            {copied ? t('dashboard.output.copied') : t('dashboard.output.copy')}
                                        </Button>
                                        <div className="relative group">
                                            <Button variant="primary" className="flex-1">
                                                {t('dashboard.output.download')}
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </Button>
                                            <div className="absolute top-full mt-2 left-0 right-0 bg-surface-800 border border-surface-700 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                <button onClick={() => handleDownload('txt')} className="w-full px-4 py-2 text-left hover:bg-surface-700 transition-colors">TXT</button>
                                                <button onClick={() => handleDownload('doc')} className="w-full px-4 py-2 text-left hover:bg-surface-700 transition-colors">DOC</button>
                                                <button onClick={() => handleDownload('pdf')} className="w-full px-4 py-2 text-left hover:bg-surface-700 transition-colors">PDF</button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-surface-400">{t('dashboard.output.empty')}</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

            <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
        </div>
    )
}

export default Dashboard
