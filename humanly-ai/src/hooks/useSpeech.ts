import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { useTranslation } from 'react-i18next'

// Language to voice mapping for Web Speech API
const languageVoiceMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    mr: 'mr-IN',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
}

// Viseme types for lip sync (Rhubarb format)
export type Viseme = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X'

interface UseSpeechOptions {
    onStart?: () => void
    onEnd?: () => void
    onViseme?: (viseme: Viseme) => void
}

export const useSpeech = (options: UseSpeechOptions = {}) => {
    const { i18n } = useTranslation()
    const { setIsSpeaking, setAvatarMessage } = useAppStore()
    const [isSupported, setIsSupported] = useState(true)
    const synthRef = useRef<SpeechSynthesis | null>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const visemeIntervalRef = useRef<number | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis
        } else {
            setIsSupported(false)
        }

        return () => {
            if (visemeIntervalRef.current) {
                clearInterval(visemeIntervalRef.current)
            }
        }
    }, [])

    const getVoice = useCallback(() => {
        if (!synthRef.current) return null

        const voices = synthRef.current.getVoices()
        const langCode = languageVoiceMap[i18n.language] || 'en-US'

        // Try to find a female voice for the selected language
        let voice = voices.find(v =>
            v.lang.startsWith(langCode.split('-')[0]) &&
            v.name.toLowerCase().includes('female')
        )

        // Fallback to any voice in that language
        if (!voice) {
            voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]))
        }

        // Ultimate fallback
        if (!voice && voices.length > 0) {
            voice = voices[0]
        }

        return voice
    }, [i18n.language])

    const simulateVisemes = useCallback(() => {
        const visemes: Viseme[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X']
        let index = 0

        visemeIntervalRef.current = window.setInterval(() => {
            const randomViseme = visemes[Math.floor(Math.random() * (visemes.length - 1))]
            options.onViseme?.(randomViseme)
            index++
        }, 100)
    }, [options])

    const speak = useCallback(async (text: string) => {
        if (!synthRef.current || !isSupported) {
            console.warn('Speech synthesis not supported')
            return
        }

        // Cancel any ongoing speech
        synthRef.current.cancel()

        if (visemeIntervalRef.current) {
            clearInterval(visemeIntervalRef.current)
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        const voice = getVoice()
        if (voice) {
            utterance.voice = voice
        }

        utterance.lang = languageVoiceMap[i18n.language] || 'en-US'
        utterance.rate = 0.9
        utterance.pitch = 1.1
        utterance.volume = 0.8

        utterance.onstart = () => {
            setIsSpeaking(true)
            setAvatarMessage(text)
            options.onStart?.()
            simulateVisemes()
        }

        utterance.onend = () => {
            setIsSpeaking(false)
            options.onEnd?.()
            if (visemeIntervalRef.current) {
                clearInterval(visemeIntervalRef.current)
                options.onViseme?.('X')
            }
        }

        utterance.onerror = () => {
            setIsSpeaking(false)
            if (visemeIntervalRef.current) {
                clearInterval(visemeIntervalRef.current)
            }
        }

        synthRef.current.speak(utterance)
    }, [isSupported, getVoice, i18n.language, setIsSpeaking, setAvatarMessage, options, simulateVisemes])

    const stop = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel()
        }
        if (visemeIntervalRef.current) {
            clearInterval(visemeIntervalRef.current)
        }
        setIsSpeaking(false)
    }, [setIsSpeaking])

    const pause = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.pause()
        }
    }, [])

    const resume = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.resume()
        }
    }, [])

    return useMemo(() => ({
        speak,
        stop,
        pause,
        resume,
        isSupported,
    }), [speak, stop, pause, resume, isSupported])
}
