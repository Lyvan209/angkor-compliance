import { useState, useEffect } from 'react'
import { 
  Users, 
  User,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Star,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Settings,
  FileText,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Activity,
  Archive,
  Download,
  Upload,
  Share2,
  Link2,
  MessageSquare,
  Bell,
  ChevronRight,
  ChevronDown,
  Grid,
  List,
  Save,
  X
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getCommittees,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  getCommitteeById,
  getCommitteeMembers,
  addCommitteeMember,
  updateCommitteeMember,
  removeCommitteeMember,
  getCommitteeStatistics,
  getCommitteeWorkflows,
  createCommitteeWorkflow,
  updateCommitteeWorkflow,
  getCommitteePerformance,
  getCommitteeMeetings,
  assignCommitteeTask,
  getCommitteeDocuments,
  uploadCommitteeDocument
} from '../../lib/supabase-enhanced'

const CommitteeManagement = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [committees, setCommittees] = useState([])
  const [selectedCommittee, setSelectedCommittee] = useState(null)
  const [members, setMembers] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeView, setActiveView] = useState('list')
  const [showCreateCommittee, setShowCreateCommittee] = useState(false)
  const [showEditCommittee, setShowEditCommittee] = useState(false)
  const [showCommitteeDetails, setShowCommitteeDetails] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [expandedCommittee, setExpandedCommittee] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCommitteeData()
  }, [organizationId])

  const loadCommitteeData = async () => {
    setLoading(true)
    setError('')

    try {
      const [committeesResult, statisticsResult, performanceResult] = await Promise.all([
        getCommittees(organizationId),
        getCommitteeStatistics(organizationId),
        getCommitteePerformance(organizationId)
      ])

      if (committeesResult.success) setCommittees(committeesResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (performanceResult.success) setPerformance(performanceResult.data)
    } catch (error) {
      console.error('Failed to load committee data:', error)
      setError('Failed to load committee data')
    } finally {
      setLoading(false)
    }
  }

  const loadCommitteeDetails = async (committeeId) => {
    try {
      const [
        committeeResult,
        membersResult,
        workflowsResult
      ] = await Promise.all([
        getCommitteeById(committeeId),
        getCommitteeMembers(committeeId),
        getCommitteeWorkflows(organizationId, { committee_id: committeeId })
      ])

      if (committeeResult.success) setSelectedCommittee(committeeResult.data)
      if (membersResult.success) setMembers(membersResult.data)
      if (workflowsResult.success) setWorkflows(workflowsResult.data)
    } catch (error) {
      console.error('Failed to load committee details:', error)
    }
  }

  const handleCreateCommittee = async (committeeData) => {
    try {
      const result = await createCommittee({
        ...committeeData,
        organization_id: organizationId,
        created_by: user.id
      })

      if (result.success) {
        await loadCommitteeData()
        setShowCreateCommittee(false)
      }
    } catch (error) {
      console.error('Failed to create committee:', error)
    }
  }

  const handleUpdateCommittee = async (committeeId, updates) => {
    try {
      const result = await updateCommittee(committeeId, updates)
      if (result.success) {
        await loadCommitteeData()
        if (selectedCommittee && selectedCommittee.id === committeeId) {
          await loadCommitteeDetails(committeeId)
        }
        setShowEditCommittee(false)
      }
    } catch (error) {
      console.error('Failed to update committee:', error)
    }
  }

  const handleDeleteCommittee = async (committeeId) => {
    if (confirm('Are you sure you want to delete this committee?')) {
      try {
        const result = await deleteCommittee(committeeId)
        if (result.success) {
          await loadCommitteeData()
          if (selectedCommittee && selectedCommittee.id === committeeId) {
            setSelectedCommittee(null)
            setShowCommitteeDetails(false)
          }
        }
      } catch (error) {
        console.error('Failed to delete committee:', error)
      }
    }
  }

  const handleAddMember = async (committeeId, memberData) => {
    try {
      const result = await addCommitteeMember(committeeId, memberData)
      if (result.success) {
        if (selectedCommittee && selectedCommittee.id === committeeId) {
          await loadCommitteeDetails(committeeId)
        }
        await loadCommitteeData()
        setShowAddMember(false)
      }
    } catch (error) {
      console.error('Failed to add member:', error)
    }
  }

  const handleRemoveMember = async (committeeId, userId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const result = await removeCommitteeMember(committeeId, userId)
        if (result.success) {
          if (selectedCommittee && selectedCommittee.id === committeeId) {
            await loadCommitteeDetails(committeeId)
          }
          await loadCommitteeData()
        }
      } catch (error) {
        console.error('Failed to remove member:', error)
      }
    }
  }

  const getCommitteeTypeIcon = (type) => {
    switch (type) {
      case 'safety': return <Shield className="h-5 w-5" />
      case 'compliance': return <CheckCircle className="h-5 w-5" />
      case 'audit': return <Target className="h-5 w-5" />
      case 'grievance': return <MessageSquare className="h-5 w-5" />
      case 'training': return <FileText className="h-5 w-5" />
      case 'management': return <Crown className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }

  const getCommitteeStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'forming': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'chairperson': return <Crown className="h-4 w-4 text-yellow-600" />
      case 'vice_chairperson': return <Star className="h-4 w-4 text-orange-600" />
      case 'secretary': return <FileText className="h-4 w-4 text-blue-600" />
      case 'member': return <User className="h-4 w-4 text-gray-600" />
      default: return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Active Committees
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {statistics.active_committees}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-blue-600 font-medium">
                {statistics.total_committees} total
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Members
              </p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.total_members}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                Avg: {statistics.avg_members_per_committee} per committee
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Active Workflows
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.active_workflows}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-purple-600 font-medium">
                {statistics.workflows_this_week} this week
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Avg Resolution
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {statistics.avg_resolution_days}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-orange-600 font-medium">
                days average
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
              placeholder="Search committees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Types</option>
            <option value="safety">Safety</option>
            <option value="compliance">Compliance</option>
            <option value="audit">Audit</option>
            <option value="grievance">Grievance</option>
            <option value="training">Training</option>
            <option value="management">Management</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="forming">Forming</option>
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
          </div>
          
          <button
            onClick={loadCommitteeData}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowCreateCommittee(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Committee</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderCommitteeCard = (committee) => (
    <div key={committee.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getCommitteeTypeIcon(committee.type)}
            <div>
              <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                {committee.name}
              </h3>
              <p className={`text-sm text-gray-600 ${textClass}`}>
                {committee.type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getCommitteeStatusColor(committee.status)}`}>
              {committee.status.toUpperCase()}
            </span>
            <div className="relative">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {committee.description && (
          <p className={`text-gray-600 mb-4 line-clamp-2 ${textClass}`}>
            {committee.description}
          </p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {committee.member_count} members
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {committee.active_workflows} active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Created {new Date(committee.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {committee.meeting_frequency || 'Monthly'}
              </span>
            </div>
          </div>

          {committee.chairperson && (
            <div className="flex items-center space-x-2 text-sm">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="text-gray-600">
                Chair: {committee.chairperson.full_name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {committee.has_meeting_scheduled && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <Calendar className="h-3 w-3 mr-1" />
                Meeting Scheduled
              </span>
            )}
            {committee.performance_score && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                committee.performance_score >= 80 ? 'bg-green-100 text-green-800' :
                committee.performance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {committee.performance_score}% Performance
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedCommittee(committee)
                loadCommitteeDetails(committee.id)
                setShowCommitteeDetails(true)
              }}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => {
                setSelectedCommittee(committee)
                setShowEditCommittee(true)
              }}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => handleDeleteCommittee(committee.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCommitteesList = () => {
    const filteredCommittees = committees.filter(committee => {
      const matchesSearch = committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          committee.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || committee.type === filterType
      const matchesStatus = filterStatus === 'all' || committee.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })

    if (filteredCommittees.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Committees Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No committees match your current filters
          </p>
          <button
            onClick={() => setShowCreateCommittee(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create First Committee</span>
          </button>
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
        'space-y-4'
      }>
        {filteredCommittees.map(committee => renderCommitteeCard(committee))}
      </div>
    )
  }

  const renderPerformanceMetrics = () => {
    if (!performance.length) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Committee Performance
        </h3>
        <div className="space-y-4">
          {performance.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {getCommitteeTypeIcon(metric.type)}
                <div>
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {metric.name}
                  </h4>
                  <p className={`text-sm text-gray-500 ${textClass}`}>
                    {metric.total_cases} cases handled
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{metric.completion_rate}%</p>
                    <p className="text-gray-500">Completion</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{metric.on_time_rate}%</p>
                    <p className="text-gray-500">On Time</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{metric.avg_resolution_days}</p>
                    <p className="text-gray-500">Avg Days</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderActiveCommittees = () => {
    const activeCommittees = committees.filter(c => c.status === 'active').slice(0, 5)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Most Active Committees
          </h3>
          <button
            onClick={() => setActiveView('list')}
            className={`text-blue-600 hover:text-blue-700 text-sm ${textClass}`}
          >
            View All
          </button>
        </div>

        {activeCommittees.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className={`text-gray-500 text-sm ${textClass}`}>
              No active committees
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCommittees.map(committee => (
              <div key={committee.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getCommitteeTypeIcon(committee.type)}
                  <div>
                    <p className={`font-medium text-gray-900 ${textClass}`}>
                      {committee.name}
                    </p>
                    <p className={`text-sm text-gray-500 ${textClass}`}>
                      {committee.member_count} members • {committee.active_workflows} active workflows
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCommittee(committee)
                    loadCommitteeDetails(committee.id)
                    setShowCommitteeDetails(true)
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

  const renderOverview = () => (
    <div>
      {renderStatistics()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderActiveCommittees()}
        {renderPerformanceMetrics()}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'list':
        return (
          <div>
            {renderControls()}
            {renderCommitteesList()}
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
            Committee Management
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Organize committees, manage members, and handle workflows for effective collaboration
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadCommitteeData}
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
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderHeader()}
      {renderContent()}
    </div>
  )
}

export default CommitteeManagement 