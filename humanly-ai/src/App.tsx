import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useAppStore } from '@/store'
import {
    LandingPage,
    LanguageSelector,
    Dashboard,
    OnboardingPage,
    APIPage,
    LoginPage,
    SignupPage,
    ForgotPasswordPage,
    VerifyEmailPage,
} from '@/pages'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore()
    const { isOnboarded } = useAppStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />
    }

    if (!isOnboarded) {
        return <Navigate to="/onboarding" replace />
    }

    return <>{children}</>
}

// Onboarding Route Component (redirect if already onboarded)
function OnboardingRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore()
    const { isOnboarded } = useAppStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />
    }

    if (isOnboarded) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}

// Public Route (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}

function App() {
    const { initialize, isAuthenticated } = useAuthStore()
    const { hasSelectedLanguage, isOnboarded, resetToFree } = useAppStore()

    useEffect(() => {
        initialize()
    }, [initialize])

    // Reset plan to free for newly authenticated users who haven't onboarded
    useEffect(() => {
        if (isAuthenticated && !isOnboarded) {
            resetToFree()
        }
    }, [isAuthenticated, isOnboarded, resetToFree])

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/api-docs" element={<APIPage />} />

            {/* Language Selection (before login) */}
            <Route
                path="/language"
                element={
                    <PublicRoute>
                        <LanguageSelector />
                    </PublicRoute>
                }
            />

            {/* Auth Routes */}
            <Route
                path="/auth/login"
                element={
                    <PublicRoute>
                        {hasSelectedLanguage ? <LoginPage /> : <Navigate to="/language" replace />}
                    </PublicRoute>
                }
            />
            <Route
                path="/auth/signup"
                element={
                    <PublicRoute>
                        {hasSelectedLanguage ? <SignupPage /> : <Navigate to="/language" replace />}
                    </PublicRoute>
                }
            />
            <Route
                path="/auth/forgot-password"
                element={
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/auth/verify"
                element={
                    <PublicRoute>
                        <VerifyEmailPage />
                    </PublicRoute>
                }
            />

            {/* Protected Routes */}
            <Route
                path="/onboarding"
                element={
                    <OnboardingRoute>
                        <OnboardingPage />
                    </OnboardingRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
