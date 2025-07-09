import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Bell,
  Filter,
  Refresh
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getRealTimeAlerts, 
  markAlertAsResolved,
  getAlertStatistics 
} from '../../lib/supabase-enhanced'

const RealTimeAlerts = ({ organizationId, autoRefresh = true, refreshInterval = 30 }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [alerts, setAlerts] = useState([])
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, high, medium, low
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    loadAlerts()
  }, [organizationId])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAlerts(false) // Silent refresh
      }, refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const loadAlerts = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      const [alertsResult, statsResult] = await Promise.all([
        getRealTimeAlerts(organizationId),
        getAlertStatistics(organizationId)
      ])

      if (alertsResult.success) {
        setAlerts(alertsResult.data)
      }
      if (statsResult.success) {
        setStatistics(statsResult.data)
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId) => {
    try {
      const result = await markAlertAsResolved(alertId, organizationId)
      if (result.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.priority === filter
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 text-red-900'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900'
      case 'low':
        return 'border-blue-500 bg-blue-50 text-blue-900'
      default:
        return 'border-gray-500 bg-gray-50 text-gray-900'
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-200 text-red-800'
      case 'medium':
        return 'bg-yellow-200 text-yellow-800'
      case 'low':
        return 'bg-blue-200 text-blue-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Real-time Alerts
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`text-sm text-green-600 ${textClass}`}>Live</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`text-sm px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Alerts</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Manual Refresh */}
          <button
            onClick={() => loadAlerts()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            title="Refresh alerts"
          >
            <Refresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
            {statistics.total || 0}
          </p>
          <p className={`text-sm text-gray-600 ${textClass}`}>Total</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold text-red-600 ${headerClass}`}>
            {statistics.high || 0}
          </p>
          <p className={`text-sm text-gray-600 ${textClass}`}>High</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold text-yellow-600 ${headerClass}`}>
            {statistics.medium || 0}
          </p>
          <p className={`text-sm text-gray-600 ${textClass}`}>Medium</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold text-blue-600 ${headerClass}`}>
            {statistics.low || 0}
          </p>
          <p className={`text-sm text-gray-600 ${textClass}`}>Low</p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Clock className="h-4 w-4" />
        <span className={textClass}>
          Updated {formatDate(lastUpdated)}
        </span>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            {filter === 'all' ? 'All Clear' : `No ${filter} priority alerts`}
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            {filter === 'all' 
              ? 'No active alerts at this time'
              : `No ${filter} priority alerts currently active`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className={`font-medium ${textClass}`}>
                      {alert.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${textClass}`}>
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={textClass}>
                      {formatDate(alert.created_at)}
                    </span>
                    {alert.source && (
                      <span className={`px-2 py-1 bg-gray-100 text-gray-700 rounded ${textClass}`}>
                        {alert.source}
                      </span>
                    )}
                    {alert.category && (
                      <span className={textClass}>
                        Category: {alert.category}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className={`text-sm px-3 py-1 rounded-md hover:bg-opacity-80 transition-colors ${
                      alert.priority === 'high' ? 'bg-red-200 text-red-800 hover:bg-red-300' :
                      alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' :
                      'bg-blue-200 text-blue-800 hover:bg-blue-300'
                    } ${textClass}`}
                  >
                    Resolve
                  </button>
                  
                  {alert.actions && alert.actions.length > 0 && (
                    <button className={`text-sm text-gray-600 hover:text-gray-800 ${textClass}`}>
                      View Details
                    </button>
                  )}
                </div>
              </div>
              
              {/* Alert Actions */}
              {alert.actions && alert.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className={`text-xs text-gray-600 mb-2 ${textClass}`}>
                    Recommended Actions:
                  </p>
                  <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                    {alert.actions.map((action, index) => (
                      <li key={index} className={textClass}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RealTimeAlerts 