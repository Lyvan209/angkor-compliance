import { useState, useEffect } from 'react'
import { LogOut, User, Settings, BarChart3, FileText, Shield } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslations } from '../translations'
import { useLanguageStyles } from '../hooks/useLanguageStyles'
import LanguageSwitcher from './LanguageSwitcher'

const Dashboard = ({ user, onLogout }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const stats = [
    {
      title: t.totalComplianceReports,
      value: '24',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: t.securityScore,
      value: '95%',
      icon: Shield,
      color: 'bg-green-500'
    },
    {
      title: t.activePolicies,
      value: '12',
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      title: t.lastAudit,
      value: `2 ${t.daysAgo}`,
      icon: Settings,
      color: 'bg-orange-500'
    }
  ]

  const activities = [
    {
      text: t.securityAuditCompleted,
      time: `2 ${t.hoursAgo}`,
      color: 'bg-green-500'
    },
    {
      text: t.newCompliancePolicyAdded,
      time: `1 ${t.dayAgo}`,
      color: 'bg-blue-500'
    },
    {
      text: t.riskAssessmentUpdated,
      time: `3 ${t.daysAgo}`,
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className={`text-xl font-bold text-gray-900 ${headerClass}`}>{t.angkorCompliance}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-sm text-gray-500 ${textClass}`}>
                {currentTime.toLocaleTimeString()}
              </div>
              <LanguageSwitcher variant="compact" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-sm">
                  <p className={`font-medium text-gray-900 ${textClass}`}>{user?.user_metadata?.full_name || 'User'}</p>
                  <p className={`text-gray-500 ${textClass}`}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${textClass}`}
              >
                <LogOut className="h-4 w-4" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${headerClass}`}>
              {t.welcomeBack}, {user?.user_metadata?.full_name || 'User'}!
            </h2>
            <p className={`text-gray-600 ${textClass}`}>
              {t.dashboardOverview}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium text-gray-600 ${textClass}`}>{stat.title}</p>
                    <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>{t.recentActivity}</h3>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                  <div>
                    <p className={`text-sm font-medium text-gray-900 ${textClass}`}>{activity.text}</p>
                    <p className={`text-xs text-gray-500 ${textClass}`}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard 