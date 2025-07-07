import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  FileText,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ArrowRight
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getCAPS,
  getCAPSStatistics,
  getCAPSByStatus,
  createCAP,
  updateCAP,
  deleteCAP,
  getCAPSProgress
} from '../../lib/supabase-enhanced'

const CAPSManager = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [caps, setCAPS] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCAP, setSelectedCAP] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list', 'kanban', 'calendar'
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCAPSData()
  }, [organizationId, filterStatus, filterPriority, sortBy, sortOrder])

  const loadCAPSData = async () => {
    setLoading(true)
    setError('')

    try {
      const [capsResult, statsResult] = await Promise.all([
        getCAPS(organizationId, {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          sortBy,
          sortOrder,
          search: searchTerm
        }),
        getCAPSStatistics(organizationId)
      ])

      if (capsResult.success) setCAPS(capsResult.data)
      if (statsResult.success) setStatistics(statsResult.data)
    } catch (error) {
      console.error('Failed to load CAPs data:', error)
      setError('Failed to load CAPs data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCAP = () => {
    setSelectedCAP(null)
    setShowCreateForm(true)
  }

  const handleEditCAP = (cap) => {
    setSelectedCAP(cap)
    setShowCreateForm(true)
  }

  const handleViewCAP = (cap) => {
    setSelectedCAP(cap)
    setShowDetails(true)
  }

  const handleDeleteCAP = async (capId) => {
    if (window.confirm('Are you sure you want to delete this CAP?')) {
      try {
        const result = await deleteCAP(capId, organizationId)
        if (result.success) {
          await loadCAPSData()
        }
      } catch (error) {
        console.error('Failed to delete CAP:', error)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-600'
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

  const getProgressPercentage = (cap) => {
    if (!cap.total_actions || cap.total_actions === 0) return 0
    return Math.round((cap.completed_actions / cap.total_actions) * 100)
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total CAPs
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.total_caps}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                +{statistics.new_this_month}
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
                In Progress
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {statistics.in_progress}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                {statistics.avg_completion_time} days avg
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
              <p className="text-2xl font-bold text-green-600">
                {statistics.completed}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                {statistics.completion_rate}%
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                completion rate
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Overdue
              </p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.overdue}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-red-600 font-medium">
                {statistics.overdue_avg_days} days
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                average overdue
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
              placeholder="Search CAPs..."
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
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={loadCAPSData}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleCreateCAP}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create CAP</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderCAPCard = (cap) => (
    <div key={cap.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(cap.priority)}`}></div>
            <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
              {cap.title}
            </h3>
          </div>
          <p className={`text-sm text-gray-600 mb-3 ${textClass}`}>
            {cap.description}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{cap.assignee_name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(cap.due_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cap.status)}`}>
            {cap.status?.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium text-gray-700 ${textClass}`}>
            Progress
          </span>
          <span className={`text-sm text-gray-600 ${textClass}`}>
            {getProgressPercentage(cap)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage(cap)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{cap.total_actions || 0} actions</span>
          <span>•</span>
          <span>{cap.completed_actions || 0} completed</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewCAP(cap)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditCAP(cap)}
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteCAP(cap.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderCAPSList = () => {
    if (caps.length === 0) {
      return (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No CAPs Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No Corrective Action Plans match your current filters
          </p>
          <button
            onClick={handleCreateCAP}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create First CAP</span>
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caps.map(cap => renderCAPCard(cap))}
      </div>
    )
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            SMART CAPs Management
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Manage Corrective Action Plans (Specific, Measurable, Achievable, Relevant, Time-bound)
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {statistics?.completion_rate || 0}%
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>
              Overall Completion Rate
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
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderHeader()}
      {renderStatistics()}
      {renderControls()}
      {renderCAPSList()}
    </div>
  )
}

export default CAPSManager 