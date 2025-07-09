import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart,
  Calendar,
  ,
  Download,
  RefreshCw,
  AlertTriangle,
  Target,
  Activity,
  ,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getHistoricalTrends,
  getComplianceTrendAnalysis,
  getComplianceCorrelations,
  getCompliancePredictions,
  exportTrendsReport
} from '../../lib/supabase-enhanced'

const HistoricalTrends = ({ organizationId, selectedPeriod = '90d' }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [trendsData, setTrendsData] = useState([])
  const [trendAnalysis, setTrendAnalysis] = useState(null)
  const [correlations, setCorrelations] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('trends') // 'trends', 'analysis', 'correlations', 'predictions'
  const [chartType, setChartType] = useState('line') // 'line', 'bar', 'area'
  const [selectedMetric, setSelectedMetric] = useState('overall_score')
  const [dateRange, setDateRange] = useState(selectedPeriod)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadHistoricalData()
  }, [organizationId, dateRange, selectedMetric])

  const loadHistoricalData = async () => {
    setLoading(true)
    setError('')

    try {
      const [trendsResult, analysisResult, correlationsResult, predictionsResult] = await Promise.all([
        getHistoricalTrends(organizationId, { 
          period: dateRange, 
          metric: selectedMetric 
        }),
        getComplianceTrendAnalysis(organizationId, { period: dateRange }),
        getComplianceCorrelations(organizationId, { period: dateRange }),
        getCompliancePredictions(organizationId, { period: dateRange })
      ])

      if (trendsResult.success) setTrendsData(trendsResult.data)
      if (analysisResult.success) setTrendAnalysis(analysisResult.data)
      if (correlationsResult.success) setCorrelations(correlationsResult.data)
      if (predictionsResult.success) setPredictions(predictionsResult.data)
    } catch (error) {
      console.error('Failed to load historical data:', error)
      setError('Failed to load historical trends data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportTrendsReport(organizationId, {
        period: dateRange,
        format: 'pdf',
        includeCharts: true,
        includeAnalysis: true
      })
      
      if (result.success) {
        // Download the file
        const link = document.createElement('a')
        link.href = result.data.url
        link.download = `compliance-trends-${dateRange}.pdf`
        link.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const renderTrendChart = () => {
    if (trendsData.length === 0) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Trend Data Available
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            No historical data found for the selected period and metric
          </p>
        </div>
      )
    }

    const maxScore = Math.max(...trendsData.map(d => d.score))
    const minScore = Math.min(...trendsData.map(d => d.score))
    const range = maxScore - minScore || 1

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Compliance Trend Analysis
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
        </div>

        {/* Simple Chart Visualization */}
        <div className="h-64 relative">
          <svg width="100%" height="100%" viewBox="0 0 800 250" className="border border-gray-200 rounded">
            {/* Y-axis labels */}
            <g>
              <text x="30" y="30" className="text-xs fill-gray-600">100%</text>
              <text x="30" y="80" className="text-xs fill-gray-600">75%</text>
              <text x="30" y="130" className="text-xs fill-gray-600">50%</text>
              <text x="30" y="180" className="text-xs fill-gray-600">25%</text>
              <text x="30" y="230" className="text-xs fill-gray-600">0%</text>
            </g>
            
            {/* Grid lines */}
            <g stroke="#e5e7eb" strokeWidth="1">
              <line x1="50" y1="20" x2="780" y2="20" />
              <line x1="50" y1="70" x2="780" y2="70" />
              <line x1="50" y1="120" x2="780" y2="120" />
              <line x1="50" y1="170" x2="780" y2="170" />
              <line x1="50" y1="220" x2="780" y2="220" />
            </g>

            {/* Data visualization */}
            {chartType === 'line' && (
              <g>
                <polyline
                  points={trendsData.map((d, i) => {
                    const x = 50 + (i * (730 / trendsData.length))
                    const y = 220 - ((d.score / 100) * 200)
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                {trendsData.map((d, i) => {
                  const x = 50 + (i * (730 / trendsData.length))
                  const y = 220 - ((d.score / 100) * 200)
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      className="hover:fill-blue-700"
                    />
                  )
                })}
              </g>
            )}

            {chartType === 'bar' && (
              <g>
                {trendsData.map((d, i) => {
                  const x = 50 + (i * (730 / trendsData.length))
                  const height = (d.score / 100) * 200
                  const y = 220 - height
                  const barWidth = (730 / trendsData.length) * 0.8
                  return (
                    <rect
                      key={i}
                      x={x - barWidth/2}
                      y={y}
                      width={barWidth}
                      height={height}
                      fill="#3b82f6"
                      className="hover:fill-blue-700"
                    />
                  )
                })}
              </g>
            )}

            {chartType === 'area' && (
              <g>
                <path
                  d={`M 50,220 ${trendsData.map((d, i) => {
                    const x = 50 + (i * (730 / trendsData.length))
                    const y = 220 - ((d.score / 100) * 200)
                    return `L ${x},${y}`
                  }).join(' ')} L ${50 + ((trendsData.length - 1) * (730 / trendsData.length))},220 Z`}
                  fill="#3b82f6"
                  fillOpacity="0.3"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* X-axis labels */}
            <g className="text-xs fill-gray-600">
              {trendsData.map((d, i) => {
                if (i % Math.ceil(trendsData.length / 6) === 0) {
                  const x = 50 + (i * (730 / trendsData.length))
                  return (
                    <text key={i} x={x} y="245" textAnchor="middle">
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                  )
                }
                return null
              })}
            </g>
          </svg>
        </div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {trendsData.length > 0 ? trendsData[trendsData.length - 1].score : 0}%
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>Current Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {maxScore}%
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>Peak Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {minScore}%
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>Lowest Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {(trendsData.reduce((sum, d) => sum + d.score, 0) / trendsData.length || 0).toFixed(1)}%
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>Average</div>
          </div>
        </div>
      </div>
    )
  }

  const renderTrendAnalysis = () => {
    if (!trendAnalysis) return null

    return (
      <div className="space-y-6">
        {/* Key Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Key Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {trendAnalysis.overall_trend > 0 ? '+' : ''}{trendAnalysis.overall_trend}%
                  </div>
                  <div className={`text-sm text-gray-600 ${textClass}`}>Overall Trend</div>
                </div>
                {trendAnalysis.overall_trend > 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : trendAnalysis.overall_trend < 0 ? (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                ) : (
                  <Minus className="h-8 w-8 text-gray-600" />
                )}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {trendAnalysis.best_performing_area || 'N/A'}
                  </div>
                  <div className={`text-sm text-gray-600 ${textClass}`}>Best Performing</div>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {trendAnalysis.attention_needed || 'N/A'}
                  </div>
                  <div className={`text-sm text-gray-600 ${textClass}`}>Needs Attention</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Trend Patterns */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Trend Patterns
          </h3>
          <div className="space-y-4">
            {trendAnalysis.patterns?.map((pattern, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-gray-900 ${textClass}`}>
                    {pattern.title}
                  </h4>
                  <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                    {pattern.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pattern.impact === 'positive' ? 'bg-green-100 text-green-800' :
                      pattern.impact === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pattern.impact?.toUpperCase()}
                    </span>
                    <span className={`text-xs text-gray-500 ${textClass}`}>
                      Confidence: {pattern.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderCorrelations = () => {
    if (correlations.length === 0) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Compliance Correlations
        </h3>
        <div className="space-y-4">
          {correlations.map((correlation, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium text-gray-900 ${textClass}`}>
                  {correlation.factor_a} ↔ {correlation.factor_b}
                </h4>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  correlation.strength === 'strong' ? 'bg-green-100 text-green-800' :
                  correlation.strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {correlation.strength?.toUpperCase()}
                </span>
              </div>
              <p className={`text-sm text-gray-600 mb-2 ${textClass}`}>
                {correlation.description}
              </p>
              <div className="flex items-center space-x-4">
                <span className={`text-xs text-gray-500 ${textClass}`}>
                  Correlation: {correlation.coefficient}
                </span>
                <span className={`text-xs text-gray-500 ${textClass}`}>
                  Significance: {correlation.significance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPredictions = () => {
    if (predictions.length === 0) return null

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
          Predictive Analytics
        </h3>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium text-gray-900 ${textClass}`}>
                  {prediction.metric}
                </h4>
                <div className="flex items-center space-x-2">
                  {prediction.trend === 'improving' ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : prediction.trend === 'declining' ? (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    prediction.trend === 'improving' ? 'text-green-600' :
                    prediction.trend === 'declining' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {prediction.predicted_value}%
                  </span>
                </div>
              </div>
              <p className={`text-sm text-gray-600 mb-2 ${textClass}`}>
                {prediction.description}
              </p>
              <div className="flex items-center space-x-4">
                <span className={`text-xs text-gray-500 ${textClass}`}>
                  Timeframe: {prediction.timeframe}
                </span>
                <span className={`text-xs text-gray-500 ${textClass}`}>
                  Confidence: {prediction.confidence}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderControls = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
              Period:
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="180d">Last 6 months</option>
              <option value="1y">Last year</option>
              <option value="2y">Last 2 years</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
              Metric:
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="overall_score">Overall Score</option>
              <option value="safety_score">Safety Score</option>
              <option value="environmental_score">Environmental Score</option>
              <option value="quality_score">Quality Score</option>
              <option value="permit_compliance">Permit Compliance</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadHistoricalData}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 ${textClass}`}
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderTabs = () => (
    <div className="mb-6">
      <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'trends', label: 'Trends', icon: LineChart },
          { id: 'analysis', label: 'Analysis', icon: BarChart3 },
          { id: 'correlations', label: 'Correlations', icon: Activity },
          { id: 'predictions', label: 'Predictions', icon: TrendingUp }
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Historical Trends Analytics
          </h3>
          <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
            Data-driven compliance insights and predictive analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className={`text-sm text-gray-600 ${textClass}`}>
            {dateRange === '30d' ? 'Last 30 days' :
             dateRange === '90d' ? 'Last 90 days' :
             dateRange === '180d' ? 'Last 6 months' :
             dateRange === '1y' ? 'Last year' : 'Last 2 years'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderControls()}
      {renderTabs()}

      <div className="space-y-6">
        {activeTab === 'trends' && renderTrendChart()}
        {activeTab === 'analysis' && renderTrendAnalysis()}
        {activeTab === 'correlations' && renderCorrelations()}
        {activeTab === 'predictions' && renderPredictions()}
      </div>
    </div>
  )
}

export default HistoricalTrends 