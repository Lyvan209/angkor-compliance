import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  User,
  Calendar,
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  UserCheck,
  Users,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Flag,
  RefreshCw,
  Download,
  Bell,
  Shield,
  ChevronRight
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getGrievances,
  getGrievanceStatistics,
  updateGrievanceStatus,
  assignGrievance,
  getGrievanceComments,
  addGrievanceComment,
  escalateGrievance,
  resolveGrievance
} from '../../lib/supabase-enhanced'

const GrievanceManager = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [grievances, setGrievances] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedGrievance, setSelectedGrievance] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list', 'kanban'
  const [error, setError] = useState('')

  useEffect(() => {
    loadGrievanceData()
  }, [organizationId, filterStatus, filterPriority, filterCategory, sortBy, sortOrder])

  const loadGrievanceData = async () => {
    setLoading(true)
    setError('')

    try {
      const [grievancesResult, statsResult] = await Promise.all([
        getGrievances(organizationId, {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          sortBy,
          sortOrder,
          search: searchTerm
        }),
        getGrievanceStatistics(organizationId)
      ])

      if (grievancesResult.success) setGrievances(grievancesResult.data)
      if (statsResult.success) setStatistics(statsResult.data)
    } catch (error) {
      console.error('Failed to load grievance data:', error)
      setError('Failed to load grievance data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (grievanceId, newStatus) => {
    try {
      const result = await updateGrievanceStatus(grievanceId, {
        status: newStatus,
        updated_by: user.id,
        status_updated_at: new Date().toISOString()
      })

      if (result.success) {
        await loadGrievanceData()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAssignGrievance = async (grievanceId, assigneeId) => {
    try {
      const result = await assignGrievance(grievanceId, {
        assigned_to: assigneeId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      })

      if (result.success) {
        await loadGrievanceData()
      }
    } catch (error) {
      console.error('Failed to assign grievance:', error)
    }
  }

  const handleEscalateGrievance = async (grievanceId, escalationData) => {
    try {
      const result = await escalateGrievance(grievanceId, {
        ...escalationData,
        escalated_by: user.id,
        escalated_at: new Date().toISOString()
      })

      if (result.success) {
        await loadGrievanceData()
      }
    } catch (error) {
      console.error('Failed to escalate grievance:', error)
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
      case 'workplace_safety': return <Shield className="h-4 w-4" />
      case 'harassment': return <AlertTriangle className="h-4 w-4" />
      case 'working_conditions': return <Users className="h-4 w-4" />
      case 'wages_benefits': return <TrendingUp className="h-4 w-4" />
      case 'discrimination': return <Flag className="h-4 w-4" />
      case 'environmental': return <MapPin className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Grievances
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.total_grievances}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-600" />
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
                Open Cases
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics.open_cases}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Avg resolution: {statistics.avg_resolution_time}d
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Resolved
              </p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.resolved_cases}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                {statistics.resolution_rate}%
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                success rate
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                High Priority
              </p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.high_priority_count}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-red-600 font-medium">
                {statistics.escalated_count} escalated
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
              placeholder="Search grievances..."
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
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="investigating">Investigating</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="escalated">Escalated</option>
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

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Categories</option>
            <option value="workplace_safety">Workplace Safety</option>
            <option value="harassment">Harassment</option>
            <option value="working_conditions">Working Conditions</option>
            <option value="wages_benefits">Wages & Benefits</option>
            <option value="discrimination">Discrimination</option>
            <option value="environmental">Environmental</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <User className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={loadGrievanceData}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>New Grievance</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderGrievanceCard = (grievance) => (
    <div key={grievance.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(grievance.priority)}`}></div>
          <div className="flex items-center space-x-2 text-gray-600">
            {getCategoryIcon(grievance.category)}
            <span className={`text-sm ${textClass}`}>
              {grievance.category?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(grievance.status)}`}>
          {grievance.status?.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${headerClass}`}>
        {grievance.title}
      </h3>
      
      <p className={`text-gray-600 mb-4 line-clamp-2 ${textClass}`}>
        {grievance.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-500">
            <User className="h-4 w-4" />
            <span>
              {grievance.submitter_name || 'Anonymous'}
              {grievance.is_anonymous && ' (Anonymous)'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        {grievance.assigned_to_name && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <UserCheck className="h-4 w-4" />
            <span>Assigned to: {grievance.assigned_to_name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {grievance.days_since_created > 7 && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              {grievance.days_since_created} days old
            </span>
          )}
          {grievance.comments_count > 0 && (
            <span className="text-xs text-gray-500">
              {grievance.comments_count} comments
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedGrievance(grievance)
              setShowDetails(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedGrievance(grievance)
              setShowCreateForm(true)
            }}
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  )

  const renderGrievancesList = () => {
    const filteredGrievances = grievances.filter(grievance => {
      const matchesSearch = grievance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          grievance.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })

    if (filteredGrievances.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Grievances Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No grievances match your current filters
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Submit First Grievance</span>
          </button>
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
        'space-y-4'
      }>
        {filteredGrievances.map(grievance => 
          viewMode === 'grid' ? 
            renderGrievanceCard(grievance) : 
            renderGrievanceListItem(grievance)
        )}
      </div>
    )
  }

  const renderGrievanceListItem = (grievance) => (
    <div key={grievance.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(grievance.priority)}`}></div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className={`font-semibold text-gray-900 ${textClass}`}>
                {grievance.title}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(grievance.status)}`}>
                {grievance.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{grievance.category?.replace('_', ' ')}</span>
              <span>{grievance.submitter_name || 'Anonymous'}</span>
              <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
              {grievance.assigned_to_name && (
                <span>Assigned to: {grievance.assigned_to_name}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedGrievance(grievance)
              setShowDetails(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  )

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Grievance Management
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Comprehensive worker grievance submission, tracking, and resolution system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              Phase 5
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>
              Communication
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
      {renderGrievancesList()}
    </div>
  )
}

export default GrievanceManager 