import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Settings, 
  Filter, 
  Search,
  Clock,
  Users,
  FileText,
  Shield,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  Plus,
  Send
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  createNotification,
  getNotificationStatistics
} from '../../lib/supabase-enhanced'

const NotificationCenter = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [notifications, setNotifications] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const [settings, setSettings] = useState({})
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadNotificationData()
  }, [user.id, organizationId])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, selectedType, activeTab])

  const loadNotificationData = async () => {
    setLoading(true)
    try {
      const [notificationsResult, settingsResult, statsResult] = await Promise.all([
        getNotificationsByUser(user.id, organizationId),
        getNotificationSettings(user.id),
        getNotificationStatistics(user.id, organizationId)
      ])

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data)
      }
      if (settingsResult.success) {
        setSettings(settingsResult.data)
      }
      if (statsResult.success) {
        setStatistics(statsResult.data)
      }
    } catch (error) {
      console.error('Failed to load notification data:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read_at)
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.read_at)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType)
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setFilteredNotifications(filtered)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markNotificationAsRead(notificationId, user.id)
      if (result.success) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date() } : n
        ))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead(user.id, organizationId)
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date() })))
        setSuccess('All notifications marked as read')
      }
    } catch (error) {
      setError('Failed to mark all notifications as read')
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await deleteNotification(notificationId, user.id)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setSuccess('Notification deleted')
      }
    } catch (error) {
      setError('Failed to delete notification')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return

    const confirmed = window.confirm(`Delete ${selectedNotifications.length} notification(s)?`)
    if (!confirmed) return

    try {
      for (const notificationId of selectedNotifications) {
        await deleteNotification(notificationId, user.id)
      }
      
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)))
      setSelectedNotifications([])
      setSuccess(`${selectedNotifications.length} notification(s) deleted`)
    } catch (error) {
      setError('Failed to delete notifications')
    }
  }

  const handleNotificationSelect = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / 60000)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getNotificationIcon = (type, priority) => {
    const iconClass = `h-5 w-5 ${
      priority === 'high' ? 'text-red-500' :
      priority === 'medium' ? 'text-yellow-500' :
      'text-blue-500'
    }`

    switch (type) {
      case 'permit_expiry':
      case 'permit_renewal':
        return <Shield className={iconClass} />
      case 'document_approval':
      case 'document_update':
        return <FileText className={iconClass} />
      case 'audit_scheduled':
      case 'audit_reminder':
        return <Calendar className={iconClass} />
      case 'compliance_alert':
        return <AlertTriangle className={iconClass} />
      case 'system_notification':
        return <Bell className={iconClass} />
      case 'user_invitation':
        return <Users className={iconClass} />
      default:
        return <Info className={iconClass} />
    }
  }

  const getNotificationTypeLabel = (type) => {
    const types = {
      'permit_expiry': 'Permit Expiry',
      'permit_renewal': 'Permit Renewal',
      'document_approval': 'Document Approval',
      'document_update': 'Document Update',
      'audit_scheduled': 'Audit Scheduled',
      'audit_reminder': 'Audit Reminder',
      'compliance_alert': 'Compliance Alert',
      'system_notification': 'System Notification',
      'user_invitation': 'User Invitation'
    }
    return types[type] || type
  }

  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Total Notifications
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {statistics.total || 0}
            </p>
          </div>
          <Bell className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Unread
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {statistics.unread || 0}
            </p>
          </div>
          <BellOff className="h-8 w-8 text-red-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              High Priority
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {statistics.high_priority || 0}
            </p>
          </div>
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              This Week
            </p>
            <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {statistics.this_week || 0}
            </p>
          </div>
          <Clock className="h-8 w-8 text-green-600" />
        </div>
      </div>
    </div>
  )

  const renderFiltersAndActions = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Types</option>
            <option value="permit_expiry">Permit Expiry</option>
            <option value="permit_renewal">Permit Renewal</option>
            <option value="document_approval">Document Approval</option>
            <option value="audit_scheduled">Audit Scheduled</option>
            <option value="compliance_alert">Compliance Alert</option>
            <option value="system_notification">System</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm text-gray-600 ${textClass}`}>
                {selectedNotifications.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleMarkAllAsRead}
            className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mark All Read</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderNotificationList = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No notifications found
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            {searchQuery || selectedType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'You\'re all caught up!'
            }
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                !notification.read_at ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => handleNotificationSelect(notification.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium text-gray-900 ${textClass} ${
                          !notification.read_at ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.read_at && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-xs text-gray-500 ${textClass}`}>
                          {formatDate(notification.created_at)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.priority}
                        </span>
                        <span className={`text-xs text-gray-500 ${textClass}`}>
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read_at && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Mark as read"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
          Notification Center
        </h1>
        <p className={`text-gray-600 ${textClass}`}>
          Manage your alerts, notifications, and system messages
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

      {renderStatistics()}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'all', label: 'All Notifications', count: notifications.length },
            { id: 'unread', label: 'Unread', count: notifications.filter(n => !n.read_at).length },
            { id: 'read', label: 'Read', count: notifications.filter(n => n.read_at).length }
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

      {renderFiltersAndActions()}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderNotificationList()
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${headerClass}`}>
                  Notification Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Settings content will be added */}
              <p className={`text-gray-600 ${textClass}`}>
                Notification settings coming soon...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${headerClass}`}>
                  Create Notification
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Create form content will be added */}
              <p className={`text-gray-600 ${textClass}`}>
                Create notification form coming soon...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

NotificationCenter.propTypes = {
  user: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired
}

export default NotificationCenter 