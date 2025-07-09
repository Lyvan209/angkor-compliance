import { useState, useEffect } from 'react'
import { Eye, EyeOff, AlertTriangle, Shield, Clock, Smartphone } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  enhancedSignIn, 
  AccountSecurity, 
  MFAManager,
  initializeSessionManager
} from '../../lib/auth-enhanced'

const EnhancedLoginForm = ({ onSuccess, onError }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountLocked, setAccountLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(null)
  const [remainingAttempts, setRemainingAttempts] = useState(null)
  
  // MFA state
  const [requiresMFA, setRequiresMFA] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  useEffect(() => {
    let interval
    if (accountLocked && lockoutTime) {
      interval = setInterval(() => {
        const now = new Date()
        const remaining = lockoutTime - now
        
        if (remaining <= 0) {
          setAccountLocked(false)
          setLockoutTime(null)
          setError('')
          clearInterval(interval)
        }
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [accountLocked, lockoutTime])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (accountLocked) {
      setError('Account is temporarily locked. Please try again later.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check for account lockout before attempting login
      const lockCheck = await AccountSecurity.checkAccountLock(formData.email)
      
      if (lockCheck.isLocked) {
        setAccountLocked(true)
        setLockoutTime(lockCheck.lockedUntil)
        setError(`Account is locked until ${lockCheck.lockedUntil.toLocaleString()}`)
        setLoading(false)
        return
      }

      // Attempt enhanced sign in
      const result = await enhancedSignIn(formData.email, formData.password, formData.rememberMe)
      
      if (result.success) {
        // Check if MFA is required
        const mfaFactors = await MFAManager.listMFAFactors()
        
        if (mfaFactors.success && mfaFactors.factors.length > 0) {
          setRequiresMFA(true)
          setMfaFactorId(mfaFactors.factors[0].id)
          setLoading(false)
          return
        }

        // Initialize session manager
        initializeSessionManager()
        
        // Login successful
        onSuccess?.(result.user)
      } else {
        // Handle login failure
        setError(result.error)
        
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts)
        }
        
        if (result.isLocked) {
          setAccountLocked(true)
          setLockoutTime(new Date(Date.now() + 15 * 60 * 1000)) // 15 minutes
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMFASubmit = async (e) => {
    e.preventDefault()
    
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setMfaLoading(true)
    setError('')

    try {
      const result = await MFAManager.verifyMFA(mfaFactorId, mfaCode, null)
      
      if (result.success) {
        // Initialize session manager
        initializeSessionManager()
        
        // Get user data and complete login
        const { data: { user } } = await supabase.auth.getUser()
        onSuccess?.(user)
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('MFA verification failed. Please try again.')
    } finally {
      setMfaLoading(false)
    }
  }

  const formatLockoutTime = () => {
    if (!lockoutTime) return ''
    
    const now = new Date()
    const remaining = lockoutTime - now
    
    if (remaining <= 0) return ''
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (requiresMFA) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Two-Factor Authentication
          </h2>
          <p className={`text-gray-600 ${textClass}`}>
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleMFASubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Verification Code
            </label>
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setMfaCode(value)
              }}
              placeholder="000000"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className={`text-red-800 text-sm ${textClass}`}>{error}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setRequiresMFA(false)}
              className={`flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${textClass}`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={mfaLoading || mfaCode.length !== 6}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
            >
              {mfaLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Sign In
        </h2>
        <p className={`text-gray-600 ${textClass}`}>
          Welcome back! Please sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              required
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className={`flex items-center ${textClass}`}>
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        {/* Account Status Messages */}
        {accountLocked && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <div>
                <p className={`text-red-800 text-sm font-medium ${textClass}`}>
                  Account Temporarily Locked
                </p>
                <p className={`text-red-700 text-xs ${textClass}`}>
                  Try again in {formatLockoutTime()}
                </p>
              </div>
            </div>
          </div>
        )}

        {remainingAttempts !== null && remainingAttempts > 0 && !accountLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className={`text-yellow-800 text-sm ${textClass}`}>
                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout
              </p>
            </div>
          </div>
        )}

        {error && !accountLocked && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className={`text-red-800 text-sm ${textClass}`}>{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || accountLocked}
          className={`w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Security Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            <span>Secure Login</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Session Timeout</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedLoginForm 