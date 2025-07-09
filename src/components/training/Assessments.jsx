import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  , 
  Clock, 
  Award,
  Star,
  Target,
  BarChart3,
  FileText,
  Play,
  ,
  ,
  Edit,
  ,
  Plus,
  ,
  ,
  ,
  ,
  ,
  AlertTriangle,
  Info,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  ,
  Send,
  RefreshCw,
  ,
  ,
  ,
  Search,
  Grid,
  List,
  ,
  ,
  MousePointer,
  ToggleLeft,
  ,
  Hash,
  Type,
  ,
  
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAssessmentAttempts,
  submitAssessment,
  getAssessmentResults,
  generateCertificate,
  getAssessmentStatistics
} from '../../lib/supabase-enhanced'

const Assessments = ({ user, organizationId, moduleId = null }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [assessments, setAssessments] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeView, setActiveView] = useState('list') // 'list', 'create', 'edit', 'take', 'results'
  const [showCreateAssessment, setShowCreateAssessment] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [assessmentStarted, setAssessmentStarted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [error, setError] = useState('')

  useEffect(() => {
    loadAssessmentData()
  }, [organizationId, moduleId])

  useEffect(() => {
    let timer
    if (assessmentStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [assessmentStarted, timeRemaining])

  const loadAssessmentData = async () => {
    setLoading(true)
    setError('')

    try {
      const [assessmentsResult, statisticsResult] = await Promise.all([
        getAssessments(organizationId, { module_id: moduleId }),
        getAssessmentStatistics(organizationId)
      ])

      if (assessmentsResult.success) setAssessments(assessmentsResult.data)
      if (statisticsResult.success) setStatistics(statisticsResult.data)
    } catch (error) {
      console.error('Failed to load assessment data:', error)
      setError('Failed to load assessment data')
    } finally {
      setLoading(false)
    }
  }

  const loadAssessmentQuestions = async (assessmentId) => {
    try {
      const result = await getAssessmentQuestions(assessmentId)
      if (result.success) {
        setQuestions(result.data)
      }
    } catch (error) {
      console.error('Failed to load questions:', error)
    }
  }

  const handleCreateAssessment = async (assessmentData) => {
    try {
      const result = await createAssessment({
        ...assessmentData,
        organization_id: organizationId,
        module_id: moduleId,
        created_by: user.id
      })

      if (result.success) {
        await loadAssessmentData()
        setShowCreateAssessment(false)
      }
    } catch (error) {
      console.error('Failed to create assessment:', error)
    }
  }

  const handleStartAssessment = async (assessment) => {
    setSelectedAssessment(assessment)
    await loadAssessmentQuestions(assessment.id)
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setTimeRemaining(assessment.time_limit * 60) // Convert minutes to seconds
    setAssessmentStarted(true)
    setActiveView('take')
  }

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitAssessment = async () => {
    try {
      const submissionData = {
        assessment_id: selectedAssessment.id,
        user_id: user.id,
        answers: userAnswers,
        time_taken: (selectedAssessment.time_limit * 60) - timeRemaining,
        completed_at: new Date().toISOString()
      }

      const result = await submitAssessment(submissionData)
      if (result.success) {
        setAssessmentStarted(false)
        setActiveView('results')
        await loadAssessmentData()
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error)
    }
  }

  const handleAutoSubmit = () => {
    handleSubmitAssessment()
  }

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <MousePointer className="h-4 w-4" />
      case 'true_false': return <ToggleLeft className="h-4 w-4" />
      case 'short_answer': return <Type className="h-4 w-4" />
      case 'essay': return <FileText className="h-4 w-4" />
      case 'matching': return <Target className="h-4 w-4" />
      case 'fill_blank': return <Hash className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total Assessments
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {statistics.total_assessments}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Completed Attempts
              </p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.completed_attempts}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Average Score
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.average_score}%
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Pass Rate
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {statistics.pass_rate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderAssessmentCard = (assessment) => (
    <div key={assessment.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
              {assessment.title}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(assessment.difficulty)}`}>
              {assessment.difficulty}
            </span>
          </div>
          <p className={`text-gray-600 mb-3 ${textClass}`}>
            {assessment.description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedAssessment(assessment)
              setActiveView('edit')
            }}
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedAssessment(assessment)
              setActiveView('results')
            }}
            className="p-2 text-gray-400 hover:text-green-600"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{assessment.question_count}</div>
          <div className="text-xs text-gray-500">Questions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{assessment.time_limit}</div>
          <div className="text-xs text-gray-500">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{assessment.passing_score}%</div>
          <div className="text-xs text-gray-500">Pass Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{assessment.attempt_count}</div>
          <div className="text-xs text-gray-500">Attempts</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Created {new Date(assessment.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleStartAssessment(assessment)}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <Play className="h-4 w-4" />
            <span>Take Assessment</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderAssessmentList = () => {
    const filteredAssessments = assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assessment.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || assessment.type === filterType
      return matchesSearch && matchesType
    })

    if (filteredAssessments.length === 0) {
      return (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Assessments Found
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            No assessments match your current filters
          </p>
          {user.role === 'admin' || user.role === 'training_manager' ? (
            <button
              onClick={() => setShowCreateAssessment(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Create First Assessment</span>
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
        {filteredAssessments.map(assessment => renderAssessmentCard(assessment))}
      </div>
    )
  }

  const renderQuestion = (question, index) => {
    const userAnswer = userAnswers[question.id]

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getQuestionTypeIcon(question.type)}
            <span className={`text-sm text-gray-600 ${textClass}`}>
              Question {index + 1} of {questions.length}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{question.points} points</span>
            <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
          </div>
        </div>

        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          {question.question_text}
        </h3>

        {question.image_url && (
          <div className="mb-4">
            <img
              src={question.image_url}
              alt="Question illustration"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        <div className="space-y-3">
          {question.type === 'multiple_choice' && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option.id}
                    checked={userAnswer === option.id}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`${textClass}`}>{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'true_false' && (
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value="true"
                  checked={userAnswer === 'true'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`${textClass}`}>True</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value="false"
                  checked={userAnswer === 'false'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`${textClass}`}>False</span>
              </label>
            </div>
          )}

          {question.type === 'short_answer' && (
            <input
              type="text"
              value={userAnswer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              placeholder="Enter your answer..."
            />
          )}

          {question.type === 'essay' && (
            <textarea
              value={userAnswer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
              placeholder="Enter your detailed answer..."
            />
          )}
        </div>

        {question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className={`text-sm font-medium text-blue-900 ${textClass}`}>
                Hint
              </span>
            </div>
            <p className={`text-blue-800 text-sm ${textClass}`}>
              {question.explanation}
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderAssessmentTaking = () => {
    if (!selectedAssessment || questions.length === 0) return null

    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold text-gray-900 ${headerClass}`}>
                {selectedAssessment.title}
              </h2>
              <p className={`text-gray-600 ${textClass}`}>
                Assessment in progress
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-500">Time Left</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentQuestionIndex + 1}/{questions.length}
                </div>
                <div className="text-xs text-gray-500">Questions</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        {renderQuestion(currentQuestion, currentQuestionIndex)}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitAssessment}
                className={`flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
              >
                <Send className="h-4 w-4" />
                <span>Submit Assessment</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className={`text-sm font-medium text-gray-900 mb-3 ${textClass}`}>
            Question Navigator
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : userAnswers[questions[index].id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
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
              placeholder="Search assessments..."
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
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="certification">Certification</option>
            <option value="practice">Practice</option>
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
            onClick={loadAssessmentData}
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          {user.role === 'admin' || user.role === 'training_manager' ? (
            <button
              onClick={() => setShowCreateAssessment(true)}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Assessment</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Assessments & Certification
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Test knowledge and award certifications for completed training
          </p>
        </div>
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
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (activeView === 'take') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {renderAssessmentTaking()}
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
      {renderAssessmentList()}
    </div>
  )
}

export default Assessments 