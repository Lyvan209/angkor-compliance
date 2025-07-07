import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users,
  FileText,
  Clock,
  Target,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Download,
  Share2,
  ArrowRight,
  User,
  MapPin,
  Video,
  Repeat,
  Bell
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import MeetingManagement from './MeetingManagement'
import CommitteeManagement from './CommitteeManagement'
import MeetingAgenda from './MeetingAgenda'
import MeetingMinutes from './MeetingMinutes'
import { 
  getMeetingDashboardData,
  getMeetingStatistics,
  getUpcomingMeetings,
  getRecentMeetings,
  getMeetingAnalytics,
  getCommitteeOverview,
  getActionItemsSummary
} from '../../lib/supabase-enhanced'

const MeetingDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [activeView, setActiveView] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [recentMeetings, setRecentMeetings] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [committeeOverview, setCommitteeOverview] = useState(null)
  const [actionItems, setActionItems] = useState([])
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
        upcomingResult,
        recentResult,
        analyticsResult,
        committeeResult,
        actionItemsResult
      ] = await Promise.all([
        getMeetingDashboardData(organizationId),
        getMeetingStatistics(organizationId),
        getUpcomingMeetings(organizationId),
        getRecentMeetings(organizationId),
        getMeetingAnalytics(organizationId),
        getCommitteeOverview(organizationId),
        getActionItemsSummary(organizationId)
      ])

      if (dashboardResult.success) setDashboardData(dashboardResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (upcomingResult.success) setUpcomingMeetings(upcomingResult.data)
      if (recentResult.success) setRecentMeetings(recentResult.data)
      if (analyticsResult.success) setAnalytics(analyticsResult.data)
      if (committeeResult.success) setCommitteeOverview(committeeResult.data)
      if (actionItemsResult.success) setActionItems(actionItemsResult.data)
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
        title: 'Total Meetings',
        value: statistics.total_meetings,
        icon: Calendar,
        color: 'blue',
        trend: statistics.meetings_trend,
        subtitle: `${statistics.meetings_this_month} this month`
      },
      {
        title: 'Active Committees',
        value: statistics.active_committees,
        icon: Users,
        color: 'green',
        trend: statistics.committees_trend,
        subtitle: `${statistics.total_members} total members`
      },
      {
        title: 'Attendance Rate',
        value: `${statistics.attendance_rate}%`,
        icon: CheckCircle,
        color: 'purple',
        trend: statistics.attendance_trend,
        subtitle: `Avg: ${statistics.avg_attendees} per meeting`
      },
      {
        title: 'Action Items',
        value: statistics.active_action_items,
        icon: Target,
        color: 'orange',
        trend: statistics.completion_trend,
        subtitle: `${statistics.completion_rate}% completion rate`
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
          onClick={() => setActiveView('meetings')}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Schedule Meeting</p>
            <p className="text-sm text-gray-500">Create new meetings</p>
          </div>
        </button>

        <button
          onClick={() => setActiveView('committees')}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Manage Committees</p>
            <p className="text-sm text-gray-500">Organize teams & workflows</p>
          </div>
        </button>

        <button
          onClick={() => setActiveView('agenda')}
          className={`flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${textClass}`}
        >
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Create Agenda</p>
            <p className="text-sm text-gray-500">Plan meeting topics</p>
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

  const renderUpcomingMeetings = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Upcoming Meetings
        </h3>
        <button
          onClick={() => setActiveView('meetings')}
          className={`flex items-center space-x-1 text-blue-600 hover:text-blue-700 ${textClass}`}
        >
          <span>View All</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {upcomingMeetings.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Upcoming Meetings
          </h4>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            Schedule a meeting to get started
          </p>
          <button
            onClick={() => setActiveView('meetings')}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingMeetings.slice(0, 5).map(meeting => (
            <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className={`font-medium text-gray-900 ${textClass}`}>
                      {meeting.title}
                    </h4>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {meeting.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(meeting.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(meeting.start_time).toLocaleTimeString()}</span>
                    </div>
                    {meeting.is_virtual ? (
                      <div className="flex items-center space-x-1">
                        <Video className="h-4 w-4" />
                        <span>Virtual</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location || 'TBD'}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{meeting.attendee_count} attendees</span>
                    </div>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderRecentMeetings = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
        Recent Meetings
      </h3>

      {recentMeetings.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className={`text-gray-500 text-sm ${textClass}`}>
            No recent meetings
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentMeetings.slice(0, 5).map(meeting => (
            <div key={meeting.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className={`font-medium text-gray-900 ${textClass}`}>
                    {meeting.title}
                  </p>
                  <p className={`text-sm text-gray-500 ${textClass}`}>
                    {new Date(meeting.end_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {meeting.has_minutes && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <FileText className="h-3 w-3 mr-1" />
                    Minutes
                  </span>
                )}
                <button className="text-blue-600 hover:text-blue-700">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderActionItems = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
        Outstanding Action Items
      </h3>

      {actionItems.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className={`text-gray-500 text-sm ${textClass}`}>
            No outstanding action items
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actionItems.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  item.priority === 'high' ? 'bg-red-100' : 
                  item.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Target className={`h-4 w-4 ${
                    item.priority === 'high' ? 'text-red-600' : 
                    item.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <p className={`font-medium text-gray-900 ${textClass}`}>
                    {item.title}
                  </p>
                  <p className={`text-sm text-gray-500 ${textClass}`}>
                    Due: {new Date(item.due_date).toLocaleDateString()} • {item.assigned_to}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderCommitteeOverview = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Committee Overview
        </h3>
        <button
          onClick={() => setActiveView('committees')}
          className={`flex items-center space-x-1 text-blue-600 hover:text-blue-700 ${textClass}`}
        >
          <span>View All</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {!committeeOverview || committeeOverview.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className={`text-gray-500 text-sm ${textClass}`}>
            No active committees
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {committeeOverview.slice(0, 5).map(committee => (
            <div key={committee.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className={`font-medium text-gray-900 ${textClass}`}>
                    {committee.name}
                  </p>
                  <p className={`text-sm text-gray-500 ${textClass}`}>
                    {committee.member_count} members • {committee.active_workflows} active workflows
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex space-x-8 px-6">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'meetings', label: 'Meeting Management', icon: Calendar },
          { id: 'committees', label: 'Committee Management', icon: Users },
          { id: 'agenda', label: 'Agenda & Minutes', icon: FileText }
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
            Meetings & Collaboration
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Comprehensive meeting management, committee organization, and collaboration tools
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
              Phase 7
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>
              Meetings
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {renderUpcomingMeetings()}
        {renderRecentMeetings()}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderActionItems()}
        {renderCommitteeOverview()}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'meetings':
        return <MeetingManagement user={user} organizationId={organizationId} />
      case 'committees':
        return <CommitteeManagement user={user} organizationId={organizationId} />
      case 'agenda':
        return <MeetingAgenda user={user} organizationId={organizationId} />
      case 'minutes':
        return <MeetingMinutes user={user} organizationId={organizationId} />
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

export default MeetingDashboard 