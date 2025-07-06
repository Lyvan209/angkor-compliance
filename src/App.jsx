import { useState, useEffect } from 'react'
import { supabase, signIn, signUp, signOut } from './lib/supabase'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { useTranslations } from './translations'
import { useLanguageStyles } from './hooks/useLanguageStyles'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'

// Create a component that uses the language context
const AppContent = () => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass } = useLanguageStyles()
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentView, setCurrentView] = useState('landing') // 'landing', 'login', 'dashboard'

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // If user is already logged in, show dashboard
      if (session) {
        setCurrentView('dashboard')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // Update view based on session
      if (session) {
        setCurrentView('dashboard')
      } else {
        setCurrentView('landing')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (email, password) => {
    setAuthLoading(true)
    setError(null)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        setSession(data.session)
        setUser(data.user)
        setCurrentView('dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignUp = async (email, password, fullName) => {
    setAuthLoading(true)
    setError(null)

    try {
      const { data, error } = await signUp(email, password, fullName)
      
      if (error) {
        setError(error.message)
      } else {
        if (data.user && !data.session) {
          setError('Please check your email for a verification link')
        } else {
          setSession(data.session)
          setUser(data.user)
          setCurrentView('dashboard')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    setAuthLoading(true)
    setError(null)

    try {
      const { error } = await signOut()
      
      if (error) {
        setError(error.message)
      } else {
        setSession(null)
        setUser(null)
        setCurrentView('landing')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleNavigateToLogin = () => {
    setCurrentView('login')
    setError(null)
  }

  const handleBackToHome = () => {
    setCurrentView('landing')
    setError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className={`text-gray-600 ${textClass}`}>{t.loading}</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user is authenticated
  if (session && currentView === 'dashboard') {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
      />
    )
  }

  // Show login page
  if (currentView === 'login') {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        isLoading={authLoading}
        error={error}
        onBackToHome={handleBackToHome}
      />
    )
  }

  // Show landing page by default
  return (
    <LandingPage
      onNavigateToLogin={handleNavigateToLogin}
    />
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App 