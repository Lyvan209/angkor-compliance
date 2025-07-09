import { useState, useEffect, useCallback } from 'react'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Bell, 
  Calendar,
  Shield,
  FileText,
  Users,
  Zap,
  PlayCircle,
  PauseCircle,
  Settings,
  Activity,
  TrendingUp
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getScheduledNotifications,
  createScheduledNotification,
  updateScheduledNotification,
  deleteScheduledNotification,
  processNotificationQueue,
  getNotificationRules,
  createNotificationRule,
  getNotificationMetrics
} from '../../lib/supabase-enhanced'

const NotificationEngine = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [scheduledNotifications, setScheduledNotifications] = useState([])
  const [notificationRules, setNotificationRules] = useState([])
  const [metrics, setMetrics] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [engineStatus, setEngineStatus] = useState('running')
  const [activeTab, setActiveTab] = useState('scheduled')
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineStatus === 'running') {
        loadData()
        processQueue()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [engineStatus])

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [scheduledResult, rulesResult, metricsResult] = await Promise.all([
        getScheduledNotifications(organizationId),
        getNotificationRules(organizationId),
        getNotificationMetrics(organizationId)
      ])

      if (scheduledResult.success) {
        setScheduledNotifications(scheduledResult.data)
      }
      if (rulesResult.success) {
        setNotificationRules(rulesResult.data)
      }
      if (metricsResult.success) {
        setMetrics(metricsResult.data)
      }
    } catch (error) {
      console.error('Failed to load notification engine data:', error)
      setError('Failed to load notification engine data')
    } finally {
      setLoading(false)
    }
  }

  const processQueue = async () => {
    if (processing) return
    
    setProcessing(true)
    try {
      const result = await processNotificationQueue(organizationId)
      if (result.success && result.processed > 0) {
        setSuccess(`Processed ${result.processed} notifications`)
        await loadData()
      }
    } catch (error) {
      console.error('Failed to process notification queue:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleEngineToggle = () => {
    setEngineStatus(prev => prev === 'running' ? 'paused' : 'running')
    setSuccess(`Notification engine ${engineStatus === 'running' ? 'paused' : 'started'}`)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'sent': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'permit_expiry':
      case 'permit_renewal':
        return <Shield className="h-4 w-4" />
      case 'document_approval':
        return <FileText className="h-4 w-4" />
      case 'audit_reminder':
        return <Calendar className="h-4 w-4" />
      case 'compliance_alert':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const renderEngineStatus = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${
            engineStatus === 'running' ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Activity className={`h-6 w-6 ${
              engineStatus === 'running' ? 'text-green-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
              Notification Engine
            </h3>
            <p className={`text-sm ${
              engineStatus === 'running' ? 'text-green-600' : 'text-gray-600'
            } ${textClass}`}>
              {engineStatus === 'running' ? 'Running' : 'Paused'}
              {processing && ' • Processing...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
              {metrics.total_processed || 0} processed today
            </p>
            <p className={`text-sm text-gray-500 ${textClass}`}>
              {metrics.pending_count || 0} pending
            </p>
          </div>
          
          <button
            onClick={handleEngineToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              engineStatus === 'running' 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            } ${textClass}`}
          >
            {engineStatus === 'running' ? (
              <>
                <PauseCircle className="h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  const renderMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Total Scheduled
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {scheduledNotifications.length}
            </p>
          </div>
          <Clock className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Active Rules
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {notificationRules.filter(r => r.enabled).length}
            </p>
          </div>
          <Settings className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Success Rate
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {metrics.success_rate || 0}%
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Processing
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {processing ? 'Active' : 'Idle'}
            </p>
          </div>
          <Zap className={`h-8 w-8 ${processing ? 'text-yellow-600' : 'text-gray-400'}`} />
        </div>
      </div>
    </div>
  )

  const renderScheduledNotifications = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Scheduled Notifications
        </h3>
      </div>
      
      {scheduledNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No scheduled notifications
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            Notifications will appear here when scheduled by the system or rules
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {scheduledNotifications.map((notification) => (
            <div key={notification.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-gray-900 ${textClass}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`text-xs text-gray-500 ${textClass}`}>
                        Scheduled: {formatDate(notification.scheduled_for)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                      <span className={`text-xs text-gray-500 ${textClass}`}>
                        {notification.notification_type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {notification.status === 'pending' && (
                    <button
                      onClick={() => {/* Handle cancel */}}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {notification.status === 'failed' && (
                    <button
                      onClick={() => {/* Handle retry */}}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderNotificationRules = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Notification Rules
        </h3>
        <button
          onClick={() => setShowCreateRule(true)}
          className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
        >
          <Settings className="h-4 w-4" />
          <span>Create Rule</span>
        </button>
      </div>
      
      {notificationRules.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No notification rules
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            Create rules to automatically generate notifications based on conditions
          </p>
          <button
            onClick={() => setShowCreateRule(true)}
            className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Settings className="h-4 w-4" />
            <span>Create First Rule</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {notificationRules.map((rule) => (
            <div key={rule.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className={`font-medium text-gray-900 ${textClass}`}>
                      {rule.name}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                    {rule.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-xs text-gray-500 ${textClass}`}>
                      Trigger: {rule.trigger_type}
                    </span>
                    <span className={`text-xs text-gray-500 ${textClass}`}>
                      Condition: {rule.condition}
                    </span>
                    <span className={`text-xs text-gray-500 ${textClass}`}>
                      Last run: {rule.last_run ? formatDate(rule.last_run) : 'Never'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {/* Handle edit */}}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {/* Handle toggle */}}
                    className={`text-sm ${
                      rule.enabled 
                        ? 'text-yellow-600 hover:text-yellow-700' 
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
          Notification Engine
        </h1>
        <p className={`text-gray-600 ${textClass}`}>
          Automated notification processing and rule management
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

      {renderEngineStatus()}
      {renderMetrics()}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'scheduled', label: 'Scheduled', count: scheduledNotifications.length },
            { id: 'rules', label: 'Rules', count: notificationRules.length },
            { id: 'logs', label: 'Logs', count: 0 }
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
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'scheduled' && renderScheduledNotifications()}
          {activeTab === 'rules' && renderNotificationRules()}
          {activeTab === 'logs' && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
                Notification Logs
              </h3>
              <p className={`text-gray-500 ${textClass}`}>
                Detailed logging and audit trail coming soon
              </p>
            </div>
          )}
        </>
      )}

      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-4 ${headerClass}`}>
                Create Notification Rule
              </h2>
              <button
                onClick={() => setShowCreateRule(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
              <p className={`text-gray-600 ${textClass}`}>
                Rule creation interface coming soon...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationEngine 