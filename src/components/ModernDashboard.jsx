import { useState, useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
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
  Building,
  Plus,
  Grid3X3,
  Layout
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import { usePermissions } from '../hooks/usePermissions'
import LanguageSwitcher from './LanguageSwitcher'
import StatWidget from './widgets/StatWidget'
import ChartWidget from './widgets/ChartWidget'
import AlertWidget from './widgets/AlertWidget'
import ActivityWidget from './widgets/ActivityWidget'

const ModernDashboard = ({ user, onLogout, onNavigate }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  const permissions = usePermissions(user)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    alerts: [],
    activities: [],
    charts: []
  })
  const [loading, setLoading] = useState(true)
  const [layoutMode, setLayoutMode] = useState('grid') // 'grid' or 'compact'
  const [currentView, setCurrentView] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [user, permissions])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Simulate API call - replace with actual data fetching
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setDashboardData({
        stats: getStatsData(),
        alerts: getAlertsData(),
        activities: getActivitiesData(),
        charts: getChartsData()
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatsData = () => {
    const stats = []
    
    if (permissions.canAccessModule('permits')) {
      stats.push({
        id: 'permits',
        title: 'Active Permits',
        value: '18',
        subtitle: 'out of 20 total',
        icon: FileText,
        color: 'bg-blue-500',
        trend: 'up',
        trendValue: '+2 this month',
        onClick: () => onNavigate?.('permits')
      })
    }
    
    if (permissions.canAccessModule('caps')) {
      stats.push({
        id: 'caps',
        title: 'Open CAPs',
        value: '7',
        subtitle: '3 overdue',
        icon: CheckCircle,
        color: 'bg-green-500',
        trend: 'down',
        trendValue: '-2 this week',
        onClick: () => onNavigate?.('caps')
      })
    }
    
    if (permissions.canAccessModule('grievances')) {
      stats.push({
        id: 'grievances',
        title: 'Active Grievances',
        value: '4',
        subtitle: '1 high priority',
        icon: MessageSquare,
        color: 'bg-yellow-500',
        trend: 'same',
        trendValue: 'No change',
        onClick: () => onNavigate?.('grievances')
      })
    }
    
    if (permissions.canAccessModule('audits')) {
      stats.push({
        id: 'audit_score',
        title: 'Latest Audit Score',
        value: '82.5%',
        subtitle: 'Social Compliance',
        icon: Shield,
        color: 'bg-purple-500',
        trend: 'up',
        trendValue: '+5.2% vs last audit',
        onClick: () => onNavigate?.('audits')
      })
    }
    
    if (permissions.canAccessModule('training')) {
      stats.push({
        id: 'training',
        title: 'Training Sessions',
        value: '12',
        subtitle: '3 this week',
        icon: Calendar,
        color: 'bg-indigo-500',
        trend: 'up',
        trendValue: '+4 scheduled',
        onClick: () => onNavigate?.('training')
      })
    }
    
    if (permissions.canManageUsers()) {
      stats.push({
        id: 'users',
        title: 'Active Users',
        value: '847',
        subtitle: '15 new this month',
        icon: Users,
        color: 'bg-orange-500',
        trend: 'up',
        trendValue: '+15 this month',
        onClick: () => onNavigate?.('users')
      })
    }
    
    return stats
  }

  const getAlertsData = () => {
    const alerts = []
    
    if (permissions.canAccessModule('permits')) {
      alerts.push({
        id: 'permit_expiry',
        type: 'warning',
        title: 'Permits Expiring Soon',
        message: 'Fire Safety Certificate expires in 15 days',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        action: {
          label: 'Review Permits',
          onClick: () => onNavigate?.('permits')
        }
      })
    }
    
    if (permissions.canAccessModule('caps')) {
      alerts.push({
        id: 'overdue_caps',
        type: 'error',
        title: 'Overdue Action Plans',
        message: '3 CAPs are past their due date',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        action: {
          label: 'View CAPs',
          onClick: () => onNavigate?.('caps')
        }
      })
    }
    
    if (permissions.canAccessModule('grievances')) {
      alerts.push({
        id: 'high_priority_grievance',
        type: 'error',
        title: 'High Priority Grievance',
        message: 'Safety concern requires immediate attention',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        action: {
          label: 'Handle Grievance',
          onClick: () => onNavigate?.('grievances')
        }
      })
    }
    
    if (permissions.canAccessModule('training')) {
      alerts.push({
        id: 'training_reminder',
        type: 'info',
        title: 'Training Reminder',
        message: 'OSH training scheduled for tomorrow',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        action: {
          label: 'View Training',
          onClick: () => onNavigate?.('training')
        }
      })
    }
    
    return alerts
  }

  const getActivitiesData = () => {
    return [
      {
        id: 1,
        type: 'cap',
        title: 'CAP "Clear Emergency Exit" updated',
        description: 'Progress updated to 75% completion',
        user: 'Pisach Lim',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'completed',
        link: {
          label: 'View CAP',
          onClick: () => onNavigate?.('caps')
        }
      },
      {
        id: 2,
        type: 'grievance',
        title: 'New grievance submitted',
        description: 'Workplace safety concern in production area',
        user: 'Anonymous',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'pending',
        link: {
          label: 'Review Grievance',
          onClick: () => onNavigate?.('grievances')
        }
      },
      {
        id: 3,
        type: 'training',
        title: 'Fire Safety training completed',
        description: '25 participants completed certification',
        user: 'Vibol Sok',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        id: 4,
        type: 'document',
        title: 'Environmental policy updated',
        description: 'Version 2.1 approved and published',
        user: 'Dara Kem',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        id: 5,
        type: 'user',
        title: 'New user account created',
        description: 'Production supervisor added to system',
        user: 'Sophea Chan',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'completed'
      }
    ]
  }

  const getChartsData = () => {
    return [
      {
        id: 'audit_trends',
        title: 'Audit Score Trends',
        subtitle: 'Last 6 months',
        type: 'line',
        data: [
          { label: 'Aug', value: 75 },
          { label: 'Sep', value: 78 },
          { label: 'Oct', value: 82 },
          { label: 'Nov', value: 79 },
          { label: 'Dec', value: 83 },
          { label: 'Jan', value: 85 }
        ]
      },
      {
        id: 'cap_completion',
        title: 'CAP Completion Rate',
        subtitle: 'Monthly performance',
        type: 'bar',
        data: [
          { label: 'Aug', value: 12 },
          { label: 'Sep', value: 18 },
          { label: 'Oct', value: 15 },
          { label: 'Nov', value: 22 },
          { label: 'Dec', value: 19 },
          { label: 'Jan', value: 25 }
        ]
      }
    ]
  }

  const getGridLayout = () => {
    const { stats, alerts, activities, charts } = dashboardData
    
    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatWidget
              key={stat.id}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              trendValue={stat.trendValue}
              onClick={stat.onClick}
              loading={loading}
            />
          ))}
        </div>

        {/* Charts Row */}
        {permissions.canViewReports() && charts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart) => (
              <ChartWidget
                key={chart.id}
                title={chart.title}
                subtitle={chart.subtitle}
                data={chart.data}
                type={chart.type}
                loading={loading}
                onMoreClick={() => onNavigate?.('reports')}
              />
            ))}
          </div>
        )}

        {/* Alerts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertWidget
            alerts={alerts}
            loading={loading}
            onViewAll={() => onNavigate?.('alerts')}
            onDismiss={(alertId) => {
              // Handle alert dismissal
              // Alert dismissed
            }}
          />
          
          <ActivityWidget
            activities={activities}
            loading={loading}
            onViewAll={() => onNavigate?.('activity')}
          />
        </div>
      </div>
    )
  }

  const getCompactLayout = () => {
    const { stats, alerts, activities } = dashboardData
    
    return (
      <div className="space-y-4">
        {/* Compact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {stats.slice(0, 6).map((stat) => (
            <StatWidget
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              onClick={stat.onClick}
              loading={loading}
            />
          ))}
        </div>

        {/* Compact Alerts and Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <AlertWidget
            alerts={alerts}
            maxItems={3}
            loading={loading}
            onViewAll={() => onNavigate?.('alerts')}
          />
          
          <div className="xl:col-span-2">
            <ActivityWidget
              activities={activities}
              maxItems={5}
              loading={loading}
              onViewAll={() => onNavigate?.('activity')}
            />
          </div>
        </div>
      </div>
    )
  }

  // Memoized navigation handler
  const handleNavigate = useCallback((view) => {
    setCurrentView(view)
    if (onNavigate) {
      onNavigate(view)
    }
  }, [onNavigate])

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout()
    }
  }, [onLogout])

  // Memoized alert dismissal
  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  // Memoized stats computation
  const dashboardStats = useMemo(() => {
    return {
      totalUsers: user?.organization?.user_count || 0,
      activePermits: user?.organization?.active_permits || 0,
      pendingGrievances: user?.organization?.pending_grievances || 0,
      complianceScore: user?.organization?.compliance_score || 0
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-amber-500`}>
                {permissions.getRoleInfo().label}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Layout Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="Grid Layout"
                >
                  <Grid3X3 className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setLayoutMode('compact')}
                  className={`p-1 rounded ${layoutMode === 'compact' ? 'bg-white shadow-sm' : ''}`}
                  title="Compact Layout"
                >
                  <Layout className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
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
                onClick={handleLogout}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-3xl font-bold text-gray-900 ${headerClass}`}>
                Welcome back, {user?.user_metadata?.full_name || 'User'}!
              </h2>
              <p className={`mt-2 text-gray-600 ${textClass}`}>
                Here's what's happening with your compliance management today.
              </p>
            </div>
            
            {permissions.canCreateCAPs() && (
              <button
                onClick={() => onNavigate?.('create-cap')}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${textClass}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create CAP
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Content */}
        {layoutMode === 'grid' ? getGridLayout() : getCompactLayout()}
      </main>
    </div>
  )
}

ModernDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired
}

export default ModernDashboard 