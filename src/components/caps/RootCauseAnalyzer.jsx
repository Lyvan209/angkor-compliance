import { useState, useEffect } from 'react'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  BarChart3,
  Lightbulb,
  Shield,
  Zap,
  ,
  ,
  Download,
  ,
  ArrowRight,
  ,
  
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  analyzeRootCause,
  getComplianceIssues,
  generateAIInsights,
  getPatternAnalysis,
  getRiskPredictions,
  exportAnalysisReport
} from '../../lib/supabase-enhanced'

const RootCauseAnalyzer = ({ organizationId, user }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [issues, setIssues] = useState([])
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [aiInsights, setAIInsights] = useState(null)
  const [patternAnalysis, setPatternAnalysis] = useState(null)
  const [riskPredictions, setRiskPredictions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('analysis') // 'analysis', 'patterns', 'predictions', 'insights'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    loadIssues()
  }, [organizationId])

  const loadIssues = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await getComplianceIssues(organizationId, {
        status: 'open',
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 100
      })

      if (result.success) {
        setIssues(result.data)
      }
    } catch (error) {
      console.error('Failed to load issues:', error)
      setError('Failed to load compliance issues')
    } finally {
      setLoading(false)
    }
  }

  const handleIssueSelect = async (issue) => {
    setSelectedIssue(issue)
    setAnalysisLoading(true)
    setError('')

    try {
      const [analysisResult, insightsResult, patternResult, riskResult] = await Promise.all([
        analyzeRootCause(issue.id, organizationId),
        generateAIInsights(issue.id, organizationId),
        getPatternAnalysis(organizationId, { category: issue.category }),
        getRiskPredictions(organizationId, { issueId: issue.id })
      ])

      if (analysisResult.success) setAnalysis(analysisResult.data)
      if (insightsResult.success) setAIInsights(insightsResult.data)
      if (patternResult.success) setPatternAnalysis(patternResult.data)
      if (riskResult.success) setRiskPredictions(riskResult.data)
    } catch (error) {
      console.error('Analysis failed:', error)
      setError('Failed to perform root cause analysis')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleExportReport = async () => {
    if (!selectedIssue || !analysis) return

    try {
      const result = await exportAnalysisReport(organizationId, {
        issueId: selectedIssue.id,
        includeAnalysis: true,
        includeInsights: true,
        includePatterns: true,
        includePredictions: true,
        format: 'pdf'
      })

      if (result.success) {
        const link = document.createElement('a')
        link.href = result.data.url
        link.download = `root-cause-analysis-${selectedIssue.id}.pdf`
        link.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getIssueStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const renderIssueSelector = () => {
    const filteredIssues = issues.filter(issue => {
      const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || issue.category === filterCategory
      return matchesSearch && matchesCategory
    })

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Select Issue for Analysis
          </h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
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
              <option value="environmental">Environmental</option>
              <option value="quality">Quality</option>
              <option value="permit">Permit</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
          {filteredIssues.map(issue => (
            <div
              key={issue.id}
              onClick={() => handleIssueSelect(issue)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedIssue?.id === issue.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getPriorityIcon(issue.priority)}
                    <h4 className={`font-medium text-gray-900 ${textClass}`}>
                      {issue.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getIssueStatusColor(issue.status)}`}>
                      {issue.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className={`text-sm text-gray-600 ${textClass}`}>
                    {issue.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Category: {issue.category}</span>
                    <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {filteredIssues.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className={`text-gray-500 ${textClass}`}>
              No issues found matching your criteria
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderAnalysisTabs = () => (
    <div className="mb-6">
      <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'analysis', label: 'Root Cause', icon: Target },
          { id: 'insights', label: 'AI Insights', icon: Brain },
          { id: 'patterns', label: 'Patterns', icon: BarChart3 },
          { id: 'predictions', label: 'Risk Predictions', icon: TrendingUp }
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

  const renderRootCauseAnalysis = () => {
    if (!analysis) return null

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
              Primary Root Cause
            </h3>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className={`text-sm font-medium text-blue-600 ${textClass}`}>
                AI Analysis
              </span>
            </div>
          </div>
          <p className={`text-gray-700 text-lg ${textClass}`}>
            {analysis.primary_cause}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className={`font-semibold text-gray-900 mb-4 ${textClass}`}>
              Contributing Factors
            </h4>
            <div className="space-y-3">
              {analysis.contributing_factors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <p className={`text-gray-700 ${textClass}`}>{factor}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className={`font-semibold text-gray-900 mb-4 ${textClass}`}>
              Risk Assessment
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-medium text-gray-700 ${textClass}`}>
                  Risk Level
                </span>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  analysis.risk_assessment.level === 'high' ? 'bg-red-100 text-red-800' :
                  analysis.risk_assessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {analysis.risk_assessment.level.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                {analysis.risk_assessment.factors.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className={`text-sm text-gray-600 ${textClass}`}>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className={`font-semibold text-gray-900 mb-4 ${textClass}`}>
            Recommended Actions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.recommended_actions.map((action, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className={`text-gray-700 ${textClass}`}>{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className={`font-semibold text-gray-900 mb-4 ${textClass}`}>
            Prevention Measures
          </h4>
          <div className="space-y-3">
            {analysis.prevention_measures.map((measure, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className={`text-gray-700 ${textClass}`}>{measure}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAIInsights = () => {
    if (!aiInsights) return null

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="h-8 w-8" />
            <h3 className="text-xl font-semibold">AI-Powered Insights</h3>
          </div>
          <p className="text-purple-100">
            Advanced machine learning analysis of compliance patterns and predictive insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiInsights.insights?.map((insight, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'critical' ? 'bg-red-100' :
                  insight.type === 'warning' ? 'bg-yellow-100' :
                  insight.type === 'insight' ? 'bg-blue-100' :
                  'bg-green-100'
                }`}>
                  <Lightbulb className={`h-5 w-5 ${
                    insight.type === 'critical' ? 'text-red-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'insight' ? 'text-blue-600' :
                    'text-green-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-gray-900 mb-2 ${textClass}`}>
                    {insight.title}
                  </h4>
                  <p className={`text-gray-700 mb-3 ${textClass}`}>
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}% Confidence
                    </span>
                    <span className={`text-xs text-gray-500 ${textClass}`}>
                      {insight.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPatternAnalysis = () => {
    if (!patternAnalysis) return null

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Historical Pattern Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {patternAnalysis.similar_issues_count || 0}
              </div>
              <div className={`text-sm text-gray-600 ${textClass}`}>
                Similar Issues Found
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {patternAnalysis.resolution_rate || 0}%
              </div>
              <div className={`text-sm text-gray-600 ${textClass}`}>
                Historical Resolution Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {patternAnalysis.avg_resolution_time || 0}
              </div>
              <div className={`text-sm text-gray-600 ${textClass}`}>
                Avg Resolution Days
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className={`font-semibold text-gray-900 mb-4 ${textClass}`}>
            Identified Patterns
          </h4>
          <div className="space-y-4">
            {patternAnalysis.patterns?.map((pattern, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-medium text-gray-900 ${textClass}`}>
                    {pattern.name}
                  </h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pattern.frequency === 'high' ? 'bg-red-100 text-red-800' :
                    pattern.frequency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {pattern.frequency?.toUpperCase()} FREQUENCY
                  </span>
                </div>
                <p className={`text-gray-700 text-sm ${textClass}`}>
                  {pattern.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderRiskPredictions = () => {
    if (!riskPredictions) return null

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Risk Predictions & Early Warnings
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {riskPredictions.predictions?.map((prediction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {prediction.risk_type}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`h-4 w-4 ${
                      prediction.probability > 70 ? 'text-red-600' :
                      prediction.probability > 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      prediction.probability > 70 ? 'text-red-600' :
                      prediction.probability > 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {prediction.probability}%
                    </span>
                  </div>
                </div>
                <p className={`text-gray-700 text-sm mb-3 ${textClass}`}>
                  {prediction.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Timeframe: {prediction.timeframe}</span>
                  <span>Impact: {prediction.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            AI Root Cause Analysis
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Advanced AI-powered analysis for intelligent compliance issue diagnosis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedIssue && analysis && (
            <button
              onClick={handleExportReport}
              className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${textClass}`}
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          )}
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              AI Powered
            </div>
            <div className={`text-xs text-gray-600 ${textClass}`}>
              Machine Learning
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
      {renderIssueSelector()}

      {selectedIssue && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Analyzing: {selectedIssue.title}
          </h3>
          {analysisLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className={`text-gray-600 ${textClass}`}>
                  AI is analyzing the issue...
                </span>
              </div>
            </div>
          ) : (
            <>
              {renderAnalysisTabs()}
              <div className="space-y-6">
                {activeTab === 'analysis' && renderRootCauseAnalysis()}
                {activeTab === 'insights' && renderAIInsights()}
                {activeTab === 'patterns' && renderPatternAnalysis()}
                {activeTab === 'predictions' && renderRiskPredictions()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default RootCauseAnalyzer 