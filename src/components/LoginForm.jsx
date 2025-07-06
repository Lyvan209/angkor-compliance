import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import LanguageSwitcher from './LanguageSwitcher'

const LoginForm = ({ onLogin, onSignUp, isLoading, error, onBackToHome }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSignUpMode) {
      if (formData.password !== formData.confirmPassword) {
        return
      }
      onSignUp(formData.email, formData.password, formData.fullName)
    } else {
      onLogin(formData.email, formData.password)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode)
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: ''
    })
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: `url('/angkor-bg.jpg')`,
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Back to Home Button */}
      {onBackToHome && (
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={onBackToHome}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-black bg-opacity-30 backdrop-blur-sm rounded-md hover:bg-opacity-40 transition-colors ${textClass}`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.backToHome}</span>
          </button>
        </div>
      )}
      
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 mb-6 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Angkor Compliance Logo" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h2 className={`mt-6 text-center text-3xl font-bold text-gray-900 ${headerClass}`}>
              {isSignUpMode ? t.signUp : t.signIn}
            </h2>
            <p className={`mt-2 text-center text-sm text-gray-600 ${textClass}`}>
              {isSignUpMode ? t.alreadyHaveAccount : t.dontHaveAccount}
              <button
                onClick={toggleMode}
                className={`font-medium text-primary-600 hover:text-primary-500 transition-colors ml-1 ${textClass}`}
              >
                {isSignUpMode ? t.signInButton : t.signUpButton}
              </button>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {isSignUpMode && (
                <div>
                  <label htmlFor="fullName" className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required={isSignUpMode}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`input-field pl-10 ${textClass}`}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                  {t.emailAddress}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field pl-10 ${textClass}`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                  {t.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input-field pl-10 pr-10 ${textClass}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {isSignUpMode && (
                <div>
                  <label htmlFor="confirmPassword" className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required={isSignUpMode}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`input-field pl-10 ${textClass}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {isSignUpMode && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className={`mt-1 text-sm text-red-600 ${textClass}`}>{t.passwordsDoNotMatch}</p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className={`text-sm ${textClass}`}>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || (isSignUpMode && formData.password !== formData.confirmPassword)}
                className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${textClass}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isSignUpMode ? t.creatingAccount : t.signingIn}
                  </div>
                ) : (
                  isSignUpMode ? t.createAccount : t.signInButton
                )}
              </button>
            </div>

            {!isSignUpMode && (
              <div className="text-center">
                <button
                  type="button"
                  className={`text-sm text-primary-600 hover:text-primary-500 transition-colors ${textClass}`}
                  onClick={() => {
                    // Handle forgot password
                    console.log('Forgot password clicked')
                  }}
                >
                  {t.forgotPassword}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className={`text-xs text-gray-500 ${textClass}`}>
              {t.bySigningIn}{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                {t.termsOfService}
              </a>{' '}
              {t.and}{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                {t.privacyPolicy}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm 