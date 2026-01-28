import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpeech, Viseme } from './useSpeech'

export const useAvatar = () => {
    const { t } = useTranslation()

    const handleViseme = useCallback((viseme: Viseme) => {
        // This will be used by the 3D avatar for lip sync
        // The viseme value is sent to the avatar component
        window.dispatchEvent(new CustomEvent('avatar-viseme', { detail: viseme }))
    }, [])

    const { speak, stop, isSupported } = useSpeech({
        onViseme: handleViseme,
    })

    const greet = useCallback(() => {
        const message = t('avatar.greeting')
        speak(message)
    }, [speak, t])

    const guideUpload = useCallback(() => {
        const message = t('avatar.uploadGuide')
        speak(message)
    }, [speak, t])

    const speakFileReceived = useCallback(() => {
        const message = t('avatar.fileReceived')
        speak(message)
    }, [speak, t])

    const speakLanguageChangeGreeting = useCallback(() => {
        const message = t('avatar.languageChangeGreeting')
        speak(message)
    }, [speak, t])

    const speakWelcome = useCallback(() => {
        const message = `${t('avatar.greeting')} ${t('avatar.languageChangeGreeting')}`
        speak(message)
    }, [speak, t])

    const speakProcessingStep = useCallback((step: 'analyzing' | 'reducing' | 'improving' | 'enhancing') => {
        const message = t(`avatar.processing.${step}`)
        speak(message)
    }, [speak, t])

    const speakPromo = useCallback(() => {
        const message = t('avatar.promo')
        speak(message)
    }, [speak, t])

    const speakSuccess = useCallback(() => {
        const message = t('avatar.success')
        speak(message)
    }, [speak, t])

    const speakError = useCallback(() => {
        const message = t('avatar.error')
        speak(message)
    }, [speak, t])

    const speakLimitReached = useCallback(() => {
        const message = t('avatar.limitReached')
        speak(message)
    }, [speak, t])

    const speakIdleMessage = useCallback(() => {
        const messages = t('avatar.idle', { returnObjects: true }) as string[]
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        speak(randomMessage)
    }, [speak, t])

    const speakCustom = useCallback((message: string) => {
        speak(message)
    }, [speak])

    // Full processing narration sequence
    const narrateProcessing = useCallback(async () => {
        const steps: Array<'analyzing' | 'reducing' | 'improving' | 'enhancing'> = [
            'analyzing',
            'reducing',
            'improving',
            'enhancing',
        ]

        for (const step of steps) {
            await new Promise<void>((resolve) => {
                speakProcessingStep(step)
                // Wait for speech to complete (approximate)
                setTimeout(resolve, 3000)
            })
        }

        // Add promotional message
        await new Promise<void>((resolve) => {
            speakPromo()
            setTimeout(resolve, 4000)
        })
    }, [speakProcessingStep, speakPromo])

    return useMemo(() => ({
        greet,
        guideUpload,
        speakFileReceived,
        speakLanguageChangeGreeting,
        speakWelcome,
        speakProcessingStep,
        speakPromo,
        speakSuccess,
        speakError,
        speakLimitReached,
        speakIdleMessage,
        speakCustom,
        narrateProcessing,
        stop,
        isSupported,
    }), [greet, guideUpload, speakFileReceived, speakLanguageChangeGreeting, speakWelcome, speakProcessingStep, speakPromo, speakSuccess, speakError, speakLimitReached, speakIdleMessage, speakCustom, narrateProcessing, stop, isSupported])
}

export type { Viseme } from './useSpeech'
