import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAppStore } from './appStore'

interface AuthState {
    user: User | null
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setLoading: (loading: boolean) => void
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<{ error: Error | null }>
    resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>
    initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setSession: (session) => set({ session }),
            setLoading: (isLoading) => set({ isLoading }),

            signIn: async (email, password) => {
                try {
                    set({ isLoading: true })
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    })

                    if (error) throw error

                    set({
                        user: data.user,
                        session: data.session,
                        isAuthenticated: true,
                    })

                    return { error: null }
                } catch (error) {
                    return { error: error as Error }
                } finally {
                    set({ isLoading: false })
                }
            },

            signUp: async (email, password, name) => {
                try {
                    set({ isLoading: true })
                    const { error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { name },
                            emailRedirectTo: `${window.location.origin}/auth/login`,
                        },
                    })

                    if (error) throw error

                    return { error: null }
                } catch (error) {
                    return { error: error as Error }
                } finally {
                    set({ isLoading: false })
                }
            },

            signOut: async () => {
                await supabase.auth.signOut()
                useAppStore.getState().resetAppState()
                set({
                    user: null,
                    session: null,
                    isAuthenticated: false,
                })
            },

            resetPassword: async (email) => {
                try {
                    set({ isLoading: true })
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/auth/reset-password`,
                    })

                    if (error) throw error
                    return { error: null }
                } catch (error) {
                    return { error: error as Error }
                } finally {
                    set({ isLoading: false })
                }
            },

            resendVerificationEmail: async (email) => {
                try {
                    set({ isLoading: true })
                    const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email,
                    })
                    if (error) throw error
                    return { error: null }
                } catch (error) {
                    return { error: error as Error }
                } finally {
                    set({ isLoading: false })
                }
            },

            initialize: async () => {
                // Enterprise-level: Force logout if user just confirmed email via link
                const isConfirming = window.location.hash.includes('type=signup') || window.location.hash.includes('type=recovery')

                if (isConfirming) {
                    await supabase.auth.signOut()
                    useAppStore.getState().resetAppState()
                }

                try {
                    const { data: { session } } = await supabase.auth.getSession()

                    set({
                        user: session?.user ?? null,
                        session: session,
                        isAuthenticated: !!session?.user && session?.user?.email_confirmed_at != null,
                        isLoading: false,
                    })

                    // Listen for auth changes
                    supabase.auth.onAuthStateChange((event, session) => {
                        const user = session?.user ?? null
                        const isEmailVerified = user?.email_confirmed_at != null

                        if (event === 'SIGNED_OUT') {
                            useAppStore.getState().resetAppState()
                        }

                        if (user && !isEmailVerified && event === 'SIGNED_IN') {
                            // If they are signed in but not verified, sign them out immediately
                            // to enforce the "Verify then Login" flow.
                            supabase.auth.signOut()
                            set({ user: null, session: null, isAuthenticated: false })
                        } else {
                            set({
                                user,
                                session,
                                isAuthenticated: !!user && isEmailVerified,
                            })
                        }
                    })
                } catch (error) {
                    console.error('Auth initialization error:', error)
                    set({ isLoading: false })
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
)
