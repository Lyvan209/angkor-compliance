import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  User,
  Calendar,
  FileText,
  Eye,
  Edit,
  UserCheck,
  Users,
  Phone,
  Mail,
  MapPin,
  Flag,
  ArrowUp,
  ArrowDown,
  Send,
  Paperclip,
  Download,
  X,
  Plus,
  History,
  Shield,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Activity
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getGrievanceDetails,
  getGrievanceComments,
  addGrievanceComment,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  resolveGrievance,
  getGrievanceHistory,
  downloadGrievanceDocument,
  getAvailableAssignees
} from '../../lib/supabase-enhanced'

const GrievanceDetails = ({ grievanceId, user, onClose, onUpdate }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [grievance, setGrievance] = useState(null)
  const [comments, setComments] = useState([])
  const [history, setHistory] = useState([])
  const [assignees, setAssignees] = useState([])
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const [error, setError] = useState('')

  useEffect(() => {
    loadGrievanceData()
  }, [grievanceId])

  const loadGrievanceData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        grievanceResult,
        commentsResult,
        historyResult,
        assigneesResult
      ] = await Promise.all([
        getGrievanceDetails(grievanceId),
        getGrievanceComments(grievanceId),
        getGrievanceHistory(grievanceId),
        getAvailableAssignees(grievance?.organization_id)
      ])

      if (grievanceResult.success) setGrievance(grievanceResult.data)
      if (commentsResult.success) setComments(commentsResult.data)
      if (historyResult.success) setHistory(historyResult.data)
      if (assigneesResult.success) setAssignees(assigneesResult.data)
    } catch (error) {
      console.error('Failed to load grievance data:', error)
      setError('Failed to load grievance details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setCommenting(true)
    try {
      const result = await addGrievanceComment(grievanceId, {
        content: newComment,
        author_id: user.id,
        author_name: user.full_name,
        created_at: new Date().toISOString()
      })

      if (result.success) {
        setNewComment('')
        await loadGrievanceData()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setCommenting(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    try {
      const result = await updateGrievanceStatus(grievanceId, {
        status: newStatus,
        updated_by: user.id,
        status_updated_at: new Date().toISOString()
      })

      if (result.success) {
        await loadGrievanceData()
        onUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedAssignee) return

    setUpdating(true)
    try {
      const result = await assignGrievance(grievanceId, {
        assigned_to: selectedAssignee,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      })

      if (result.success) {
        setShowAssignModal(false)
        setSelectedAssignee('')
        await loadGrievanceData()
        onUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to assign grievance:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleEscalate = async () => {
    if (!escalationReason.trim()) return

    setUpdating(true)
    try {
      const result = await escalateGrievance(grievanceId, {
        escalation_reason: escalationReason,
        escalated_by: user.id,
        escalated_at: new Date().toISOString()
      })

      if (result.success) {
        setShowEscalateModal(false)
        setEscalationReason('')
        await loadGrievanceData()
        onUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to escalate grievance:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) return

    setUpdating(true)
    try {
      const result = await resolveGrievance(grievanceId, {
        resolution_notes: resolutionNotes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      })

      if (result.success) {
        setShowResolveModal(false)
        setResolutionNotes('')
        await loadGrievanceData()
        onUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to resolve grievance:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadDocument = async (documentId, filename) => {
    try {
      const result = await downloadGrievanceDocument(documentId)
      if (result.success) {
        const url = window.URL.createObjectURL(result.data)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'acknowledged': return 'bg-purple-100 text-purple-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'escalated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'workplace_safety': return <Shield className="h-5 w-5" />
      case 'harassment': return <AlertTriangle className="h-5 w-5" />
      case 'working_conditions': return <Users className="h-5 w-5" />
      case 'wages_benefits': return <TrendingUp className="h-5 w-5" />
      case 'discrimination': return <Flag className="h-5 w-5" />
      case 'environmental': return <MapPin className="h-5 w-5" />
      default: return <MessageSquare className="h-5 w-5" />
    }
  }

  const getStatusActions = () => {
    if (!grievance) return []

    const actions = []
    const status = grievance.status

    if (status === 'submitted') {
      actions.push({ label: 'Acknowledge', action: () => handleStatusUpdate('acknowledged'), color: 'blue' })
    }

    if (status === 'acknowledged') {
      actions.push({ label: 'Start Investigation', action: () => handleStatusUpdate('investigating'), color: 'yellow' })
    }

    if (status === 'investigating') {
      actions.push({ label: 'Move to Review', action: () => handleStatusUpdate('in_review'), color: 'orange' })
    }

    if (['investigating', 'in_review'].includes(status)) {
      actions.push({ label: 'Resolve', action: () => setShowResolveModal(true), color: 'green' })
    }

    if (status === 'resolved') {
      actions.push({ label: 'Close', action: () => handleStatusUpdate('closed'), color: 'gray' })
    }

    if (!['resolved', 'closed', 'escalated'].includes(status)) {
      actions.push({ label: 'Escalate', action: () => setShowEscalateModal(true), color: 'red' })
    }

    return actions
  }

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${getPriorityColor(grievance?.priority)}`}></div>
          <div>
            <h1 className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
              {grievance?.title}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(grievance?.status)}`}>
                {grievance?.status?.replace('_', ' ').toUpperCase()}
              </span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {getCategoryIcon(grievance?.category)}
                <span>{grievance?.category?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{new Date(grievance?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Assign</span>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderTabs = () => (
    <div className="bg-white border-b border-gray-200 px-6">
      <div className="flex space-x-8">
        {[
          { id: 'details', label: 'Details', icon: FileText },
          { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
          { id: 'history', label: 'History', icon: History, count: history.length },
          { id: 'actions', label: 'Actions', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Basic Information
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Priority:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                grievance?.priority === 'critical' ? 'bg-red-100 text-red-800' :
                grievance?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                grievance?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {grievance?.priority?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category:</span>
              <span className="text-sm text-gray-900">{grievance?.category?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Department:</span>
              <span className="text-sm text-gray-900">{grievance?.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Location:</span>
              <span className="text-sm text-gray-900">{grievance?.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Date of Incident:</span>
              <span className="text-sm text-gray-900">
                {new Date(grievance?.date_of_incident).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Assignment & Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(grievance?.status)}`}>
                {grievance?.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Assigned To:</span>
              <span className="text-sm text-gray-900">
                {grievance?.assigned_to_name || 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Days Open:</span>
              <span className="text-sm text-gray-900">
                {Math.floor((new Date() - new Date(grievance?.created_at)) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="text-sm text-gray-900">
                {new Date(grievance?.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
          Description
        </h3>
        <p className={`text-gray-600 whitespace-pre-wrap ${textClass}`}>
          {grievance?.description}
        </p>
      </div>

      {grievance?.desired_outcome && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Desired Outcome
          </h3>
          <p className={`text-gray-600 whitespace-pre-wrap ${textClass}`}>
            {grievance?.desired_outcome}
          </p>
        </div>
      )}

      {grievance?.witnesses && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Witnesses
          </h3>
          <p className={`text-gray-600 whitespace-pre-wrap ${textClass}`}>
            {grievance?.witnesses}
          </p>
        </div>
      )}

      {grievance?.attached_files && grievance.attached_files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Attached Files
          </h3>
          <div className="space-y-2">
            {grievance.attached_files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.size} • {file.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(file.id, file.filename)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!grievance?.is_anonymous && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Submitter Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className={`text-sm text-gray-600 ${textClass}`}>
                {grievance?.submitter_name}
              </span>
            </div>
            {grievance?.submitter_email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className={`text-sm text-gray-600 ${textClass}`}>
                  {grievance?.submitter_email}
                </span>
              </div>
            )}
            {grievance?.submitter_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className={`text-sm text-gray-600 ${textClass}`}>
                  {grievance?.submitter_phone}
                </span>
              </div>
            )}
            {grievance?.submitter_department && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className={`text-sm text-gray-600 ${textClass}`}>
                  {grievance?.submitter_department}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderCommentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
          Add Comment
        </h3>
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            placeholder="Add your comment or update..."
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || commenting}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
            >
              {commenting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Add Comment</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                    {comment.author_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <p className={`text-gray-600 whitespace-pre-wrap ${textClass}`}>
              {comment.content}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-gray-500 ${textClass}`}>
              No comments yet. Be the first to add a comment.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderHistoryTab = () => (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium text-gray-900 ${textClass}`}>
                {item.action}
              </p>
              <p className="text-xs text-gray-500">
                {item.performed_by} • {new Date(item.created_at).toLocaleString()}
              </p>
              {item.details && (
                <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                  {item.details}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      {history.length === 0 && (
        <div className="text-center py-6">
          <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className={`text-gray-500 ${textClass}`}>
            No history available.
          </p>
        </div>
      )}
    </div>
  )

  const renderActionsTab = () => {
    const actions = getStatusActions()
    
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Status Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                disabled={updating}
                className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-md transition-colors ${
                  action.color === 'blue' ? 'border-blue-300 text-blue-700 hover:bg-blue-50' :
                  action.color === 'green' ? 'border-green-300 text-green-700 hover:bg-green-50' :
                  action.color === 'yellow' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' :
                  action.color === 'orange' ? 'border-orange-300 text-orange-700 hover:bg-orange-50' :
                  action.color === 'red' ? 'border-red-300 text-red-700 hover:bg-red-50' :
                  'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <span>{action.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className={`font-semibold text-gray-900 mb-3 ${headerClass}`}>
            Assignment Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Assign to Team Member</span>
            </button>
            {grievance?.assigned_to_name && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className={`text-sm text-gray-600 ${textClass}`}>
                  Currently assigned to: <span className="font-medium">{grievance.assigned_to_name}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details': return renderDetailsTab()
      case 'comments': return renderCommentsTab()
      case 'history': return renderHistoryTab()
      case 'actions': return renderActionsTab()
      default: return renderDetailsTab()
    }
  }

  // Modal Components
  const AssignModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Assign Grievance
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Select Team Member
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="">Choose assignee...</option>
              {assignees.map(assignee => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.full_name} ({assignee.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAssignModal(false)}
              className={`px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedAssignee || updating}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const EscalateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Escalate Grievance
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Escalation Reason
            </label>
            <textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              placeholder="Explain why this grievance needs to be escalated..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEscalateModal(false)}
              className={`px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              Cancel
            </button>
            <button
              onClick={handleEscalate}
              disabled={!escalationReason.trim() || updating}
              className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
            >
              Escalate
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const ResolveModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Resolve Grievance
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
              Resolution Notes
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              placeholder="Describe how this grievance was resolved..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowResolveModal(false)}
              className={`px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={!resolutionNotes.trim() || updating}
              className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
            >
              Resolve
            </button>
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

  if (!grievance) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
          Grievance Not Found
        </h3>
        <p className={`text-gray-500 ${textClass}`}>
          The requested grievance could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className={`text-red-800 ${textClass}`}>{error}</span>
            </div>
          </div>
        )}

        {renderHeader()}
        {renderTabs()}
        
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>

        {/* Modals */}
        {showAssignModal && <AssignModal />}
        {showEscalateModal && <EscalateModal />}
        {showResolveModal && <ResolveModal />}
      </div>
    </div>
  )
}

export default GrievanceDetails 