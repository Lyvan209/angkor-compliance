import { Clock, User, FileText, CheckCircle, MessageSquare, Calendar, ArrowRight } from 'lucide-react'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'

const ActivityWidget = ({ 
  activities = [], 
  title = 'Recent Activity',
  maxItems = 10,
  onViewAll,
  loading = false 
}) => {
  const { textClass, headerClass } = useLanguageStyles()

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'cap':
      case 'task':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'grievance':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      case 'meeting':
      case 'training':
        return <Calendar className="h-4 w-4 text-indigo-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'user':
        return 'bg-blue-500'
      case 'document':
        return 'bg-green-500'
      case 'cap':
      case 'task':
        return 'bg-purple-500'
      case 'grievance':
        return 'bg-orange-500'
      case 'meeting':
      case 'training':
        return 'bg-indigo-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return time.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displayActivities = activities.slice(0, maxItems)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          {title}
        </h3>
        {activities.length > maxItems && onViewAll && (
          <button
            onClick={onViewAll}
            className={`text-sm text-amber-600 hover:text-amber-700 flex items-center ${textClass}`}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className={`text-gray-600 ${textClass}`}>
              No recent activity
            </p>
            <p className={`text-sm text-gray-500 ${textClass}`}>
              Activity will appear here as it happens
            </p>
          </div>
        ) : (
          displayActivities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-start space-x-3 group">
              {/* Activity Icon */}
              <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className={`text-sm text-gray-600 ${textClass}`}>
                        {activity.description}
                      </p>
                    )}
                    {activity.user && (
                      <p className={`text-xs text-gray-500 ${textClass}`}>
                        by {activity.user}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end ml-4">
                    <span className={`text-xs text-gray-500 ${textClass}`}>
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    {activity.status && (
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                </div>

                {activity.link && (
                  <button
                    onClick={activity.link.onClick}
                    className={`text-xs text-amber-600 hover:text-amber-700 mt-1 ${textClass}`}
                  >
                    {activity.link.label} →
                  </button>
                )}
              </div>

              {/* Connector Line */}
              {index < displayActivities.length - 1 && (
                <div className="absolute left-7 mt-8 w-0.5 h-4 bg-gray-200"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Activity Summary */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className={`text-sm text-gray-600 ${textClass}`}>
              {activities.length} total activities
            </span>
            <span className={`text-sm text-gray-600 ${textClass}`}>
              Last updated: {formatTimeAgo(activities[0]?.timestamp || new Date())}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityWidget 