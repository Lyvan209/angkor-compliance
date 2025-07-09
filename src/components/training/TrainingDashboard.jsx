import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Users,
  Target,
  Award,
  TrendingUp,
  BarChart3,
  ,
  ,
  RefreshCw,
  ArrowRight,
  Calendar,
  ,
  Star,
  Layers,
  ,
  ,
  
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import TrainingModules from './TrainingModules'
import TrainingContent from './TrainingContent'
import Assessments from './Assessments'
import { 
  getTrainingDashboardData,
  getTrainingStatistics,
  getRecentActivity,
  getUpcomingDeadlines,
  getTopPerformers,
  getTrainingRecommendations
} from '../../lib/supabase-enhanced'

const TrainingDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [activeView, setActiveView] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        dashboardResult,
        statisticsResult,
        activityResult,
        deadlinesResult,
        performersResult,
        recommendationsResult
      ] = await Promise.all([
        getTrainingDashboardData(organizationId, user.id),
        getTrainingStatistics(organizationId),
        getRecentActivity(organizationId, user.id),
        getUpcomingDeadlines(organizationId, user.id),
        getTopPerformers(organizationId),
        getTrainingRecommendations(organizationId, user.id)
      ])

      if (dashboardResult.success) setDashboardData(dashboardResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (activityResult.success) setRecentActivity(activityResult.data)
      if (deadlinesResult.success) setUpcomingDeadlines(deadlinesResult.data)
      if (performersResult.success) setTopPerformers(performersResult.data)
      if (recommendationsResult.success) setRecommendations(recommendationsResult.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const renderStatistics = () => {
    if (!statistics) return null

    const stats = [
      {
        title: 'Total Modules',
        value: statistics.total_modules,
        icon: BookOpen,
        color: 'blue',
        trend: statistics.modules_trend,
        subtitle: `${statistics.new_modules_this_month} new this month`
      },
      {
        title: 'Active Learners',
        value: statistics.active_learners,
        icon: Users,
        color: 'green',
        trend: statistics.learners_trend,
        subtitle: `${statistics.engagement_rate}% engagement rate`
      },
      {
        title: 'Completion Rate',
        value: `${statistics.completion_rate}%`,
        icon: CheckCircle,
        color: 'purple',
        trend: statistics.completion_trend,
        subtitle: `${statistics.certificates_issued} certificates issued`
      },
      {
        title: 'Avg Assessment Score',
        value: `${statistics.average_score}%`,
        icon: Target,
        color: 'orange',
        trend: statistics.score_trend,
        subtitle: `${statistics.pass_rate}% pass rate`
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold text-${stat.color}-600 mt-1`}>
                  {stat.value}
                </p>
                <div className="mt-2 flex items-center">
                  <TrendingUp className={`h-4 w-4 mr-1 ${stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                  </span>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${textClass}`}>
                  {stat.subtitle}
                </p>
              </div>
              <div className={`h-12 w-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderQuickActions = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveView('modules')}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Browse Modules</p>
            <p className="text-sm text-gray-500">Explore training content</p>
          </div>
        </button>

        <button
          onClick={() => setActiveView('content')}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Layers className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Manage Content</p>
            <p className="text-sm text-gray-500">Create & organize materials</p>
          </div>
        </button>

        <button
          onClick={() => setActiveView('assessments')}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Take Assessments</p>
            <p className="text-sm text-gray-500">Test your knowledge</p>
          </div>
        </button>

        <button
          onClick={loadDashboardData}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Refresh Data</p>
            <p className="text-sm text-gray-500">Update dashboard</p>
          </div>
        </button>
      </div>
    </div>
  )

  const renderMyLearningProgress = () => {
    if (!dashboardData?.user_progress) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            My Learning Progress
          </h3>
          <button
            onClick={() => setActiveView('modules')}
            className={`flex items-center space-x-1 text-blue-600 hover:text-blue-700 ${textClass}`}
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {dashboardData.user_progress.length === 0 ? (
          <div className="text-center py-8">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
              Start Your Learning Journey
            </h4>
            <p className={`text-gray-500 mb-4 ${textClass}`}>
              Enroll in training modules to begin learning
            </p>
            <button
              onClick={() => setActiveView('modules')}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse Modules</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboardData.user_progress.slice(0, 3).map(progress => (
              <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {progress.module_title}
                  </h4>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    progress.status === 'completed' ? 'bg-green-100 text-green-800' :
                    progress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {progress.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900 font-medium">{progress.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      progress.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progress.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderRecentActivity = () => {
    if (!recentActivity.length) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                activity.type === 'module_completed' ? 'bg-green-100' :
                activity.type === 'assessment_taken' ? 'bg-blue-100' :
                activity.type === 'certificate_earned' ? 'bg-yellow-100' :
                'bg-gray-100'
              }`}>
                {activity.type === 'module_completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {activity.type === 'assessment_taken' && <Target className="h-4 w-4 text-blue-600" />}
                {activity.type === 'certificate_earned' && <Award className="h-4 w-4 text-yellow-600" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                  {activity.title}
                </p>
                <p className={`text-xs text-gray-500 ${textClass}`}>
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderUpcomingDeadlines = () => {
    if (!upcomingDeadlines.length) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Upcoming Deadlines
        </h3>
        <div className="space-y-4">
          {upcomingDeadlines.slice(0, 5).map((deadline, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                    {deadline.title}
                  </p>
                  <p className={`text-xs text-gray-500 ${textClass}`}>
                    Due: {new Date(deadline.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('modules')}
                className={`text-sm text-blue-600 hover:text-blue-700 ${textClass}`}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTopPerformers = () => {
    if (!topPerformers.length) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Top Performers
        </h3>
        <div className="space-y-4">
          {topPerformers.slice(0, 5).map((performer, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-100' :
                  index === 1 ? 'bg-gray-100' :
                  index === 2 ? 'bg-orange-100' :
                  'bg-blue-100'
                }`}>
                  {index < 3 ? (
                    <Award className={`h-4 w-4 ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      'text-orange-600'
                    }`} />
                  ) : (
                    <span className="text-xs font-medium text-blue-600">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                    {performer.name}
                  </p>
                  <p className={`text-xs text-gray-500 ${textClass}`}>
                    {performer.modules_completed} modules completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {performer.average_score}%
                </p>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                  <span className="text-xs text-gray-500">
                    {performer.rating}/5.0
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRecommendations = () => {
    if (!recommendations.length) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Recommended for You
        </h3>
        <div className="space-y-4">
          {recommendations.slice(0, 3).map((recommendation, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium text-gray-900 mb-1 ${textClass}`}>
                    {recommendation.title}
                  </h4>
                  <p className={`text-sm text-gray-600 mb-2 ${textClass}`}>
                    {recommendation.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Duration: {recommendation.duration} min</span>
                    <span>Difficulty: {recommendation.difficulty}</span>
                    <span>Rating: {recommendation.rating}/5.0</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('modules')}
                  className={`px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 ${textClass}`}
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex space-x-8 px-6">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'modules', label: 'Training Modules', icon: BookOpen },
          { id: 'content', label: 'Content Management', icon: Layers },
          { id: 'assessments', label: 'Assessments', icon: Target }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Training & Development
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Comprehensive learning management system with assessments and certifications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadDashboardData}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              Phase 6
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>
              Training
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderOverview = () => (
    <div>
      {renderStatistics()}
      {renderQuickActions()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderMyLearningProgress()}
        <div className="space-y-6">
          {renderRecentActivity()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUpcomingDeadlines()}
        {renderTopPerformers()}
      </div>
      
      <div className="mt-6">
        {renderRecommendations()}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'modules':
        return <TrainingModules user={user} organizationId={organizationId} />
      case 'content':
        return <TrainingContent user={user} organizationId={organizationId} />
      case 'assessments':
        return <Assessments user={user} organizationId={organizationId} />
      default:
        return renderOverview()
    }
  }

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
      {renderNavigation()}
      {renderContent()}
    </div>
  )
}

export default TrainingDashboard 