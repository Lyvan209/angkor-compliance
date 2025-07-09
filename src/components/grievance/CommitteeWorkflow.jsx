import { useState, useEffect } from 'react'
import { 
  Users, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  UserCheck,
  ,
  ,
  ,
  ,
  Plus,
  Edit,
  Eye,
  ,
  ChevronRight,
  ChevronDown,
  ,
  Search,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Shield,
  Flag,
  MapPin,
  Target,
  Workflow,
  Route,
  Send
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getCommittees,
  getCommitteeMembers,
  getCommitteeWorkflows,
  createCommitteeWorkflow,
  updateCommitteeWorkflow,
  assignGrievanceToCommittee,
  getCommitteeStatistics,
  getCommitteeGrievances,
  createCommittee,
  updateCommittee,
  addCommitteeMember,
  removeCommitteeMember,
  getWorkflowRules,
  createWorkflowRule,
  processCommitteeRouting
} from '../../lib/supabase-enhanced'

const CommitteeWorkflow = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [committees, setCommittees] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [routingRules, setRoutingRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCommittee, setSelectedCommittee] = useState(null)
  const [showCreateCommittee, setShowCreateCommittee] = useState(false)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadCommitteeData()
  }, [organizationId])

  const loadCommitteeData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        committeesResult,
        workflowsResult,
        statisticsResult,
        rulesResult
      ] = await Promise.all([
        getCommittees(organizationId),
        getCommitteeWorkflows(organizationId),
        getCommitteeStatistics(organizationId),
        getWorkflowRules(organizationId)
      ])

      if (committeesResult.success) setCommittees(committeesResult.data)
      if (workflowsResult.success) setWorkflows(workflowsResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (rulesResult.success) setRoutingRules(rulesResult.data)
    } catch (error) {
      console.error('Failed to load committee data:', error)
      setError('Failed to load committee data')
    } finally {
      setLoading(false)
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

  const handleCreateWorkflowRule = async (ruleData) => {
    try {
      const result = await createWorkflowRule({
        ...ruleData,
        organization_id: organizationId,
        created_by: user.id
      })

      if (result.success) {
        await loadCommitteeData()
        setShowCreateRule(false)
      }
    } catch (error) {
      console.error('Failed to create workflow rule:', error)
    }
  }

  const handleProcessRouting = async () => {
    try {
      const result = await processCommitteeRouting(organizationId)
      if (result.success) {
        await loadCommitteeData()
      }
    } catch (error) {
      console.error('Failed to process routing:', error)
    }
  }

  const getCommitteeIcon = (type) => {
    switch (type) {
      case 'safety': return <Shield className="h-5 w-5" />
      case 'hr': return <Users className="h-5 w-5" />
      case 'ethics': return <Flag className="h-5 w-5" />
      case 'environmental': return <MapPin className="h-5 w-5" />
      case 'general': return <Target className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'reviewing': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'escalated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Active Committees
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics?.active_committees || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Active Workflows
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics?.active_workflows || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Workflow className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Routed This Week
              </p>
              <p className="text-2xl font-bold text-green-600">
                {statistics?.routed_this_week || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Route className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Avg Resolution Time
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {statistics?.avg_resolution_days || 0}d
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Committee Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Committee Overview
          </h3>
          <button
            onClick={() => setShowCreateCommittee(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Committee</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {committees.map(committee => (
            <div key={committee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getCommitteeIcon(committee.type)}
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {committee.name}
                  </h4>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(committee.status)}`}>
                  {committee.status}
                </span>
              </div>
              
              <p className={`text-sm text-gray-600 mb-3 ${textClass}`}>
                {committee.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {committee.member_count} members
                </span>
                <span className="text-gray-500">
                  {committee.active_cases} active cases
                </span>
              </div>
              
              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedCommittee(committee)
                    setActiveTab('committees')
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workflows */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Recent Workflows
          </h3>
          <button
            onClick={handleProcessRouting}
            className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
          >
            <Send className="h-4 w-4" />
            <span>Process Routing</span>
          </button>
        </div>

        <div className="space-y-3">
          {workflows.slice(0, 5).map(workflow => (
            <div key={workflow.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(workflow.status)}`}>
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {workflow.grievance_title}
                  </h4>
                  <p className={`text-sm text-gray-600 ${textClass}`}>
                    Assigned to {workflow.committee_name} • {workflow.days_since_assignment} days ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
                <button
                  onClick={() => {
                    setSelectedWorkflow(workflow)
                    setShowWorkflowDetails(true)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCommittees = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Committee Management
          </h3>
          <div className="flex items-center space-x-3">
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
            <button
              onClick={() => setShowCreateCommittee(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Committee</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {committees.filter(committee => 
            committee.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(committee => (
            <div key={committee.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getCommitteeIcon(committee.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                        {committee.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(committee.status)}`}>
                        {committee.status}
                      </span>
                    </div>
                    <p className={`text-gray-600 mb-3 ${textClass}`}>
                      {committee.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Members:</span>
                        <span className="text-gray-600 ml-1">{committee.member_count}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Active Cases:</span>
                        <span className="text-gray-600 ml-1">{committee.active_cases}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Completed:</span>
                        <span className="text-gray-600 ml-1">{committee.completed_cases}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Success Rate:</span>
                        <span className="text-gray-600 ml-1">{committee.success_rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedCommittee(committee)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCommittee(committee)}
                    className="p-2 text-gray-400 hover:text-green-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {committee.members && committee.members.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className={`font-medium text-gray-900 mb-2 ${textClass}`}>Committee Members</h5>
                  <div className="flex items-center space-x-2">
                    {committee.members.slice(0, 5).map(member => (
                      <div key={member.id} className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1">
                        <User className="h-3 w-3 text-gray-600" />
                        <span className="text-xs text-gray-700">{member.name}</span>
                      </div>
                    ))}
                    {committee.members.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{committee.members.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderWorkflows = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Workflow Management
          </h3>
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="reviewing">Reviewing</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>
            <button
              onClick={handleProcessRouting}
              className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
            >
              <Send className="h-4 w-4" />
              <span>Process Routing</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {workflows.filter(workflow => 
            filterStatus === 'all' || workflow.status === filterStatus
          ).map(workflow => (
            <div key={workflow.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(workflow.status)}`}>
                    <Workflow className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                        {workflow.grievance_title}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className={`text-gray-600 mb-3 ${textClass}`}>
                      {workflow.grievance_description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Committee:</span>
                        <span className="text-gray-600 ml-1">{workflow.committee_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Priority:</span>
                        <span className={`ml-1 ${
                          workflow.priority === 'critical' ? 'text-red-600' :
                          workflow.priority === 'high' ? 'text-orange-600' :
                          workflow.priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {workflow.priority}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Assigned:</span>
                        <span className="text-gray-600 ml-1">{workflow.days_since_assignment}d ago</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Due:</span>
                        <span className="text-gray-600 ml-1">
                          {workflow.due_date ? new Date(workflow.due_date).toLocaleDateString() : 'No deadline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedWorkflow(workflow)
                      setShowWorkflowDetails(true)
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {workflow.timeline && workflow.timeline.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className={`font-medium text-gray-900 mb-3 ${textClass}`}>Workflow Timeline</h5>
                  <div className="space-y-2">
                    {workflow.timeline.slice(0, 3).map((event, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          {event.action} - {new Date(event.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderRouting = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Routing Rules
          </h3>
          <button
            onClick={() => setShowCreateRule(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Rule</span>
          </button>
        </div>

        <div className="space-y-4">
          {routingRules.map(rule => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                      {rule.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rule.status)}`}>
                      {rule.status}
                    </span>
                  </div>
                  <p className={`text-gray-600 mb-3 ${textClass}`}>
                    {rule.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Condition:</span>
                      <span className="text-gray-600 ml-1">{rule.condition_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Target Committee:</span>
                      <span className="text-gray-600 ml-1">{rule.target_committee_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Priority:</span>
                      <span className="text-gray-600 ml-1">{rule.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {}}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      <strong>Matches:</strong> {rule.match_count} grievances
                    </span>
                    <span className="text-gray-600">
                      <strong>Success Rate:</strong> {rule.success_rate}%
                    </span>
                    <span className="text-gray-600">
                      <strong>Last Applied:</strong> {rule.last_applied ? new Date(rule.last_applied).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTabs = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex space-x-8 px-6">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'committees', label: 'Committees', icon: Users },
          { id: 'workflows', label: 'Workflows', icon: Workflow },
          { id: 'routing', label: 'Routing Rules', icon: Route }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'committees': return renderCommittees()
      case 'workflows': return renderWorkflows()
      case 'routing': return renderRouting()
      default: return renderOverview()
    }
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Committee Workflow Routing
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Automated routing and management of grievances through committee workflows
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
      {renderTabs()}
      {renderTabContent()}
    </div>
  )
}

export default CommitteeWorkflow 