import { useState, useEffect } from 'react'
import { Shield, Smartphone, AlertTriangle, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { MFAManager } from '../../lib/auth-enhanced'

const MFASetup = ({ user, onComplete, onCancel }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [step, setStep] = useState(1) // 1: intro, 2: setup, 3: verify, 4: complete
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mfaData, setMfaData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [factors, setFactors] = useState([])

  useEffect(() => {
    loadExistingFactors()
  }, [])

  const loadExistingFactors = async () => {
    const result = await MFAManager.listMFAFactors()
    if (result.success) {
      setFactors(result.factors)
    }
  }

  const handleEnableMFA = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await MFAManager.enableMFA(user.id)
      
      if (result.success) {
        setMfaData(result)
        setStep(2)
      } else {
        setError(result.error || 'Failed to enable MFA')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await MFAManager.verifyMFA(mfaData.factorId, verificationCode, user.id)
      
      if (result.success) {
        setStep(4)
        await loadExistingFactors()
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableMFA = async (factorId) => {
    setLoading(true)
    
    try {
      const result = await MFAManager.disableMFA(factorId, user.id)
      
      if (result.success) {
        await loadExistingFactors()
        setStep(1)
      } else {
        setError(result.error || 'Failed to disable MFA')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const renderIntroStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
      </div>
      
      <h3 className={`text-2xl font-bold text-gray-900 mb-4 ${headerClass}`}>
        Secure Your Account
      </h3>
      
      <p className={`text-gray-600 mb-6 ${textClass}`}>
        Multi-Factor Authentication (MFA) adds an extra layer of security to your account. 
        Even if someone knows your password, they won't be able to access your account without your phone.
      </p>

      {factors.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className={`text-green-800 font-medium ${textClass}`}>
              MFA is currently enabled
            </span>
          </div>
          <div className="mt-2">
            {factors.map((factor) => (
              <div key={factor.id} className="flex items-center justify-between">
                <span className={`text-green-700 ${textClass}`}>
                  {factor.friendly_name}
                </span>
                <button
                  onClick={() => handleDisableMFA(factor.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 text-sm underline"
                >
                  Disable
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <Smartphone className="h-6 w-6 text-gray-600 mb-2" />
          <h4 className={`font-semibold text-gray-900 mb-1 ${textClass}`}>
            Authenticator App
          </h4>
          <p className={`text-sm text-gray-600 ${textClass}`}>
            Use apps like Google Authenticator, Authy, or Microsoft Authenticator
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <Shield className="h-6 w-6 text-gray-600 mb-2" />
          <h4 className={`font-semibold text-gray-900 mb-1 ${textClass}`}>
            Enhanced Security
          </h4>
          <p className={`text-sm text-gray-600 ${textClass}`}>
            Protect against unauthorized access and data breaches
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className={`text-red-800 text-sm ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className={`flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${textClass}`}
        >
          Cancel
        </button>
        <button
          onClick={handleEnableMFA}
          disabled={loading || factors.length > 0}
          className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
        >
          {loading ? 'Setting up...' : factors.length > 0 ? 'Already Enabled' : 'Enable MFA'}
        </button>
      </div>
    </div>
  )

  const renderSetupStep = () => (
    <div>
      <div className="text-center mb-6">
        <h3 className={`text-2xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Set Up Authenticator App
        </h3>
        <p className={`text-gray-600 ${textClass}`}>
          Scan the QR code or enter the setup key manually
        </p>
      </div>

      <div className="space-y-6">
        {/* QR Code */}
        <div className="text-center">
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
            {mfaData?.qrCode ? (
              <img 
                src={mfaData.qrCode} 
                alt="QR Code for MFA setup"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <span className={`text-gray-500 ${textClass}`}>Loading QR Code...</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Setup */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className={`font-semibold text-gray-900 mb-2 ${textClass}`}>
            Can't scan the QR code?
          </h4>
          <p className={`text-sm text-gray-600 mb-3 ${textClass}`}>
            Enter this setup key manually in your authenticator app:
          </p>
          
          <div className="flex items-center space-x-2">
            <code className={`flex-1 p-2 bg-white border rounded text-sm font-mono ${showSecret ? '' : 'blur-sm select-none'}`}>
              {mfaData?.secret || 'Loading...'}
            </code>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(mfaData?.secret)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className={`font-semibold text-blue-900 mb-2 ${textClass}`}>
            Setup Instructions:
          </h4>
          <ol className={`text-sm text-blue-800 space-y-1 ${textClass}`}>
            <li>1. Download an authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>2. Scan the QR code or enter the setup key manually</li>
            <li>3. Enter the 6-digit code from your app below</li>
          </ol>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${textClass}`}
          >
            Back
          </button>
          <button
            onClick={() => setStep(3)}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )

  const renderVerifyStep = () => (
    <div>
      <div className="text-center mb-6">
        <h3 className={`text-2xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Verify Setup
        </h3>
        <p className={`text-gray-600 ${textClass}`}>
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              setVerificationCode(value)
            }}
            placeholder="000000"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            maxLength={6}
          />
          <p className={`text-xs text-gray-500 mt-1 ${textClass}`}>
            Enter the 6-digit code from your authenticator app
          </p>
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
            onClick={() => setStep(2)}
            className={`flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${textClass}`}
          >
            Back
          </button>
          <button
            onClick={handleVerifyCode}
            disabled={loading || verificationCode.length !== 6}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
          >
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <h3 className={`text-2xl font-bold text-gray-900 mb-4 ${headerClass}`}>
        MFA Successfully Enabled!
      </h3>
      
      <p className={`text-gray-600 mb-6 ${textClass}`}>
        Your account is now secured with Multi-Factor Authentication. 
        You'll need to use your authenticator app each time you sign in.
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div className="text-left">
            <h4 className={`font-semibold text-yellow-900 mb-1 ${textClass}`}>
              Important:
            </h4>
            <ul className={`text-sm text-yellow-800 space-y-1 ${textClass}`}>
              <li>• Keep your authenticator app installed and backed up</li>
              <li>• Save your backup codes if provided by your app</li>
              <li>• You can disable MFA from your security settings if needed</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
      >
        Complete Setup
      </button>
    </div>
  )

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`w-16 h-0.5 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && renderIntroStep()}
      {step === 2 && renderSetupStep()}
      {step === 3 && renderVerifyStep()}
      {step === 4 && renderCompleteStep()}
    </div>
  )
}

export default MFASetup 