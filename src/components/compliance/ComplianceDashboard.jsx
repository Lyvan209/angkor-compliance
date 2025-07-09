import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  Settings,
  Plus,
  Eye,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  checkPermitCompliance,
  getPermitStatistics,
  generatePermitAlerts,
  getExpiringPermits
} from '../../lib/supabase-enhanced'
import PermitTracker from './PermitTracker'
import PermitAlerts from './PermitAlerts'

const ComplianceDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [complianceData, setComplianceData] = useState(null)
  const [statistics, setStatistics] = useState({})
  const [alerts, setAlerts] = useState([])
  const [recentPermits, setRecentPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview')
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [complianceResult, statsResult, alertsResult, recentResult] = await Promise.all([
        checkPermitCompliance(organizationId),
        getPermitStatistics(organizationId),
        generatePermitAlerts(organizationId),
        getExpiringPermits(organizationId, 30)
      ])

      if (complianceResult.success) {
        setComplianceData(complianceResult.data)
      }
      
      if (statsResult.success) {
        setStatistics(statsResult.data)
      }
      
      if (alertsResult.success) {
        setAlerts(alertsResult.data.slice(0, 5)) // Top 5 alerts
      }
      
      if (recentResult.success) {
        setRecentPermits(recentResult.data.slice(0, 5)) // Next 5 expiring
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load compliance data')
    } finally {
      setLoading(false)
    }
  }

  const getComplianceLevel = () => {
    if (!complianceData) return { level: 'unknown', color: 'gray' }
    
    const percentage = complianceData.compliance_percentage || 0
    
    if (percentage >= 95) return { level: 'excellent', color: 'green' }
    if (percentage >= 85) return { level: 'good', color: 'blue' }
    if (percentage >= 70) return { level: 'fair', color: 'yellow' }
    return { level: 'poor', color: 'red' }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderOverviewDashboard = () => (
    <div className="space-y-6">
      {/* Compliance Status Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${headerClass}`}>
              Compliance Overview
            </h2>
            <p className={`text-blue-100 ${textClass}`}>
              Monitor permits, certificates, and compliance status
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {complianceData?.compliance_percentage || 0}%
            </div>
            <div className={`text-sm text-blue-100 ${textClass}`}>
              Overall Compliance
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Permits
              </p>
              <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
                {statistics.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs text-gray-500 ${textClass}`}>
              All permits tracked
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Active
              </p>
              <p className={`text-2xl font-bold text-green-600 ${headerClass}`}>
                {statistics.active || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs text-green-600 flex items-center ${textClass}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              In compliance
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Expiring Soon
              </p>
              <p className={`text-2xl font-bold text-yellow-600 ${headerClass}`}>
                {statistics.expiring || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs text-yellow-600 ${textClass}`}>
              Next 30 days
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Critical Alerts
              </p>
              <p className={`text-2xl font-bold text-red-600 ${headerClass}`}>
                {alerts.filter(a => a.priority === 'critical').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs text-red-600 flex items-center ${textClass}`}>
              <TrendingDown className="h-3 w-3 mr-1" />
              Needs attention
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <Shield className="h-5 w-5 mr-2" />
            Compliance Health
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium text-gray-700 ${textClass}`}>
                  Overall Compliance
                </span>
                <span className={`text-sm font-semibold ${getComplianceLevel().color === 'green' ? 'text-green-600' : 
                  getComplianceLevel().color === 'blue' ? 'text-blue-600' :
                  getComplianceLevel().color === 'yellow' ? 'text-yellow-600' : 'text-red-600'} ${textClass}`}>
                  {complianceData?.compliance_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    getComplianceLevel().color === 'green' ? 'bg-green-500' :
                    getComplianceLevel().color === 'blue' ? 'bg-blue-500' :
                    getComplianceLevel().color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${complianceData?.compliance_percentage || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className={`text-2xl font-bold text-green-600 ${headerClass}`}>
                  {complianceData?.compliant_permits || 0}
                </div>
                <div className={`text-sm text-green-700 ${textClass}`}>
                  Compliant
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className={`text-2xl font-bold text-red-600 ${headerClass}`}>
                  {(complianceData?.expiring_permits || 0) + (complianceData?.overdue_permits || 0)}
                </div>
                <div className={`text-sm text-red-700 ${textClass}`}>
                  At Risk
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${headerClass}`}>
            <Bell className="h-5 w-5 mr-2" />
            Recent Alerts
          </h3>
          
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className={`text-green-600 text-sm ${textClass}`}>
                  All permits up to date
                </p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100">
                  <div className={`p-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 truncate ${textClass}`}>
                      {alert.title}
                    </p>
                    <p className={`text-xs text-gray-500 ${textClass}`}>
                      {alert.message}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                </div>
              ))
            )}
          </div>
          
          {alerts.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setActiveView('alerts')}
                className={`w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium ${textClass}`}
              >
                View All Alerts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Expirations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 flex items-center ${headerClass}`}>
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Expirations
          </h3>
          <button
            onClick={() => setActiveView('tracker')}
            className={`text-blue-600 hover:text-blue-700 text-sm font-medium ${textClass}`}
          >
            View All Permits
          </button>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : recentPermits.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className={`text-green-600 text-sm ${textClass}`}>
                No permits expiring in the next 30 days
              </p>
            </div>
          ) : (
            recentPermits.map((permit) => {
              const daysUntilExpiry = Math.ceil((new Date(permit.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
              
              return (
                <div key={permit.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      daysUntilExpiry <= 7 ? 'bg-red-100' :
                      daysUntilExpiry <= 14 ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <FileText className={`h-4 w-4 ${
                        daysUntilExpiry <= 7 ? 'text-red-600' :
                        daysUntilExpiry <= 14 ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium text-gray-900 ${textClass}`}>
                        {permit.title}
                      </p>
                      <p className={`text-sm text-gray-500 ${textClass}`}>
                        {permit.permit_number} • Expires {formatDate(permit.expiry_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${
                      daysUntilExpiry <= 7 ? 'text-red-600' :
                      daysUntilExpiry <= 14 ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {daysUntilExpiry} days
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveView('add-permit')}
          className={`flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors ${textClass}`}
        >
          <Plus className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600">Add New Permit</span>
        </button>
        
        <button
          onClick={() => setActiveView('tracker')}
          className={`flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${textClass}`}
        >
          <Eye className="h-5 w-5" />
          <span>View All Permits</span>
        </button>
        
        <button
          onClick={() => setActiveView('reports')}
          className={`flex items-center justify-center space-x-2 p-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ${textClass}`}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Generate Report</span>
        </button>
      </div>
    </div>
  )

  if (loading && !complianceData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-3xl font-bold text-gray-900 ${headerClass}`}>
            Compliance Management
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-md ${
                activeView === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${textClass}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('tracker')}
              className={`px-4 py-2 rounded-md ${
                activeView === 'tracker' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${textClass}`}
            >
              Permit Tracker
            </button>
            <button
              onClick={() => setActiveView('alerts')}
              className={`px-4 py-2 rounded-md ${
                activeView === 'alerts' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${textClass}`}
            >
              Alerts
            </button>
          </div>
        </div>
        
        <p className={`text-gray-600 ${textClass}`}>
          Monitor permit compliance, track expirations, and manage regulatory requirements
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {/* View Content */}
      {activeView === 'overview' && renderOverviewDashboard()}
      {activeView === 'tracker' && (
        <PermitTracker user={user} organizationId={organizationId} />
      )}
      {activeView === 'alerts' && (
        <PermitAlerts user={user} organizationId={organizationId} />
      )}
    </div>
  )
}

export default ComplianceDashboard 