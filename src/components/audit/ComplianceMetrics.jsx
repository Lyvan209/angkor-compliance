import { useState, useEffect } from 'react'
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { getComplianceMetrics, getComplianceScore } from '../../lib/supabase-enhanced'

const ComplianceMetrics = ({ organizationId, selectedPeriod = '30d' }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [metrics, setMetrics] = useState({})
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [organizationId, selectedPeriod])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const [metricsResult, scoreResult] = await Promise.all([
        getComplianceMetrics(organizationId, selectedPeriod),
        getComplianceScore(organizationId)
      ])

      if (metricsResult.success) setMetrics(metricsResult.data)
      if (scoreResult.success) setScore(scoreResult.data.score)
    } catch (error) {
      console.error('Failed to load compliance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Overall Compliance Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Compliance Score
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <p className={`text-3xl font-bold ${getScoreColor(score).split(' ')[0]} ${headerClass}`}>
                {score}%
              </p>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Attention'}
              </div>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getScoreColor(score).split(' ')[1]}`}>
            <Award className={`h-8 w-8 ${getScoreColor(score).split(' ')[0]}`} />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                score >= 90 ? 'bg-green-600' : 
                score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Active Audits */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Active Audits
            </p>
            <p className={`text-3xl font-bold text-gray-900 ${headerClass}`}>
              {metrics.active_audits || 0}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              {metrics.audit_trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${metrics.audit_trend > 0 ? 'text-green-600' : 'text-red-600'} ${textClass}`}>
                {Math.abs(metrics.audit_trend || 0)}% vs last period
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Compliance Issues */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Open Issues
            </p>
            <p className={`text-3xl font-bold text-gray-900 ${headerClass}`}>
              {metrics.open_issues || 0}
            </p>
            <p className={`text-sm text-gray-500 mt-1 ${textClass}`}>
              {metrics.critical_issues || 0} critical
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Compliance Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
              Compliance Trend
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <p className={`text-3xl font-bold ${
                metrics.trend > 0 ? 'text-green-600' : 'text-red-600'
              } ${headerClass}`}>
                {metrics.trend > 0 ? '+' : ''}{metrics.trend || 0}%
              </p>
              {metrics.trend > 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <p className={`text-sm text-gray-500 mt-1 ${textClass}`}>
              vs previous period
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            metrics.trend > 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Target className={`h-8 w-8 ${
              metrics.trend > 0 ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplianceMetrics 