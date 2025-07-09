import { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ,
  Calendar,
  FileText,
  Settings,
  Send,
  Mail,
  Smartphone,
  ,
  Filter
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getExpiringPermits,
  getOverduePermits,
  getAlertSettings,
  updateAlertSettings,
  createNotification,
  sendNotificationEmail
} from '../../lib/supabase-enhanced'

const PermitAlerts = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [alerts, setAlerts] = useState([])
  const [expiringPermits, setExpiringPermits] = useState([])
  const [overduePermits, setOverduePermits] = useState([])
  const [alertSettings, setAlertSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    app_enabled: true,
    reminder_days: [30, 14, 7, 1],
    notification_time: '09:00',
    recipients: []
  })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [activeTab, setActiveTab] = useState('alerts')
  const [filterPriority, setFilterPriority] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadAlertData()
  }, [organizationId])

  const loadAlertData = async () => {
    setLoading(true)
    try {
      const [expiringResult, overdueResult, settingsResult] = await Promise.all([
        getExpiringPermits(organizationId, 60), // 60 days ahead
        getOverduePermits(organizationId),
        getAlertSettings(organizationId)
      ])

      if (expiringResult.success) {
        setExpiringPermits(expiringResult.data)
        generateAlerts(expiringResult.data, overdueResult.data || [])
      }
      
      if (overdueResult.success) {
        setOverduePermits(overdueResult.data)
      }
      
      if (settingsResult.success && settingsResult.data) {
        setAlertSettings(settingsResult.data)
      }
    } catch (error) {
      console.error('Failed to load alert data:', error)
      setError('Failed to load alert data')
    } finally {
      setLoading(false)
    }
  }

  const generateAlerts = (expiring, overdue) => {
    const alerts = []

    // Generate overdue alerts
    overdue.forEach(permit => {
      const daysOverdue = Math.abs(getDaysUntilExpiry(permit.expiry_date))
      alerts.push({
        id: `overdue-${permit.id}`,
        type: 'overdue',
        priority: 'critical',
        permit,
        title: 'Permit Expired',
        message: `${permit.title} expired ${daysOverdue} days ago`,
        daysOverdue,
        createdAt: new Date()
      })
    })

    // Generate expiring alerts
    expiring.forEach(permit => {
      const daysUntilExpiry = getDaysUntilExpiry(permit.expiry_date)
      
      if (daysUntilExpiry > 0) {
        let priority = 'low'
        if (daysUntilExpiry <= 7) priority = 'critical'
        else if (daysUntilExpiry <= 14) priority = 'high'
        else if (daysUntilExpiry <= 30) priority = 'medium'

        alerts.push({
          id: `expiring-${permit.id}`,
          type: 'expiring',
          priority,
          permit,
          title: 'Permit Expiring Soon',
          message: `${permit.title} expires in ${daysUntilExpiry} days`,
          daysUntilExpiry,
          createdAt: new Date()
        })
      }
    })

    // Sort by priority and days
    alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      
      if (a.type === 'overdue' && b.type === 'expiring') return -1
      if (a.type === 'expiring' && b.type === 'overdue') return 1
      
      return (a.daysUntilExpiry || -a.daysOverdue) - (b.daysUntilExpiry || -b.daysOverdue)
    })

    setAlerts(alerts)
  }

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Clock className="h-4 w-4" />
      case 'low': return <Bell className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const handleSettingsChange = (key, value) => {
    setAlertSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleReminderDaysChange = (days) => {
    const reminderDays = alertSettings.reminder_days.includes(days)
      ? alertSettings.reminder_days.filter(d => d !== days)
      : [...alertSettings.reminder_days, days].sort((a, b) => b - a)
    
    handleSettingsChange('reminder_days', reminderDays)
  }

  const saveAlertSettings = async () => {
    setSavingSettings(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateAlertSettings(organizationId, alertSettings)
      
      if (result.success) {
        setSuccess('Alert settings saved successfully')
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Failed to save alert settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const sendTestNotification = async () => {
    setLoading(true)
    try {
      const result = await createNotification({
        organization_id: organizationId,
        user_id: user.id,
        title: 'Test Alert',
        message: 'This is a test notification from the permit alert system',
        type: 'test',
        priority: 'medium'
      })

      if (result.success) {
        setSuccess('Test notification sent successfully')
      } else {
        setError('Failed to send test notification')
      }
    } catch (err) {
      setError('Failed to send test notification')
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = alerts.filter(alert => 
    filterPriority === 'all' || alert.priority === filterPriority
  )

  const renderAlertsTab = () => (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-red-600 ${textClass}`}>
                Critical Alerts
              </p>
              <p className={`text-2xl font-bold text-red-800 ${headerClass}`}>
                {alerts.filter(a => a.priority === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-orange-600 ${textClass}`}>
                High Priority
              </p>
              <p className={`text-2xl font-bold text-orange-800 ${headerClass}`}>
                {alerts.filter(a => a.priority === 'high').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-yellow-600 ${textClass}`}>
                Medium Priority
              </p>
              <p className={`text-2xl font-bold text-yellow-800 ${headerClass}`}>
                {alerts.filter(a => a.priority === 'medium').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-blue-600 ${textClass}`}>
                Low Priority
              </p>
              <p className={`text-2xl font-bold text-blue-800 ${headerClass}`}>
                {alerts.filter(a => a.priority === 'low').length}
              </p>
            </div>
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
              No Active Alerts
            </h3>
            <p className={`text-gray-500 ${textClass}`}>
              All permits are up to date and compliant
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`border rounded-lg p-4 ${getPriorityColor(alert.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getPriorityIcon(alert.priority)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${textClass}`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm mt-1 ${textClass}`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {alert.permit.permit_number}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires: {new Date(alert.permit.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    alert.priority === 'critical' ? 'bg-red-800 text-red-100' :
                    alert.priority === 'high' ? 'bg-orange-800 text-orange-100' :
                    alert.priority === 'medium' ? 'bg-yellow-800 text-yellow-100' :
                    'bg-blue-800 text-blue-100'
                  }`}>
                    {alert.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Notification Channels */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
          <Send className="h-5 w-5 mr-2" />
          Notification Channels
        </h3>
        
        <div className="space-y-4">
          <label className={`flex items-center ${textClass}`}>
            <input
              type="checkbox"
              checked={alertSettings.email_enabled}
              onChange={(e) => handleSettingsChange('email_enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Mail className="h-4 w-4 ml-3 mr-2 text-gray-500" />
            <span>Email Notifications</span>
          </label>
          
          <label className={`flex items-center ${textClass}`}>
            <input
              type="checkbox"
              checked={alertSettings.sms_enabled}
              onChange={(e) => handleSettingsChange('sms_enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Smartphone className="h-4 w-4 ml-3 mr-2 text-gray-500" />
            <span>SMS Notifications</span>
          </label>
          
          <label className={`flex items-center ${textClass}`}>
            <input
              type="checkbox"
              checked={alertSettings.app_enabled}
              onChange={(e) => handleSettingsChange('app_enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Bell className="h-4 w-4 ml-3 mr-2 text-gray-500" />
            <span>In-App Notifications</span>
          </label>
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
          <Clock className="h-5 w-5 mr-2" />
          Reminder Schedule
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Send reminders (days before expiry)
            </label>
            <div className="flex flex-wrap gap-2">
              {[60, 30, 14, 7, 3, 1].map(days => (
                <label key={days} className={`flex items-center ${textClass}`}>
                  <input
                    type="checkbox"
                    checked={alertSettings.reminder_days.includes(days)}
                    onChange={() => handleReminderDaysChange(days)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2">{days} days</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Daily notification time
            </label>
            <input
              type="time"
              value={alertSettings.notification_time}
              onChange={(e) => handleSettingsChange('notification_time', e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={sendTestNotification}
          className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
        >
          <Send className="h-4 w-4" />
          <span>Send Test Notification</span>
        </button>

        <button
          onClick={saveAlertSettings}
          disabled={savingSettings}
          className={`flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
        >
          {savingSettings ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Settings className="h-4 w-4" />
          )}
          <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Permit Alerts & Notifications
        </h1>
        <p className={`text-gray-600 ${textClass}`}>
          Monitor permit expiries and manage automated alert settings
        </p>
      </div>

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
            { id: 'alerts', label: 'Active Alerts', icon: Bell },
            { id: 'settings', label: 'Alert Settings', icon: Settings }
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
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </div>
  )
}

export default PermitAlerts 