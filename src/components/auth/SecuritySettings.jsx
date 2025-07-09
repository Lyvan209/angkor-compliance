import { useState, useEffect } from 'react'
import { Shield, Key, History, Smartphone, AlertTriangle, CheckCircle, Eye, Clock, MapPin } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { MFAManager, PasswordSecurity, SecurityMonitor } from '../../lib/auth-enhanced'
import MFASetup from './MFASetup'

const SecuritySettings = ({ user }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [showMFASetup, setShowMFASetup] = useState(false)
  const [securityEvents, setSecurityEvents] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [mfaFactors, setMfaFactors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordValidation, setPasswordValidation] = useState(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    setLoading(true)
    try {
      const [eventsResult, sessionsResult, factorsResult] = await Promise.all([
        SecurityMonitor.getSecurityEvents(user.id),
        SecurityMonitor.getActiveSessions(user.id),
        MFAManager.listMFAFactors()
      ])

      if (eventsResult.success) setSecurityEvents(eventsResult.events)
      if (sessionsResult.success) setActiveSessions(sessionsResult.sessions)
      if (factorsResult.success) setMfaFactors(factorsResult.factors)
    } catch (err) {
      setError('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (!passwordValidation?.isValid) {
      setError('New password does not meet security requirements')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await PasswordSecurity.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        user.id
      )

      if (result.success) {
        setSuccess('Password changed successfully')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setPasswordValidation(null)
      } else {
        setError(result.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPasswordChange = (value) => {
    setPasswordForm(prev => ({ ...prev, newPassword: value }))
    setPasswordValidation(PasswordSecurity.validatePasswordStrength(value))
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Security Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Security Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              mfaFactors.length > 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Smartphone className={`h-5 w-5 ${
                mfaFactors.length > 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className={`font-medium ${textClass}`}>Multi-Factor Authentication</p>
              <p className={`text-sm ${
                mfaFactors.length > 0 ? 'text-green-600' : 'text-red-600'
              } ${textClass}`}>
                {mfaFactors.length > 0 ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-100">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className={`font-medium ${textClass}`}>Account Security</p>
              <p className={`text-sm text-green-600 ${textClass}`}>
                Good
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Quick Actions
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => setShowMFASetup(true)}
            className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 ${textClass}`}
          >
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">Multi-Factor Authentication</p>
                <p className="text-sm text-gray-600">
                  {mfaFactors.length > 0 ? 'Manage MFA settings' : 'Enable MFA for enhanced security'}
                </p>
              </div>
            </div>
            <span className={`text-sm px-2 py-1 rounded ${
              mfaFactors.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {mfaFactors.length > 0 ? 'Enabled' : 'Disabled'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 ${textClass}`}
          >
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 ${textClass}`}
          >
            <div className="flex items-center space-x-3">
              <History className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">Security Activity</p>
                <p className="text-sm text-gray-600">View recent security events</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  const renderPasswordTab = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
        Change Password
      </h3>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          
          {passwordValidation && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-2">
                <div className={`w-full h-2 rounded-full bg-gray-200`}>
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      passwordValidation.strength === 'weak' ? 'bg-red-500 w-1/3' :
                      passwordValidation.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordValidation.strength === 'weak' ? 'text-red-600' :
                  passwordValidation.strength === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {passwordValidation.strength.toUpperCase()}
                </span>
              </div>
              
              <ul className={`text-xs space-y-1 ${textClass}`}>
                {Object.entries(passwordValidation.checks).map(([key, passed]) => (
                  <li key={key} className={`flex items-center space-x-1 ${
                    passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>{passed ? '✓' : '✗'}</span>
                    <span>
                      {key === 'length' ? 'At least 8 characters' :
                       key === 'uppercase' ? 'Uppercase letter' :
                       key === 'lowercase' ? 'Lowercase letter' :
                       key === 'numbers' ? 'Number' :
                       key === 'symbols' ? 'Special character' :
                       'Not a common password'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
            <p className={`text-xs text-red-600 mt-1 ${textClass}`}>
              Passwords do not match
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className={`text-red-800 text-sm ${textClass}`}>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className={`text-green-800 text-sm ${textClass}`}>{success}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !passwordValidation?.isValid || passwordForm.newPassword !== passwordForm.confirmPassword}
          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  )

  const renderActivityTab = () => (
    <div className="space-y-6">
      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Recent Security Activity
        </h3>
        
        <div className="space-y-3">
          {securityEvents.length === 0 ? (
            <p className={`text-gray-500 text-center py-8 ${textClass}`}>
              No recent security events
            </p>
          ) : (
            securityEvents.map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  event.action.includes('success') ? 'bg-green-100' : 
                  event.action.includes('failed') ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {event.action.includes('login') ? <Key className="h-4 w-4" /> :
                   event.action.includes('mfa') ? <Smartphone className="h-4 w-4" /> :
                   <Shield className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${textClass}`}>
                    {event.action.replace('auth.', '').replace('.', ' ').toUpperCase()}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.ip_address || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Active Sessions
        </h3>
        
        <div className="space-y-3">
          {activeSessions.map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className={`font-medium ${textClass}`}>
                    {session.is_current ? 'Current Session' : 'Session'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(session.last_activity).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {session.ip_address}
                    </span>
                  </div>
                </div>
              </div>
              {!session.is_current && (
                <button className="text-red-600 hover:text-red-700 text-sm">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Security Settings
        </h2>
        <p className={`text-gray-600 ${textClass}`}>
          Manage your account security and privacy settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'password', label: 'Password', icon: Key },
            { id: 'activity', label: 'Activity', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${textClass}`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'password' && renderPasswordTab()}
      {activeTab === 'activity' && renderActivityTab()}

      {/* MFA Setup Modal */}
      {showMFASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <MFASetup
              user={user}
              onComplete={() => {
                setShowMFASetup(false)
                loadSecurityData()
              }}
              onCancel={() => setShowMFASetup(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SecuritySettings 