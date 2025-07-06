import { useState, useEffect } from 'react'
import { supabase, signIn, signUp, signOut } from './lib/supabase'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
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
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {!session ? (
        <LoginForm
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          isLoading={authLoading}
          error={error}
        />
      ) : (
        <Dashboard
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App 