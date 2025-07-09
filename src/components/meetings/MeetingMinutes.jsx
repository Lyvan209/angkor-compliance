import { useState, useEffect } from 'react'
import { 
  FileText, 
  Save,
  Download,
  ,
  Edit,
  ,
  ,
  Share2,
  ,
  ,
  User,
  Users,
  CheckCircle,
  Circle,
  Target,
  ,
  Calendar,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  Plus,
  ,
  ,
  ,
  ,
  ,
  ,
  Mic,
  ,
  ,
  ,
  Square,
  ,
  AlertTriangle,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  MoreVertical
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getMeetingMinutes,
  saveMeetingMinutes,
  updateMeetingMinutes,
  getMeetingActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  getMeetingAttendance,
  updateAttendance,
  generateMinutesTemplate,
  exportMinutesToPDF,
  shareMinutes,
  getMinutesHistory,
  approveMinutes,
  getMinutesStatistics,
  extractActionItemsFromText,
  autoSummarizeDiscussion
} from '../../lib/supabase-enhanced'

const MeetingMinutes = ({ user, organizationId, meetingId, meetingData }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [minutes, setMinutes] = useState('')
  const [actionItems, setActionItems] = useState([])
  const [attendance, setAttendance] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedActionItem, setSelectedActionItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showActionItems, setShowActionItems] = useState(true)
  const [showAttendance, setShowAttendance] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showCreateAction, setShowCreateAction] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (meetingId) {
      loadMinutesData()
    }
  }, [meetingId])

  useEffect(() => {
    // Auto-save every 30 seconds when editing
    let autoSaveInterval
    if (isEditing && autoSaveEnabled && minutes) {
      autoSaveInterval = setInterval(() => {
        handleSaveMinutes(true) // silent save
      }, 30000)
    }
    return () => clearInterval(autoSaveInterval)
  }, [isEditing, autoSaveEnabled, minutes])

  useEffect(() => {
    // Recording timer
    let recordingInterval
    if (isRecording) {
      recordingInterval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(recordingInterval)
  }, [isRecording])

  const loadMinutesData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        minutesResult,
        actionItemsResult,
        attendanceResult,
        statisticsResult,
        historyResult
      ] = await Promise.all([
        getMeetingMinutes(meetingId),
        getMeetingActionItems(meetingId),
        getMeetingAttendance(meetingId),
        getMinutesStatistics(organizationId),
        getMinutesHistory(meetingId)
      ])

      if (minutesResult.success) {
        setMinutes(minutesResult.data.content || '')
        setLastSaved(minutesResult.data.updated_at)
      }
      if (actionItemsResult.success) setActionItems(actionItemsResult.data)
      if (attendanceResult.success) setAttendance(attendanceResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (historyResult.success) setHistory(historyResult.data)
    } catch (error) {
      console.error('Failed to load minutes data:', error)
      setError('Failed to load minutes data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMinutes = async (silent = false) => {
    if (!silent) setSaving(true)

    try {
      const result = await saveMeetingMinutes(meetingId, {
        content: minutes,
        updated_by: user.id,
        auto_save: silent
      })

      if (result.success) {
        setLastSaved(new Date().toISOString())
        if (!silent) {
          alert('Minutes saved successfully!')
        }
      }
    } catch (error) {
      console.error('Failed to save minutes:', error)
      if (!silent) {
        setError('Failed to save minutes')
      }
    } finally {
      if (!silent) setSaving(false)
    }
  }

  const handleCreateActionItem = async (actionData) => {
    try {
      const result = await createActionItem({
        ...actionData,
        meeting_id: meetingId,
        organization_id: organizationId,
        created_by: user.id
      })

      if (result.success) {
        await loadMinutesData()
        setShowCreateAction(false)
      }
    } catch (error) {
      console.error('Failed to create action item:', error)
    }
  }

  const handleUpdateActionItem = async (itemId, updates) => {
    try {
      const result = await updateActionItem(itemId, {
        ...updates,
        updated_by: user.id
      })

      if (result.success) {
        await loadMinutesData()
        setSelectedActionItem(null)
      }
    } catch (error) {
      console.error('Failed to update action item:', error)
    }
  }

  const handleUpdateAttendance = async (attendeeId, status) => {
    try {
      const result = await updateAttendance(attendeeId, status, user.id)
      if (result.success) {
        await loadMinutesData()
      }
    } catch (error) {
      console.error('Failed to update attendance:', error)
    }
  }

  const handleExtractActionItems = async () => {
    try {
      const result = await extractActionItemsFromText(minutes)
      if (result.success && result.data.length > 0) {
        for (const item of result.data) {
          await handleCreateActionItem(item)
        }
        alert(`Extracted ${result.data.length} action items from minutes!`)
      }
    } catch (error) {
      console.error('Failed to extract action items:', error)
    }
  }

  const handleAutoSummarize = async () => {
    try {
      const result = await autoSummarizeDiscussion(minutes)
      if (result.success) {
        const summary = `\n\n## Summary\n${result.data.summary}\n\n## Key Points\n${result.data.keyPoints.map(point => `- ${point}`).join('\n')}\n\n`
        setMinutes(prev => prev + summary)
      }
    } catch (error) {
      console.error('Failed to auto-summarize:', error)
    }
  }

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getActionStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'left_early': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderMinutesHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
            Meeting Minutes
          </h2>
          <p className={`text-gray-600 ${textClass}`}>
            {meetingData?.title} - {new Date(meetingData?.start_time).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {lastSaved && (
              <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
            )}
            {autoSaveEnabled && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Auto-save ON
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-2 px-4 py-2 ${
              isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md ${textClass}`}
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing ? 'View Mode' : 'Edit Mode'}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleAutoSummarize}
              className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 ${textClass}`}
            >
              <Target className="h-4 w-4" />
              <span>Auto Summarize</span>
            </button>
          )}

          <button
            onClick={handleExtractActionItems}
            className={`flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 ${textClass}`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Extract Actions</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center space-x-2 px-4 py-2 ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white rounded-md ${textClass}`}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span>{isRecording ? formatRecordingTime(recordingTime) : 'Record'}</span>
            </button>
          </div>

          <button
            onClick={() => handleSaveMinutes()}
            disabled={saving}
            className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 ${textClass}`}
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>

          <button className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}>
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderMinutesEditor = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Meeting Notes
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`text-sm px-3 py-1 rounded-full ${
                autoSaveEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <textarea
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className={`w-full h-96 p-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none ${textClass}`}
            placeholder="Start typing meeting minutes here...

Meeting called to order at: 
Attendees: 
Agenda Items Discussed:

1. 

Action Items:
- 

Next Meeting: 
"
          />
        ) : (
          <div className="min-h-96 p-4 border border-gray-200 rounded-md">
            {minutes ? (
              <div className={`whitespace-pre-wrap ${textClass}`}>
                {minutes}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
                  No Minutes Yet
                </h4>
                <p className={`text-gray-500 mb-4 ${textClass}`}>
                  Start editing to add meeting minutes
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
                >
                  <Edit className="h-4 w-4" />
                  <span>Start Writing</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderActionItems = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Action Items ({actionItems.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateAction(true)}
              className={`flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Add Action</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {actionItems.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-gray-500 text-sm ${textClass}`}>
              No action items yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <button
                        onClick={() => handleUpdateActionItem(item.id, { 
                          status: item.status === 'completed' ? 'pending' : 'completed' 
                        })}
                        className={`flex-shrink-0 ${item.status === 'completed' ? 'text-green-600' : 'text-gray-400'} hover:text-green-600`}
                      >
                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                      <h4 className={`font-medium text-gray-900 ${item.status === 'completed' ? 'line-through' : ''} ${textClass}`}>
                        {item.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getActionStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className={`text-gray-600 mb-2 ${textClass}`}>
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {item.assigned_to && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{item.assigned_to.full_name}</span>
                        </div>
                      )}
                      {item.due_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderAttendance = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Attendance ({attendance.filter(a => a.status === 'present').length}/{attendance.length})
        </h3>
      </div>

      <div className="p-4">
        {attendance.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-gray-500 text-sm ${textClass}`}>
              No attendees recorded
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendance.map(attendee => (
              <div key={attendee.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className={`font-medium text-gray-900 ${textClass}`}>
                      {attendee.user.full_name}
                    </p>
                    <p className={`text-sm text-gray-500 ${textClass}`}>
                      {attendee.user.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getAttendanceStatusColor(attendee.status)}`}>
                    {attendee.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  {isEditing && (
                    <select
                      value={attendee.status}
                      onChange={(e) => handleUpdateAttendance(attendee.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="left_early">Left Early</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

      {renderMinutesHeader()}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {renderMinutesEditor()}
        </div>
        
        <div className="space-y-6">
          {renderActionItems()}
          {renderAttendance()}
        </div>
      </div>
    </div>
  )
}

export default MeetingMinutes 