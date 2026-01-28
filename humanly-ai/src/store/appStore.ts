import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserPlan {
    type: 'free' | 'pro'
    uploadsUsed: number
    maxUploads: number
    maxCharacters: number
}

interface AppState {
    // Language
    currentLanguage: string
    hasSelectedLanguage: boolean
    isOnboarded: boolean
    userNickname: string
    userProfession: string

    // User Plan
    userPlan: UserPlan

    // Document Processing
    isProcessing: boolean
    processingStep: string
    processingProgress: number

    // Original & Humanized Content
    originalContent: string
    humanizedContent: string
    originalAiScore: number
    humanizedAiScore: number

    // Avatar State
    avatarMessage: string
    isSpeaking: boolean

    // Actions
    setLanguage: (lang: string) => void
    setHasSelectedLanguage: (selected: boolean) => void
    setOnboarded: (onboarded: boolean) => void
    setUserDetails: (nickname: string, profession: string) => void
    setProcessing: (processing: boolean) => void
    setProcessingStep: (step: string) => void
    setProcessingProgress: (progress: number) => void
    setOriginalContent: (content: string) => void
    setHumanizedContent: (content: string) => void
    setAiScores: (original: number, humanized: number) => void
    setAvatarMessage: (message: string) => void
    setIsSpeaking: (speaking: boolean) => void
    incrementUploads: () => void
    resetContent: () => void
    upgradeToPro: () => void
    resetToFree: () => void
    canUpload: () => boolean
    getRemainingUploads: () => number
    resetAppState: () => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            currentLanguage: localStorage.getItem('lang') || 'en',
            hasSelectedLanguage: !!localStorage.getItem('lang'),
            isOnboarded: false,
            userNickname: '',
            userProfession: '',

            userPlan: {
                type: 'free',
                uploadsUsed: 0,
                maxUploads: 2,
                maxCharacters: 20000,
            },

            isProcessing: false,
            processingStep: '',
            processingProgress: 0,

            originalContent: '',
            humanizedContent: '',
            originalAiScore: 0,
            humanizedAiScore: 0,

            avatarMessage: '',
            isSpeaking: false,

            // Actions
            setLanguage: (lang) => {
                localStorage.setItem('lang', lang)
                set({ currentLanguage: lang, hasSelectedLanguage: true })
            },

            setHasSelectedLanguage: (selected) => set({ hasSelectedLanguage: selected }),

            setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

            setUserDetails: (nickname, profession) => set({
                userNickname: nickname,
                userProfession: profession
            }),

            setProcessing: (processing) => set({ isProcessing: processing }),

            setProcessingStep: (step) => set({ processingStep: step }),

            setProcessingProgress: (progress) => set({ processingProgress: progress }),

            setOriginalContent: (content) => set({ originalContent: content }),

            setHumanizedContent: (content) => set({ humanizedContent: content }),

            setAiScores: (original, humanized) => set({
                originalAiScore: original,
                humanizedAiScore: humanized
            }),

            setAvatarMessage: (message) => set({ avatarMessage: message }),

            setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

            incrementUploads: () => {
                const { userPlan } = get()
                if (userPlan.type === 'free') {
                    set({
                        userPlan: {
                            ...userPlan,
                            uploadsUsed: userPlan.uploadsUsed + 1,
                        }
                    })
                }
            },

            resetContent: () => set({
                originalContent: '',
                humanizedContent: '',
                originalAiScore: 0,
                humanizedAiScore: 0,
                processingProgress: 0,
                processingStep: '',
            }),

            upgradeToPro: () => set({
                userPlan: {
                    type: 'pro',
                    uploadsUsed: 0,
                    maxUploads: Infinity,
                    maxCharacters: Infinity,
                }
            }),

            resetToFree: () => set({
                userPlan: {
                    type: 'free',
                    uploadsUsed: 0,
                    maxUploads: 2,
                    maxCharacters: 20000,
                }
            }),

            canUpload: () => {
                const { userPlan } = get()
                if (userPlan.type === 'pro') return true
                return userPlan.uploadsUsed < userPlan.maxUploads
            },

            getRemainingUploads: () => {
                const { userPlan } = get()
                if (userPlan.type === 'pro') return Infinity
                return userPlan.maxUploads - userPlan.uploadsUsed
            },

            resetAppState: () => set({
                isOnboarded: false,
                userNickname: '',
                userProfession: '',
                userPlan: {
                    type: 'free',
                    uploadsUsed: 0,
                    maxUploads: 2,
                    maxCharacters: 20000,
                },
                originalContent: '',
                humanizedContent: '',
                originalAiScore: 0,
                humanizedAiScore: 0,
            }),
        }),
        {
            name: 'app-storage',
            partialize: (state) => ({
                currentLanguage: state.currentLanguage,
                hasSelectedLanguage: state.hasSelectedLanguage,
                isOnboarded: state.isOnboarded,
                userNickname: state.userNickname,
                userProfession: state.userProfession,
                userPlan: state.userPlan,
            }),
        }
    )
)
