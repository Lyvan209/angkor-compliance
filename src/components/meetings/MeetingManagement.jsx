import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Users, 
  Video,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Mail,
  Phone,
  FileText,
  Link,
  Repeat,
  Bell,
  Settings,
  ChevronRight,
  ChevronLeft,
  Target,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  MessageSquare,
  Paperclip,
  Save,
  X
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingById,
  getMeetingStatistics,
  getMeetingAttendees,
  addMeetingAttendee,
  updateAttendeeStatus,
  removeMeetingAttendee,
  sendMeetingInvitations,
  getMeetingAgenda,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  getMeetingMinutes,
  saveMeetingMinutes,
  generateMeetingReport,
  getRecurringMeetings,
  createRecurringMeeting,
  updateRecurringMeeting
} from '../../lib/supabase-enhanced'

const MeetingManagement = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [meetings, setMeetings] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [agenda, setAgenda] = useState([])
  const [minutes, setMinutes] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeView, setActiveView] = useState('list') // 'list', 'calendar', 'create', 'edit', 'details'
  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [showEditMeeting, setShowEditMeeting] = useState(false)
  const [showMeetingDetails, setShowMeetingDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [error, setError] = useState('')

  useEffect(() => {
    loadMeetingData()
  }, [organizationId])

  const loadMeetingData = async () => {
    setLoading(true)
    setError('')

    try {
      const [meetingsResult, statisticsResult] = await Promise.all([
        getMeetings(organizationId),
        getMeetingStatistics(organizationId)
      ])

      if (meetingsResult.success) setMeetings(meetingsResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
    } catch (error) {
      console.error('Failed to load meeting data:', error)
      setError('Failed to load meeting data')
    } finally {
      setLoading(false)
    }
  }

  const loadMeetingDetails = async (meetingId) => {
    try {
      const [
        meetingResult,
        attendeesResult,
        agendaResult,
        minutesResult
      ] = await Promise.all([
        getMeetingById(meetingId),
        getMeetingAttendees(meetingId),
        getMeetingAgenda(meetingId),
        getMeetingMinutes(meetingId)
      ])

      if (meetingResult.success) setSelectedMeeting(meetingResult.data)
      if (attendeesResult.success) setAttendees(attendeesResult.data)
      if (agendaResult.success) setAgenda(agendaResult.data)
      if (minutesResult.success) setMinutes(minutesResult.data.content || '')
    } catch (error) {
      console.error('Failed to load meeting details:', error)
    }
  }

  const handleCreateMeeting = async (meetingData) => {
    try {
      const result = await createMeeting({
        ...meetingData,
        organization_id: organizationId,
        created_by: user.id
      })

      if (result.success) {
        await loadMeetingData()
        setShowCreateMeeting(false)
      }
    } catch (error) {
      console.error('Failed to create meeting:', error)
    }
  }

  const handleUpdateMeeting = async (meetingId, updates) => {
    try {
      const result = await updateMeeting(meetingId, updates)
      if (result.success) {
        await loadMeetingData()
        if (selectedMeeting && selectedMeeting.id === meetingId) {
          await loadMeetingDetails(meetingId)
        }
        setShowEditMeeting(false)
      }
    } catch (error) {
      console.error('Failed to update meeting:', error)
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      try {
        const result = await deleteMeeting(meetingId)
        if (result.success) {
          await loadMeetingData()
          if (selectedMeeting && selectedMeeting.id === meetingId) {
            setSelectedMeeting(null)
            setShowMeetingDetails(false)
          }
        }
      } catch (error) {
        console.error('Failed to delete meeting:', error)
      }
    }
  }

  const handleSendInvitations = async (meetingId) => {
    try {
      const result = await sendMeetingInvitations(meetingId)
      if (result.success) {
        alert('Invitations sent successfully!')
      }
    } catch (error) {
      console.error('Failed to send invitations:', error)
    }
  }

  const getMeetingStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'postponed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'compliance_review': return <Target className="h-5 w-5" />
      case 'committee_meeting': return <Users className="h-5 w-5" />
      case 'audit_review': return <BarChart3 className="h-5 w-5" />
      case 'training_session': return <FileText className="h-5 w-5" />
      case 'general': return <MessageSquare className="h-5 w-5" />
      default: return <Calendar className="h-5 w-5" />
    }
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString()
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Meetings
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {statistics.total_meetings}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-blue-600 font-medium">
                +{statistics.meetings_this_month}
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                this month
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Upcoming
              </p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.upcoming_meetings}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                Next: {statistics.next_meeting_date}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Attendance Rate
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.attendance_rate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-purple-600 font-medium">
                Avg: {statistics.avg_attendees} attendees
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Completed
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {statistics.completed_meetings}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-orange-600 font-medium">
                {statistics.completion_rate}% completion rate
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderControls = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Types</option>
            <option value="compliance_review">Compliance Review</option>
            <option value="committee_meeting">Committee Meeting</option>
            <option value="audit_review">Audit Review</option>
            <option value="training_session">Training Session</option>
            <option value="general">General</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={loadMeetingData}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowCreateMeeting(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderMeetingCard = (meeting) => (
    <div key={meeting.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getMeetingTypeIcon(meeting.type)}
            <div>
              <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                {meeting.title}
              </h3>
              <p className={`text-sm text-gray-600 ${textClass}`}>
                {meeting.type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getMeetingStatusColor(meeting.status)}`}>
              {meeting.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="relative">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {meeting.description && (
          <p className={`text-gray-600 mb-4 line-clamp-2 ${textClass}`}>
            {meeting.description}
          </p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {formatDateTime(meeting.start_time)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {meeting.duration} min
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {meeting.is_virtual ? (
                <>
                  <Video className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Virtual Meeting</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{meeting.location || 'TBD'}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {meeting.attendee_count} attendees
              </span>
            </div>
          </div>

          {meeting.organizer && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Organized by {meeting.organizer.full_name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {meeting.has_agenda && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <FileText className="h-3 w-3 mr-1" />
                Agenda
              </span>
            )}
            {meeting.is_recurring && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                <Repeat className="h-3 w-3 mr-1" />
                Recurring
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedMeeting(meeting)
                loadMeetingDetails(meeting.id)
                setShowMeetingDetails(true)
              }}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => {
                setSelectedMeeting(meeting)
                setShowEditMeeting(true)
              }}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => handleDeleteMeeting(meeting.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMeetingsList = () => {
    const filteredMeetings = meetings.filter(meeting => {
      const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus
      const matchesType = filterType === 'all' || meeting.type === filterType
      return matchesSearch && matchesStatus && matchesType
    })

    if (filteredMeetings.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Meetings Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No meetings match your current filters
          </p>
          <button
            onClick={() => setShowCreateMeeting(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Schedule First Meeting</span>
          </button>
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
        'space-y-4'
      }>
        {filteredMeetings.map(meeting => renderMeetingCard(meeting))}
      </div>
    )
  }

  const renderCalendarView = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Meeting Calendar
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() - 1)
              setCurrentDate(newDate)
            }}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className={`text-lg font-medium text-gray-900 ${textClass}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() + 1)
              setCurrentDate(newDate)
            }}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className={`text-gray-500 ${textClass}`}>
          Calendar view coming soon...
        </p>
      </div>
    </div>
  )

  const renderUpcomingMeetings = () => {
    const upcomingMeetings = meetings
      .filter(meeting => meeting.status === 'scheduled' && new Date(meeting.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 5)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Upcoming Meetings
          </h3>
          <button
            onClick={() => setActiveView('list')}
            className={`text-blue-600 hover:text-blue-700 text-sm ${textClass}`}
          >
            View All
          </button>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-gray-500 text-sm ${textClass}`}>
              No upcoming meetings scheduled
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map(meeting => (
              <div key={meeting.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getMeetingTypeIcon(meeting.type)}
                  <div>
                    <p className={`font-medium text-gray-900 ${textClass}`}>
                      {meeting.title}
                    </p>
                    <p className={`text-sm text-gray-500 ${textClass}`}>
                      {formatDateTime(meeting.start_time)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedMeeting(meeting)
                    loadMeetingDetails(meeting.id)
                    setShowMeetingDetails(true)
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderRecentMeetings = () => {
    const recentMeetings = meetings
      .filter(meeting => meeting.status === 'completed')
      .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
      .slice(0, 5)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Recent Meetings
        </h3>

        {recentMeetings.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-gray-500 text-sm ${textClass}`}>
              No recent meetings
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMeetings.map(meeting => (
              <div key={meeting.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getMeetingTypeIcon(meeting.type)}
                  <div>
                    <p className={`font-medium text-gray-900 ${textClass}`}>
                      {meeting.title}
                    </p>
                    <p className={`text-sm text-gray-500 ${textClass}`}>
                      {formatDateTime(meeting.end_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {meeting.has_minutes && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      <FileText className="h-3 w-3 mr-1" />
                      Minutes
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      loadMeetingDetails(meeting.id)
                      setShowMeetingDetails(true)
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderOverview = () => (
    <div>
      {renderStatistics()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUpcomingMeetings()}
        {renderRecentMeetings()}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (viewMode) {
      case 'calendar':
        return renderCalendarView()
      case 'list':
      case 'grid':
        return (
          <div>
            {renderControls()}
            {renderMeetingsList()}
          </div>
        )
      default:
        return renderOverview()
    }
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Meeting Management
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Schedule, organize, and manage compliance meetings and collaboration
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadMeetingData}
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
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderHeader()}
      {renderContent()}
    </div>
  )
}

export default MeetingManagement 