import { useState, useEffect } from 'react'
import { 
  LogOut, 
  User, 
  Settings, 
  BarChart3, 
  FileText, 
  Shield, 
  Users,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Building
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import { usePermissions } from '../hooks/usePermissions'
import LanguageSwitcher from './LanguageSwitcher'
import UserManagement from './UserManagement'
import UserProfile from './UserProfile'

const EnhancedDashboard = ({ user, onLogout }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  const permissions = usePermissions(user)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeView, setActiveView] = useState('dashboard')
  const [dashboardData, setDashboardData] = useState({
    permits: [],
    caps: [],
    grievances: [],
    audits: [],
    training: [],
    users: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API calls
      setDashboardData({
        permits: [
          { id: 1, title: 'Fire Safety Certificate', status: 'pending_renewal', expiry_date: '2024-06-19' },
          { id: 2, title: 'Environmental License', status: 'active', expiry_date: '2025-01-14' }
        ],
        caps: [
          { id: 1, title: 'Clear Emergency Exit', status: 'in_progress', due_date: '2024-02-15' },
          { id: 2, title: 'Overtime Control System', status: 'open', due_date: '2024-03-01' }
        ],
        grievances: [
          { id: 1, title: 'Unsafe working conditions', status: 'under_review', priority: 'high' },
          { id: 2, title: 'Excessive heat in production', status: 'submitted', priority: 'medium' }
        ],
        audits: [
          { id: 1, type: 'Social Compliance', score: 82.5, date: '2024-01-10' },
          { id: 2, type: 'Environmental Audit', score: 78.0, date: '2024-01-25' }
        ],
        training: [
          { id: 1, title: 'Fire Safety Training', participants: 25, scheduled: '2024-02-20' },
          { id: 2, title: 'OSH Training', participants: 40, scheduled: '2024-02-25' }
        ],
        users: [
          { id: 1, name: 'Sophea Chan', role: 'admin', active: true },
          { id: 2, name: 'Dara Kem', role: 'manager', active: true }
        ]
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation items based on permissions
  const getNavigationItems = () => {
    const items = []
    
    items.push({ id: 'dashboard', label: 'Dashboard', icon: BarChart3 })
    
    if (permissions.canAccessModule('users')) {
      items.push({ id: 'users', label: 'User Management', icon: Users })
    }
    
    if (permissions.canAccessModule('permits')) {
      items.push({ id: 'permits', label: 'Permits & Certificates', icon: FileText })
    }
    
    if (permissions.canAccessModule('audits')) {
      items.push({ id: 'audits', label: 'Audits & Compliance', icon: Shield })
    }
    
    if (permissions.canAccessModule('caps')) {
      items.push({ id: 'caps', label: 'Action Plans', icon: CheckCircle })
    }
    
    if (permissions.canAccessModule('grievances')) {
      items.push({ id: 'grievances', label: 'Grievances', icon: MessageSquare })
    }
    
    if (permissions.canAccessModule('training')) {
      items.push({ id: 'training', label: 'Training', icon: Calendar })
    }
    
    if (permissions.canAccessModule('reports')) {
      items.push({ id: 'reports', label: 'Reports', icon: TrendingUp })
    }
    
    items.push({ id: 'profile', label: 'Profile', icon: User })
    
    return items
  }

  const navigationItems = getNavigationItems()

  // Stats based on role and permissions
  const getStats = () => {
    const stats = []
    
    if (permissions.canAccessModule('permits')) {
      stats.push({
        title: 'Active Permits',
        value: dashboardData.permits.filter(p => p.status === 'active').length,
        total: dashboardData.permits.length,
        icon: FileText,
        color: 'bg-blue-500',
        trend: '+2 this month'
      })
    }
    
    if (permissions.canAccessModule('caps')) {
      stats.push({
        title: 'Open CAPs',
        value: dashboardData.caps.filter(c => c.status === 'open' || c.status === 'in_progress').length,
        total: dashboardData.caps.length,
        icon: CheckCircle,
        color: 'bg-green-500',
        trend: '-3 this week'
      })
    }
    
    if (permissions.canAccessModule('grievances')) {
      stats.push({
        title: 'Open Grievances',
        value: dashboardData.grievances.filter(g => g.status !== 'resolved').length,
        total: dashboardData.grievances.length,
        icon: MessageSquare,
        color: 'bg-yellow-500',
        trend: '+1 today'
      })
    }
    
    if (permissions.canAccessModule('audits')) {
      const latestAudit = dashboardData.audits[0]
      stats.push({
        title: 'Latest Audit Score',
        value: latestAudit ? `${latestAudit.score}%` : 'N/A',
        total: 100,
        icon: Shield,
        color: 'bg-purple-500',
        trend: latestAudit ? `${latestAudit.type}` : 'No audits'
      })
    }
    
    return stats
  }

  const stats = getStats()

  // Alert items based on permissions
  const getAlerts = () => {
    const alerts = []
    
    if (permissions.canAccessModule('permits')) {
      const expiringPermits = dashboardData.permits.filter(p => p.status === 'pending_renewal')
      if (expiringPermits.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Permits Expiring Soon',
          message: `${expiringPermits.length} permit(s) need renewal`,
          icon: AlertTriangle
        })
      }
    }
    
    if (permissions.canAccessModule('caps')) {
      const overdueCaps = dashboardData.caps.filter(c => 
        new Date(c.due_date) < new Date() && c.status !== 'completed'
      )
      if (overdueCaps.length > 0) {
        alerts.push({
          type: 'error',
          title: 'Overdue Action Plans',
          message: `${overdueCaps.length} CAP(s) are overdue`,
          icon: Clock
        })
      }
    }
    
    if (permissions.canAccessModule('grievances')) {
      const highPriorityGrievances = dashboardData.grievances.filter(g => 
        g.priority === 'high' && g.status !== 'resolved'
      )
      if (highPriorityGrievances.length > 0) {
        alerts.push({
          type: 'error',
          title: 'High Priority Grievances',
          message: `${highPriorityGrievances.length} grievance(s) need immediate attention`,
          icon: MessageSquare
        })
      }
    }
    
    return alerts
  }

  const alerts = getAlerts()

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className={`text-gray-600 ${textClass}`}>Loading dashboard...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium text-gray-600 ${textClass}`}>{stat.title}</p>
                  <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>{stat.value}</p>
                  <p className={`text-xs text-gray-500 ${textClass}`}>{stat.trend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
              Alerts & Notifications
            </h3>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`flex items-center p-3 rounded-md ${
                  alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <alert.icon className={`h-5 w-5 mr-3 ${
                    alert.type === 'error' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    } ${textClass}`}>
                      {alert.title}
                    </p>
                    <p className={`text-sm ${
                      alert.type === 'error' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    } ${textClass}`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                    CAP "Clear Emergency Exit" updated
                  </p>
                  <p className={`text-xs text-gray-500 ${textClass}`}>2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                    New grievance submitted
                  </p>
                  <p className={`text-xs text-gray-500 ${textClass}`}>4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                    Fire Safety training scheduled
                  </p>
                  <p className={`text-xs text-gray-500 ${textClass}`}>1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {permissions.canCreateCAPs() && (
                <button className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>Create CAP</p>
                </button>
              )}
              
              {permissions.canPerformAction('create', 'grievances') && (
                <button className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <MessageSquare className="h-5 w-5 text-blue-600 mb-2" />
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>Submit Grievance</p>
                </button>
              )}
              
              {permissions.canManageTraining() && (
                <button className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <Calendar className="h-5 w-5 text-purple-600 mb-2" />
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>Schedule Training</p>
                </button>
              )}
              
              {permissions.canViewReports() && (
                <button className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <TrendingUp className="h-5 w-5 text-orange-600 mb-2" />
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>View Reports</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement currentUser={user} onUserUpdate={loadDashboardData} />
      case 'profile':
        return <UserProfile user={user} onProfileUpdate={loadDashboardData} />
      default:
        return renderDashboardContent()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-amber-600 mr-2" />
                <h1 className={`text-xl font-bold text-gray-900 ${headerClass}`}>
                  Angkor Compliance
                </h1>
              </div>
              
              {/* Role Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                permissions.getRoleInfo().color.replace('text-', 'bg-').replace('-600', '-500')
              }`}>
                {permissions.getRoleInfo().label}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`text-sm text-gray-500 ${textClass}`}>
                {currentTime.toLocaleTimeString()}
              </div>
              <LanguageSwitcher variant="compact" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className={`font-medium text-gray-900 ${textClass}`}>
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className={`text-gray-500 ${textClass}`}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeView === item.id
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${textClass}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default EnhancedDashboard 