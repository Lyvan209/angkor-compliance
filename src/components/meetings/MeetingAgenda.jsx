import { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  Target,
  ChevronUp,
  ChevronDown,
  Save,
  Download,
  Upload,
  Copy,
  Share2,
  Eye,
  EyeOff,
  Calendar,
  Timer,
  CheckCircle,
  Circle,
  AlertTriangle,
  MoreVertical,
  Paperclip,
  MessageSquare,
  Star,
  Flag,
  Archive,
  RefreshCw,
  Settings,
  Link,
  Send,
  Bookmark,
  Tag,
  Grid,
  List,
  Search,
  Filter,
  X,
  Check
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getMeetingAgenda,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  reorderAgendaItems,
  duplicateAgendaItem,
  getAgendaTemplates,
  createAgendaTemplate,
  applyAgendaTemplate,
  getAgendaStatistics,
  generateAgendaPDF,
  shareAgenda,
  getAgendaComments,
  addAgendaComment,
  markAgendaItemComplete,
  trackAgendaTime,
  getAgendaHistory
} from '../../lib/supabase-enhanced'

const MeetingAgenda = ({ user, organizationId, meetingId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [agendaItems, setAgendaItems] = useState([])
  const [templates, setTemplates] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [comments, setComments] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('agenda')
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [isEditMode, setIsEditMode] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)
  const [totalEstimatedTime, setTotalEstimatedTime] = useState(0)
  const [actualTimeTracking, setActualTimeTracking] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (meetingId) {
      loadAgendaData()
    }
  }, [meetingId, organizationId])

  useEffect(() => {
    // Calculate total estimated time
    const total = agendaItems.reduce((sum, item) => sum + (item.estimated_duration || 0), 0)
    setTotalEstimatedTime(total)
  }, [agendaItems])

  const loadAgendaData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        agendaResult,
        templatesResult,
        statisticsResult,
        commentsResult
      ] = await Promise.all([
        getMeetingAgenda(meetingId),
        getAgendaTemplates(organizationId),
        getAgendaStatistics(organizationId),
        getAgendaComments(meetingId)
      ])

      if (agendaResult.success) setAgendaItems(agendaResult.data)
      if (templatesResult.success) setTemplates(templatesResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (commentsResult.success) setComments(commentsResult.data)
    } catch (error) {
      console.error('Failed to load agenda data:', error)
      setError('Failed to load agenda data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (itemData) => {
    try {
      const result = await createAgendaItem({
        ...itemData,
        meeting_id: meetingId,
        organization_id: organizationId,
        created_by: user.id,
        order_number: agendaItems.length + 1
      })

      if (result.success) {
        await loadAgendaData()
        setShowCreateItem(false)
      }
    } catch (error) {
      console.error('Failed to create agenda item:', error)
    }
  }

  const handleUpdateItem = async (itemId, updates) => {
    try {
      const result = await updateAgendaItem(itemId, {
        ...updates,
        updated_by: user.id
      })

      if (result.success) {
        await loadAgendaData()
        setShowEditItem(false)
        setSelectedItem(null)
      }
    } catch (error) {
      console.error('Failed to update agenda item:', error)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (confirm('Are you sure you want to delete this agenda item?')) {
      try {
        const result = await deleteAgendaItem(itemId)
        if (result.success) {
          await loadAgendaData()
        }
      } catch (error) {
        console.error('Failed to delete agenda item:', error)
      }
    }
  }

  const handleReorderItems = async (newOrder) => {
    try {
      const result = await reorderAgendaItems(meetingId, newOrder)
      if (result.success) {
        await loadAgendaData()
      }
    } catch (error) {
      console.error('Failed to reorder items:', error)
    }
  }

  const handleMarkComplete = async (itemId, completed) => {
    try {
      const result = await markAgendaItemComplete(itemId, completed, user.id)
      if (result.success) {
        await loadAgendaData()
      }
    } catch (error) {
      console.error('Failed to mark item complete:', error)
    }
  }

  const handleStartTimer = async (itemId) => {
    try {
      const result = await trackAgendaTime(itemId, 'start', user.id)
      if (result.success) {
        setActualTimeTracking(prev => ({
          ...prev,
          [itemId]: { startTime: new Date(), isRunning: true }
        }))
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleStopTimer = async (itemId) => {
    try {
      const tracking = actualTimeTracking[itemId]
      if (tracking && tracking.startTime) {
        const duration = Math.floor((new Date() - tracking.startTime) / 1000 / 60) // minutes
        const result = await trackAgendaTime(itemId, 'stop', user.id, duration)
        
        if (result.success) {
          setActualTimeTracking(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], isRunning: false, actualDuration: duration }
          }))
          await loadAgendaData()
        }
      }
    } catch (error) {
      console.error('Failed to stop timer:', error)
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <Flag className="h-4 w-4 text-red-600" />
      case 'medium': return <Flag className="h-4 w-4 text-yellow-600" />
      case 'low': return <Flag className="h-4 w-4 text-green-600" />
      default: return <Flag className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'presentation': return <FileText className="h-4 w-4" />
      case 'discussion': return <MessageSquare className="h-4 w-4" />
      case 'decision': return <Target className="h-4 w-4" />
      case 'report': return <FileText className="h-4 w-4" />
      case 'action_item': return <CheckCircle className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  const formatTime = (minutes) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const renderAgendaHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
            Meeting Agenda
          </h2>
          <p className={`text-gray-600 ${textClass}`}>
            Organize and manage meeting topics and timelines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center space-x-2 px-4 py-2 ${
              isEditMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md ${textClass}`}
          >
            {isEditMode ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditMode ? 'Save Changes' : 'Edit Mode'}</span>
          </button>
          <button className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}>
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          <button className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}>
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-blue-900 ${textClass}`}>
                Total Items
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {agendaItems.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-green-900 ${textClass}`}>
                Completed
              </p>
              <p className="text-2xl font-bold text-green-700">
                {agendaItems.filter(item => item.is_completed).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-purple-900 ${textClass}`}>
                Estimated Time
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {formatTime(totalEstimatedTime)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-orange-900 ${textClass}`}>
                High Priority
              </p>
              <p className="text-2xl font-bold text-orange-700">
                {agendaItems.filter(item => item.priority === 'high').length}
              </p>
            </div>
            <Flag className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderControls = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search agenda items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTemplates(true)}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Templates</span>
          </button>
          
          <button
            onClick={() => setShowCreateItem(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderAgendaItem = (item, index) => {
    const tracking = actualTimeTracking[item.id]
    const isRunning = tracking?.isRunning || false

    return (
      <div
        key={item.id}
        className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow ${
          item.is_completed ? 'opacity-75' : ''
        }`}
        draggable={isEditMode}
        onDragStart={() => setDraggedItem(item)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedItem && draggedItem.id !== item.id) {
            // Handle reordering logic here
            // Reorder agenda items
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium text-gray-500 w-8 ${textClass}`}>
                {index + 1}.
              </span>
              <button
                onClick={() => handleMarkComplete(item.id, !item.is_completed)}
                className={`flex-shrink-0 ${item.is_completed ? 'text-green-600' : 'text-gray-400'} hover:text-green-600`}
              >
                {item.is_completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getTypeIcon(item.type)}
                <h3 className={`text-lg font-semibold text-gray-900 ${item.is_completed ? 'line-through' : ''} ${headerClass}`}>
                  {item.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {getPriorityIcon(item.priority)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {item.description && (
                <p className={`text-gray-600 mb-3 ${textClass}`}>
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Est: {formatTime(item.estimated_duration)}</span>
                  </div>
                  
                  {item.presenter && (
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{item.presenter.full_name}</span>
                    </div>
                  )}
                  
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Paperclip className="h-4 w-4" />
                      <span>{item.attachments.length} files</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {tracking?.actualDuration && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      tracking.actualDuration > item.estimated_duration ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      Actual: {formatTime(tracking.actualDuration)}
                    </span>
                  )}
                  
                  <button
                    onClick={() => isRunning ? handleStopTimer(item.id) : handleStartTimer(item.id)}
                    className={`p-2 rounded-md ${
                      isRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    <Timer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {item.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className={`text-sm text-gray-700 ${textClass}`}>
                    <strong>Notes:</strong> {item.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {isEditMode && (
              <>
                <button
                  onClick={() => {
                    setSelectedItem(item)
                    setShowEditItem(true)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAgendaList = () => {
    const filteredItems = agendaItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPriority = filterPriority === 'all' || item.priority === filterPriority
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'completed' && item.is_completed) ||
                           (filterStatus === 'pending' && !item.is_completed)
      return matchesSearch && matchesPriority && matchesStatus
    })

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Agenda Items
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            Start building your meeting agenda by adding items
          </p>
          <button
            onClick={() => setShowCreateItem(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Add First Item</span>
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {filteredItems.map((item, index) => renderAgendaItem(item, index))}
      </div>
    )
  }

  const renderAgendaSummary = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
        Agenda Summary
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className={`font-medium text-gray-900 mb-3 ${textClass}`}>
            Progress Overview
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completed Items:</span>
              <span className="font-medium text-green-600">
                {agendaItems.filter(item => item.is_completed).length} / {agendaItems.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">High Priority:</span>
              <span className="font-medium text-red-600">
                {agendaItems.filter(item => item.priority === 'high').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Time:</span>
              <span className="font-medium text-blue-600">
                {formatTime(totalEstimatedTime)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className={`font-medium text-gray-900 mb-3 ${textClass}`}>
            Action Items
          </h4>
          <div className="space-y-2">
            {agendaItems
              .filter(item => item.type === 'action_item' && !item.is_completed)
              .slice(0, 3)
              .map(item => (
                <div key={item.id} className="flex items-center space-x-2 text-sm">
                  <Circle className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700 truncate">{item.title}</span>
                </div>
              ))}
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
    <div className="max-w-6xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderAgendaHeader()}
      {renderControls()}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {renderAgendaList()}
        </div>
        <div className="lg:col-span-1">
          {renderAgendaSummary()}
        </div>
      </div>
    </div>
  )
}

export default MeetingAgenda 