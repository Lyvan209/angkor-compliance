import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  RefreshCw, 
  Clock, 
  Activity,
  AlertTriangle,
  Calendar,
  Plus,
  Filter,
  TrendingUp
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import ComplianceMetrics from './ComplianceMetrics'
import RealTimeAlerts from './RealTimeAlerts'
import ComplianceHeatmap from './ComplianceHeatmap'
import HistoricalTrends from './HistoricalTrends'
import { 
  getAuditActivities,
  getUpcomingAudits,
  getComplianceByCategory
} from '../../lib/supabase-enhanced'

const AuditDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [auditActivities, setAuditActivities] = useState([])
  const [upcomingAudits, setUpcomingAudits] = useState([])
  const [complianceByCategory, setComplianceByCategory] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [organizationId, selectedPeriod])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData(false) // Silent refresh
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')

    try {
      const [activitiesResult, auditsResult, categoryResult] = await Promise.all([
        getAuditActivities(organizationId, { limit: 10 }),
        getUpcomingAudits(organizationId, 5),
        getComplianceByCategory(organizationId)
      ])

      if (activitiesResult.success) setAuditActivities(activitiesResult.data)
      if (auditsResult.success) setUpcomingAudits(auditsResult.data)
      if (categoryResult.success) setComplianceByCategory(categoryResult.data)

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      if (showLoading) setLoading(false)
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

  const getStatusIcon = (status) => {
    const iconClass = "h-5 w-5"
    switch (status) {
      case 'compliant':
        return <div className={`${iconClass} text-green-600 bg-green-100 rounded-full p-1`}>✓</div>
      case 'non_compliant':
        return <div className={`${iconClass} text-red-600 bg-red-100 rounded-full p-1`}>✗</div>
      case 'pending':
        return <Clock className={`${iconClass} text-yellow-600`} />
      default:
        return <Clock className={`${iconClass} text-gray-600`} />
    }
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Real-time Audit Dashboard
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Live compliance monitoring and audit oversight
          </p>
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className={`text-sm text-green-600 ${textClass}`}>Live</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className={`text-sm text-gray-500 ${textClass}`}>
                Updated {formatDate(lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className={`text-sm text-gray-700 ${textClass}`}>Auto-refresh</span>
          </label>

          <button
            onClick={() => loadDashboardData()}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderRecentActivity = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Recent Audit Activity
        </h3>
        <button className={`text-blue-600 hover:text-blue-700 text-sm ${textClass}`}>
          View All
        </button>
      </div>
      
      {auditActivities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No recent activity
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            Audit activities will appear here as they occur
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {auditActivities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {activity.title}
                  </h4>
                  <span className={`text-sm text-gray-500 ${textClass}`}>
                    {formatDate(activity.created_at)}
                  </span>
                </div>
                <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                  {activity.description}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'compliant' ? 'bg-green-100 text-green-800' :
                    activity.status === 'non_compliant' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs text-gray-500 ${textClass}`}>
                    {activity.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderComplianceOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Compliance by Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-6 ${headerClass}`}>
          Compliance by Category
        </h3>
        <div className="space-y-4">
          {complianceByCategory.length === 0 ? (
            <div className="text-center py-4">
              <p className={`text-gray-500 ${textClass}`}>
                No compliance data available
              </p>
            </div>
          ) : (
            complianceByCategory.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium text-gray-900 ${textClass}`}>
                      {item.category || 'General'}
                    </span>
                    <span className={`text-sm text-gray-600 ${textClass}`}>
                      {item.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.score >= 90 ? 'bg-green-600' : 
                        item.score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Audits */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Upcoming Audits
          </h3>
          <button className={`flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 ${textClass}`}>
            <Plus className="h-4 w-4" />
            <span>Schedule</span>
          </button>
        </div>
        <div className="space-y-4">
          {upcomingAudits.length === 0 ? (
            <div className="text-center py-4">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className={`text-gray-500 ${textClass}`}>
                No upcoming audits scheduled
              </p>
            </div>
          ) : (
            upcomingAudits.map((audit, index) => (
              <div key={audit.id || index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {audit.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`text-sm text-gray-600 ${textClass}`}>
                      {new Date(audit.scheduled_date).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      audit.type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {audit.type?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderHeader()}
      
      <ComplianceMetrics 
        organizationId={organizationId} 
        selectedPeriod={selectedPeriod} 
      />
      
      {renderComplianceOverview()}
      
      <ComplianceHeatmap 
        organizationId={organizationId}
        selectedPeriod={selectedPeriod}
      />
      
      <div className="mt-6">
        <HistoricalTrends 
          organizationId={organizationId}
          selectedPeriod={selectedPeriod}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {renderRecentActivity()}
        <RealTimeAlerts 
          organizationId={organizationId}
          autoRefresh={autoRefresh}
          refreshInterval={30}
        />
      </div>
    </div>
  )
}

export default AuditDashboard 