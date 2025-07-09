import { useState, useEffect } from 'react'
import { 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  , 
  Shield,
  FileText,
  Calendar,
  ,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  RotateCcw
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getNotificationSettings,
  updateNotificationSettings,
  getNotificationChannels
} from '../../lib/supabase-enhanced'

const NotificationSettings = ({ user, onClose }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    in_app_notifications: true,
    notification_frequency: 'real_time',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    channels: {
      permit_expiry: { email: true, sms: false, push: true, in_app: true },
      permit_renewal: { email: true, sms: false, push: true, in_app: true },
      document_approval: { email: true, sms: false, push: false, in_app: true },
      audit_scheduled: { email: true, sms: false, push: true, in_app: true },
      compliance_alert: { email: true, sms: true, push: true, in_app: true },
      system_notification: { email: false, sms: false, push: false, in_app: true }
    }
  })
  
  const [originalSettings, setOriginalSettings] = useState({})
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSettings()
  }, [user.id])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const [settingsResult, channelsResult] = await Promise.all([
        getNotificationSettings(user.id),
        getNotificationChannels()
      ])

      if (settingsResult.success) {
        setSettings(settingsResult.data)
        setOriginalSettings(settingsResult.data)
      }
      if (channelsResult.success) {
        setChannels(channelsResult.data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setError('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateNotificationSettings(user.id, settings)
      if (result.success) {
        setOriginalSettings(settings)
        setSuccess('Settings saved successfully')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    setSuccess('')
    setError('')
  }

  const handleChannelChange = (notificationType, channel, enabled) => {
    setSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [notificationType]: {
          ...prev.channels[notificationType],
          [channel]: enabled
        }
      }
    }))
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  const notificationTypes = [
    {
      id: 'permit_expiry',
      label: 'Permit Expiry',
      description: 'Notifications when permits are about to expire',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      id: 'permit_renewal',
      label: 'Permit Renewal',
      description: 'Notifications for permit renewal reminders',
      icon: Shield,
      color: 'text-yellow-600'
    },
    {
      id: 'document_approval',
      label: 'Document Approval',
      description: 'Notifications when documents need approval',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      id: 'audit_scheduled',
      label: 'Audit Scheduled',
      description: 'Notifications for scheduled audits',
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      id: 'compliance_alert',
      label: 'Compliance Alert',
      description: 'Critical compliance issues and alerts',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      id: 'system_notification',
      label: 'System Notification',
      description: 'General system updates and maintenance',
      icon: Settings,
      color: 'text-gray-600'
    }
  ]

  const channelTypes = [
    { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-600' },
    { id: 'sms', label: 'SMS', icon: Phone, color: 'text-green-600' },
    { id: 'push', label: 'Push', icon: Bell, color: 'text-purple-600' },
    { id: 'in_app', label: 'In-App', icon: MessageSquare, color: 'text-gray-600' }
  ]

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          General Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
                Email Notifications
              </label>
              <p className={`text-sm text-gray-500 ${textClass}`}>
                Receive notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.email_notifications}
                onChange={(e) => setSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
                SMS Notifications
              </label>
              <p className={`text-sm text-gray-500 ${textClass}`}>
                Receive notifications via SMS
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.sms_notifications}
                onChange={(e) => setSettings(prev => ({ ...prev, sms_notifications: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
                Push Notifications
              </label>
              <p className={`text-sm text-gray-500 ${textClass}`}>
                Receive push notifications on your devices
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.push_notifications}
                onChange={(e) => setSettings(prev => ({ ...prev, push_notifications: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
                In-App Notifications
              </label>
              <p className={`text-sm text-gray-500 ${textClass}`}>
                Show notifications within the application
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.in_app_notifications}
                onChange={(e) => setSettings(prev => ({ ...prev, in_app_notifications: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Notification Frequency
        </h3>
        
        <div className="space-y-2">
          {[
            { value: 'real_time', label: 'Real-time', description: 'Receive notifications immediately' },
            { value: 'hourly', label: 'Hourly', description: 'Receive notifications every hour' },
            { value: 'daily', label: 'Daily', description: 'Receive notifications once per day' },
            { value: 'weekly', label: 'Weekly', description: 'Receive notifications once per week' }
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="notification_frequency"
                value={option.value}
                checked={settings.notification_frequency === option.value}
                onChange={(e) => setSettings(prev => ({ ...prev, notification_frequency: e.target.value }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div>
                <div className={`text-sm font-medium text-gray-700 ${textClass}`}>
                  {option.label}
                </div>
                <div className={`text-sm text-gray-500 ${textClass}`}>
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Quiet Hours
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
                Enable Quiet Hours
              </label>
              <p className={`text-sm text-gray-500 ${textClass}`}>
                Pause notifications during specified hours
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.quiet_hours_enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${textClass}`}>
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderChannelSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Notification Channels
        </h3>
        <p className={`text-sm text-gray-500 mb-6 ${textClass}`}>
          Choose how you want to receive different types of notifications
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                Notification Type
              </th>
              {channelTypes.map(channel => (
                <th key={channel.id} className={`px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${textClass}`}>
                  <div className="flex items-center justify-center space-x-2">
                    <channel.icon className={`h-4 w-4 ${channel.color}`} />
                    <span>{channel.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notificationTypes.map((type) => (
              <tr key={type.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <type.icon className={`h-5 w-5 ${type.color}`} />
                    <div>
                      <div className={`text-sm font-medium text-gray-900 ${textClass}`}>
                        {type.label}
                      </div>
                      <div className={`text-sm text-gray-500 ${textClass}`}>
                        {type.description}
                      </div>
                    </div>
                  </div>
                </td>
                {channelTypes.map(channel => (
                  <td key={channel.id} className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.channels[type.id]?.[channel.id] || false}
                        onChange={(e) => handleChannelChange(type.id, channel.id, e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold text-gray-900 ${headerClass}`}>
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className={`text-red-800 ${textClass}`}>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className={`text-green-800 ${textClass}`}>{success}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'channels', label: 'Channels', icon: Bell }
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  'border-blue-500 text-blue-600'
                } ${textClass}`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {renderGeneralSettings()}
          {renderChannelSettings()}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings 