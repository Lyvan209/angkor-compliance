import { AlertTriangle, CheckCircle, Info, XCircle, Clock, X } from 'lucide-react'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'

const AlertWidget = ({ 
  alerts = [], 
  title = 'Alerts & Notifications',
  maxItems = 5,
  onDismiss,
  onViewAll,
  loading = false 
}) => {
  const { textClass, headerClass } = useLanguageStyles()

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertStyle = (type) => {
    switch (type) {
      case 'error':
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getAlertTextColor = (type) => {
    switch (type) {
      case 'error':
      case 'critical':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'success':
        return 'text-green-800'
      case 'info':
      default:
        return 'text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start space-x-3 p-3 mb-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displayAlerts = alerts.slice(0, maxItems)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          {title}
        </h3>
        {alerts.length > maxItems && onViewAll && (
          <button
            onClick={onViewAll}
            className={`text-sm text-amber-600 hover:text-amber-700 ${textClass}`}
          >
            View All ({alerts.length})
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {displayAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className={`text-gray-600 ${textClass}`}>
              No active alerts
            </p>
            <p className={`text-sm text-gray-500 ${textClass}`}>
              All systems are running smoothly
            </p>
          </div>
        ) : (
          displayAlerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className={`flex items-start space-x-3 p-3 rounded-md border ${getAlertStyle(alert.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`font-medium ${getAlertTextColor(alert.type)} ${textClass}`}>
                      {alert.title}
                    </p>
                    <p className={`text-sm ${getAlertTextColor(alert.type)} opacity-90 ${textClass}`}>
                      {alert.message}
                    </p>
                    {alert.timestamp && (
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-gray-500 mr-1" />
                        <span className={`text-xs text-gray-500 ${textClass}`}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(alert.id || index)}
                      className={`ml-2 p-1 rounded hover:bg-white hover:bg-opacity-50 ${getAlertTextColor(alert.type)}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`mt-2 text-sm font-medium ${getAlertTextColor(alert.type)} underline hover:no-underline ${textClass}`}
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className={`text-gray-600 ${textClass}`}>
              {alerts.filter(a => a.type === 'error' || a.type === 'critical').length} Critical
            </span>
            <span className={`text-gray-600 ${textClass}`}>
              {alerts.filter(a => a.type === 'warning').length} Warnings
            </span>
            <span className={`text-gray-600 ${textClass}`}>
              {alerts.filter(a => a.type === 'info').length} Info
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertWidget 