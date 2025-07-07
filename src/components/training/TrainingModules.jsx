import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Users,
  Star,
  Award,
  BarChart3,
  FileText,
  Video,
  Image,
  Download,
  Upload,
  Plus,
  Edit,
  Eye,
  X,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Target,
  TrendingUp,
  User,
  ChevronRight,
  PlayCircle,
  Pause,
  SkipForward,
  Volume2,
  Settings,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getTrainingModules,
  getTrainingStatistics,
  getTrainingProgress,
  createTrainingModule,
  updateTrainingModule,
  deleteTrainingModule,
  enrollUserInModule,
  getModuleContent,
  updateProgress,
  getTrainingAnalytics
} from '../../lib/supabase-enhanced'

const TrainingModules = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [modules, setModules] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [userProgress, setUserProgress] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedModule, setSelectedModule] = useState(null)
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [showModuleDetails, setShowModuleDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTrainingData()
  }, [organizationId])

  const loadTrainingData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        modulesResult,
        statisticsResult,
        progressResult,
        analyticsResult
      ] = await Promise.all([
        getTrainingModules(organizationId),
        getTrainingStatistics(organizationId),
        getTrainingProgress(user.id, organizationId),
        getTrainingAnalytics(organizationId)
      ])

      if (modulesResult.success) setModules(modulesResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
      if (progressResult.success) setUserProgress(progressResult.data)
      if (analyticsResult.success) setAnalytics(analyticsResult.data)
    } catch (error) {
      console.error('Failed to load training data:', error)
      setError('Failed to load training data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModule = async (moduleData) => {
    try {
      const result = await createTrainingModule({
        ...moduleData,
        organization_id: organizationId,
        created_by: user.id
      })

      if (result.success) {
        await loadTrainingData()
        setShowCreateModule(false)
      }
    } catch (error) {
      console.error('Failed to create module:', error)
    }
  }

  const handleEnrollUser = async (moduleId) => {
    try {
      const result = await enrollUserInModule(moduleId, user.id)
      if (result.success) {
        await loadTrainingData()
      }
    } catch (error) {
      console.error('Failed to enroll user:', error)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'safety': return <Settings className="h-5 w-5" />
      case 'compliance': return <FileText className="h-5 w-5" />
      case 'hr': return <Users className="h-5 w-5" />
      case 'technical': return <Monitor className="h-5 w-5" />
      case 'soft_skills': return <User className="h-5 w-5" />
      case 'orientation': return <Globe className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
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
                Total Modules
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {statistics.total_modules}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-blue-600 font-medium">
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
                Active Learners
              </p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.active_learners}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                {statistics.engagement_rate}%
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                engagement rate
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Completion Rate
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.completion_rate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-purple-600 font-medium">
                {statistics.certificates_issued}
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                certificates
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Avg Score
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {statistics.average_score}%
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className={`text-sm ${statistics.average_score >= 80 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                {statistics.average_score >= 80 ? 'Excellent' : 'Good'}
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                performance
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
              placeholder="Search training modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Categories</option>
            <option value="safety">Safety</option>
            <option value="compliance">Compliance</option>
            <option value="hr">Human Resources</option>
            <option value="technical">Technical</option>
            <option value="soft_skills">Soft Skills</option>
            <option value="orientation">Orientation</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={loadTrainingData}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          {user.role === 'admin' || user.role === 'training_manager' ? (
            <button
              onClick={() => setShowCreateModule(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Module</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  const renderModuleCard = (module) => {
    const userModuleProgress = userProgress.find(p => p.module_id === module.id)
    const progressPercentage = userModuleProgress?.progress_percentage || 0
    const status = userModuleProgress?.status || 'not_started'

    return (
      <div key={module.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {module.thumbnail_url && (
          <div className="h-48 bg-gray-200 relative">
            <img
              src={module.thumbnail_url}
              alt={module.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <PlayCircle className="h-16 w-16 text-white opacity-80" />
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(module.category)}
              <span className={`text-sm text-gray-600 ${textClass}`}>
                {module.category?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(module.difficulty)}`}>
              {module.difficulty}
            </span>
          </div>

          <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${headerClass}`}>
            {module.title}
          </h3>
          
          <p className={`text-gray-600 mb-4 line-clamp-2 ${textClass}`}>
            {module.description}
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Duration: {module.estimated_duration} min</span>
              <span className="text-gray-500">{module.lesson_count} lessons</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                <Star className="h-4 w-4 inline text-yellow-400 mr-1" />
                {module.rating}/5.0 ({module.review_count} reviews)
              </span>
              <span className="text-gray-500">{module.enrolled_count} enrolled</span>
            </div>

            {userModuleProgress && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">Progress</span>
                  <span className="text-gray-700">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
              {status.replace('_', ' ').toUpperCase()}
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedModule(module)
                  setShowModuleDetails(true)
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
              
              {status === 'not_started' ? (
                <button
                  onClick={() => handleEnrollUser(module.id)}
                  className={`flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm ${textClass}`}
                >
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedModule(module)
                    setShowModuleDetails(true)
                  }}
                  className={`flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm ${textClass}`}
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Continue</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderModulesList = () => {
    const filteredModules = modules.filter(module => {
      const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || module.category === filterCategory
      
      let matchesStatus = true
      if (filterStatus !== 'all') {
        const userModuleProgress = userProgress.find(p => p.module_id === module.id)
        const status = userModuleProgress?.status || 'not_started'
        matchesStatus = status === filterStatus
      }
      
      return matchesSearch && matchesCategory && matchesStatus
    })

    if (filteredModules.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Training Modules Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No modules match your current filters
          </p>
          {user.role === 'admin' || user.role === 'training_manager' ? (
            <button
              onClick={() => setShowCreateModule(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Create First Module</span>
            </button>
          ) : null}
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
        'space-y-4'
      }>
        {filteredModules.map(module => renderModuleCard(module))}
      </div>
    )
  }

  const renderMyProgress = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          My Learning Progress
        </h3>
        
        {userProgress.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
              Start Your Learning Journey
            </h4>
            <p className={`text-gray-500 mb-4 ${textClass}`}>
              Enroll in training modules to track your progress
            </p>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse Modules</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userProgress.map(progress => {
              const module = modules.find(m => m.id === progress.module_id)
              if (!module) return null
              
              return (
                <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getCategoryIcon(module.category)}
                        <h4 className={`font-semibold text-gray-900 ${textClass}`}>
                          {module.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(progress.status)}`}>
                          {progress.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Progress:</span>
                          <span className="font-medium text-gray-900 ml-1">{progress.progress_percentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time Spent:</span>
                          <span className="font-medium text-gray-900 ml-1">{progress.time_spent} min</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Score:</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {progress.last_assessment_score ? `${progress.last_assessment_score}%` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Access:</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {new Date(progress.last_accessed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">Completion Progress</span>
                          <span className="text-gray-700">{progress.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progress.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {progress.status === 'completed' && progress.certificate_issued && (
                        <button
                          className={`flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm ${textClass}`}
                        >
                          <Award className="h-4 w-4" />
                          <span>Certificate</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedModule(module)
                          setShowModuleDetails(true)
                        }}
                        className={`flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm ${textClass}`}
                      >
                        <PlayCircle className="h-4 w-4" />
                        <span>Continue</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const renderAnalytics = () => {
    if (!analytics) return null

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
              Learning by Category
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.by_category).map(([category, data]) => {
                const percentage = Math.round((data.enrollments / analytics.total_enrollments) * 100) || 0
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span className={`text-sm text-gray-600 ${textClass}`}>
                        {category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {data.enrollments}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
              Completion Trends
            </h3>
            <div className="space-y-3">
              {analytics.completion_trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`text-sm text-gray-600 ${textClass}`}>
                    {trend.month}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${trend.completion_rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {trend.completion_rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTabs = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex space-x-8 px-6">
        {[
          { id: 'overview', label: 'All Modules', icon: BookOpen },
          { id: 'progress', label: 'My Progress', icon: TrendingUp },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
      case 'overview': 
        return (
          <div>
            {renderControls()}
            {renderModulesList()}
          </div>
        )
      case 'progress': return renderMyProgress()
      case 'analytics': return renderAnalytics()
      default: 
        return (
          <div>
            {renderControls()}
            {renderModulesList()}
          </div>
        )
    }
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Training Modules
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Comprehensive compliance training and skill development programs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadTrainingData}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              Phase 6
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>
              Training
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
      {renderTabs()}
      {renderTabContent()}
    </div>
  )
}

export default TrainingModules 