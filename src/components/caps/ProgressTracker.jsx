import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  BarChart3,
  Calendar,
  Bell,
  Filter,
  RefreshCw,
  Download,
  Target,
  Activity,
  ArrowRight,
  Timer,
  User,
  FileText
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getCAPSProgress,
  getWorkflowMetrics,
  updateCAPWorkflow,
  assignCAPAction,
  getProgressTimeline,
  generateProgressReport,
  getActiveWorkflows,
  createWorkflowAutomation
} from '../../lib/supabase-enhanced'

const ProgressTracker = ({ organizationId, user }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [capsProgress, setCAPSProgress] = useState([])
  const [workflowMetrics, setWorkflowMetrics] = useState(null)
  const [activeWorkflows, setActiveWorkflows] = useState([])
  const [progressTimeline, setProgressTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCAP, setSelectedCAP] = useState(null)
  const [showWorkflowAutomation, setShowWorkflowAutomation] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'workflows', 'timeline', 'automation'
  const [filterStatus, setFilterStatus] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgressData()
  }, [organizationId, filterStatus])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadProgressData(false) // Silent refresh
      }, refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const loadProgressData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')

    try {
      const [progressResult, metricsResult, workflowsResult, timelineResult] = await Promise.all([
        getCAPSProgress(organizationId, { period: '30d' }),
        getWorkflowMetrics(organizationId),
        getActiveWorkflows(organizationId),
        getProgressTimeline(organizationId, { limit: 20 })
      ])

      if (progressResult.success) setCAPSProgress(progressResult.data)
      if (metricsResult.success) setWorkflowMetrics(metricsResult.data)
      if (workflowsResult.success) setActiveWorkflows(workflowsResult.data)
      if (timelineResult.success) setProgressTimeline(timelineResult.data)
    } catch (error) {
      console.error('Failed to load progress data:', error)
      setError('Failed to load progress tracking data')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleWorkflowAction = async (capId, action, data = {}) => {
    try {
      const result = await updateCAPWorkflow(capId, {
        action,
        ...data,
        updated_by: user.id
      })

      if (result.success) {
        await loadProgressData(false)
      }
    } catch (error) {
      console.error('Workflow action failed:', error)
    }
  }

  const handleAssignAction = async (actionId, assigneeId) => {
    try {
      const result = await assignCAPAction(actionId, {
        assignee_id: assigneeId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      })

      if (result.success) {
        await loadProgressData(false)
      }
    } catch (error) {
      console.error('Assignment failed:', error)
    }
  }

  const handleExportReport = async () => {
    try {
      const result = await generateProgressReport(organizationId, {
        period: '30d',
        includeMetrics: true,
        includeTimeline: true,
        format: 'pdf'
      })

      if (result.success) {
        const link = document.createElement('a')
        link.href = result.data.url
        link.download = result.data.filename
        link.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'on_hold': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const renderMetricsOverview = () => {
    if (!workflowMetrics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Active Workflows
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {workflowMetrics.active_workflows}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +{workflowMetrics.workflow_trend}%
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                this week
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                On Track
              </p>
              <p className="text-2xl font-bold text-green-600">
                {workflowMetrics.on_track_percentage}%
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                {workflowMetrics.on_track_count} of {workflowMetrics.total_caps} CAPs
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Avg Completion
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {workflowMetrics.avg_completion_time}d
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Timer className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Target: {workflowMetrics.target_completion_time}d
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                At Risk
              </p>
              <p className="text-2xl font-bold text-red-600">
                {workflowMetrics.at_risk_count}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-red-600 font-medium">
                {workflowMetrics.overdue_count} overdue
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderProgressCards = () => {
    const filteredCAPs = capsProgress.filter(cap => 
      filterStatus === 'all' || cap.status === filterStatus
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCAPs.map(cap => (
          <div key={cap.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${headerClass}`}>
                  {cap.title}
                </h3>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cap.status)}`}>
                    {cap.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs text-gray-500 ${textClass}`}>
                    Due: {new Date(cap.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium text-gray-700 ${textClass}`}>
                  Progress
                </span>
                <span className={`text-sm text-gray-600 ${textClass}`}>
                  {cap.progress_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(cap.progress_percentage)}`}
                  style={{ width: `${cap.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>{cap.completed_actions}/{cap.total_actions}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{cap.assignee_count || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCAP(cap)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {cap.next_milestone && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className={`text-sm text-gray-700 ${textClass}`}>
                    Next: {cap.next_milestone}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderActiveWorkflows = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Active Workflows
        </h3>
        <button
          onClick={() => setShowWorkflowAutomation(true)}
          className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 ${textClass}`}
        >
          <PlayCircle className="h-4 w-4" />
          <span>Create Automation</span>
        </button>
      </div>

      <div className="space-y-4">
        {activeWorkflows.map(workflow => (
          <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  workflow.status === 'active' ? 'bg-green-100' :
                  workflow.status === 'paused' ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  {workflow.status === 'active' ? (
                    <PlayCircle className="h-5 w-5 text-green-600" />
                  ) : workflow.status === 'paused' ? (
                    <PauseCircle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {workflow.name}
                  </h4>
                  <p className={`text-sm text-gray-600 ${textClass}`}>
                    {workflow.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                  {workflow.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Trigger:</span>
                <div className="font-medium text-gray-900">{workflow.trigger_type}</div>
              </div>
              <div>
                <span className="text-gray-600">Actions:</span>
                <div className="font-medium text-gray-900">{workflow.action_count || 0} configured</div>
              </div>
              <div>
                <span className="text-gray-600">Last Run:</span>
                <div className="font-medium text-gray-900">
                  {workflow.last_run ? new Date(workflow.last_run).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeWorkflows.length === 0 && (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Active Workflows
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            Create automated workflows to streamline your CAP management
          </p>
          <button
            onClick={() => setShowWorkflowAutomation(true)}
            className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mx-auto ${textClass}`}
          >
            <PlayCircle className="h-4 w-4" />
            <span>Create First Workflow</span>
          </button>
        </div>
      )}
    </div>
  )

  const renderProgressTimeline = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-6 ${headerClass}`}>
        Progress Timeline
      </h3>
      
      <div className="space-y-4">
        {progressTimeline.map((event, index) => (
          <div key={event.id || index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                event.type === 'completed' ? 'bg-green-100' :
                event.type === 'started' ? 'bg-blue-100' :
                event.type === 'assigned' ? 'bg-purple-100' :
                event.type === 'overdue' ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                {event.type === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : event.type === 'started' ? (
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                ) : event.type === 'assigned' ? (
                  <User className="h-4 w-4 text-purple-600" />
                ) : event.type === 'overdue' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium text-gray-900 ${textClass}`}>
                  {event.title}
                </h4>
                <span className={`text-sm text-gray-500 ${textClass}`}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                {event.description}
              </p>
              {event.cap_title && (
                <div className={`text-xs text-gray-500 mt-1 ${textClass}`}>
                  CAP: {event.cap_title}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTabs = () => (
    <div className="mb-6">
      <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'workflows', label: 'Workflows', icon: Activity },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'automation', label: 'Automation', icon: PlayCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } ${textClass}`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )

  const renderControls = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className={`text-sm text-gray-700 ${textClass}`}>
              Auto-refresh ({refreshInterval}s)
            </label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadProgressData()}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExportReport}
            className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Progress Tracking Workflows
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Real-time monitoring and automated workflow management for CAPs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {autoRefresh ? 'Live' : 'Static'}
            </div>
            <div className={`text-xs text-gray-600 ${textClass}`}>
              Monitoring
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
      {renderMetricsOverview()}
      {renderControls()}
      {renderTabs()}

      <div className="space-y-6">
        {activeTab === 'overview' && renderProgressCards()}
        {activeTab === 'workflows' && renderActiveWorkflows()}
        {activeTab === 'timeline' && renderProgressTimeline()}
        {activeTab === 'automation' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-12">
              <PlayCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${headerClass}`}>
                Workflow Automation
              </h3>
              <p className={`text-gray-600 mb-6 ${textClass}`}>
                Create intelligent workflows to automate CAP management processes
              </p>
              <button
                onClick={() => setShowWorkflowAutomation(true)}
                className={`flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mx-auto ${textClass}`}
              >
                <PlayCircle className="h-5 w-5" />
                <span>Create Workflow</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressTracker 