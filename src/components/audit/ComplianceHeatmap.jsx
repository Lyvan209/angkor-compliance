import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Eye,
  Filter,
  Calendar,
  MapPin,
  Building,
  ,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  getComplianceHeatmapData,
  getComplianceByDepartment,
  getComplianceByArea,
  getComplianceDetails
} from '../../lib/supabase-enhanced'

const ComplianceHeatmap = ({ organizationId, selectedPeriod = '30d' }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [heatmapData, setHeatmapData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [areaData, setAreaData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState(null)
  const [viewMode, setViewMode] = useState('department') // 'department' or 'area'
  const [filterLevel, setFilterLevel] = useState('all') // 'all', 'critical', 'warning', 'compliant'
  const [drilldownData, setDrilldownData] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHeatmapData()
  }, [organizationId, selectedPeriod, viewMode])

  const loadHeatmapData = async () => {
    setLoading(true)
    setError('')

    try {
      const [heatmapResult, departmentResult, areaResult] = await Promise.all([
        getComplianceHeatmapData(organizationId, { period: selectedPeriod }),
        getComplianceByDepartment(organizationId, { period: selectedPeriod }),
        getComplianceByArea(organizationId, { period: selectedPeriod })
      ])

      if (heatmapResult.success) setHeatmapData(heatmapResult.data)
      if (departmentResult.success) setDepartmentData(departmentResult.data)
      if (areaResult.success) setAreaData(areaResult.data)
    } catch (error) {
      console.error('Failed to load heatmap data:', error)
      setError('Failed to load compliance heatmap data')
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = async (cell) => {
    setSelectedCell(cell)
    setShowDetails(true)
    
    try {
      const detailsResult = await getComplianceDetails(organizationId, {
        type: viewMode,
        id: cell.id,
        period: selectedPeriod
      })
      
      if (detailsResult.success) {
        setDrilldownData(detailsResult.data)
      }
    } catch (error) {
      console.error('Failed to load compliance details:', error)
    }
  }

  const getComplianceScore = (score) => {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'warning'
    return 'critical'
  }

  const getScoreColor = (score) => {
    const level = getComplianceScore(score)
    switch (level) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const getTextColor = (score) => {
    const level = getComplianceScore(score)
    switch (level) {
      case 'excellent': return 'text-green-800'
      case 'good': return 'text-blue-800'
      case 'warning': return 'text-yellow-800'
      case 'critical': return 'text-red-800'
      default: return 'text-gray-800'
    }
  }

  const getCurrentData = () => {
    return viewMode === 'department' ? departmentData : areaData
  }

  const getFilteredData = () => {
    const data = getCurrentData()
    if (filterLevel === 'all') return data
    
    return data.filter(item => {
      const level = getComplianceScore(item.compliance_score)
      return level === filterLevel
    })
  }

  const renderHeatmapGrid = () => {
    const data = getFilteredData()
    
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No Data Available
          </h3>
          <p className={`text-gray-500 ${textClass}`}>
            No compliance data found for the selected period and filters
          </p>
        </div>
      )
    }

    const gridCols = Math.ceil(Math.sqrt(data.length))
    const gridRows = Math.ceil(data.length / gridCols)

    return (
      <div 
        className="grid gap-3 p-4" 
        style={{ 
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`
        }}
      >
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-md ${
              selectedCell?.id === item.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
            onClick={() => handleCellClick(item)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {viewMode === 'department' ? (
                  <Building className="h-4 w-4 text-gray-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-gray-600" />
                )}
                <span className={`text-sm font-medium text-gray-900 ${textClass}`}>
                  {item.name}
                </span>
              </div>
              <Eye className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs text-gray-600 ${textClass}`}>
                  Compliance Score
                </span>
                <span className={`text-sm font-bold ${getTextColor(item.compliance_score)}`}>
                  {item.compliance_score}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreColor(item.compliance_score)}`}
                  style={{ width: `${item.compliance_score}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className={textClass}>
                  {item.total_checks || 0} checks
                </span>
                <span className={textClass}>
                  {item.issues || 0} issues
                </span>
              </div>
            </div>
            
            {item.trend && (
              <div className="absolute -top-2 -right-2">
                {item.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600 bg-white rounded-full p-1 shadow-sm" />
                ) : item.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-600 bg-white rounded-full p-1 shadow-sm" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-600 bg-white rounded-full p-1 shadow-sm" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderLegend = () => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h4 className={`text-sm font-medium text-gray-900 mb-3 ${headerClass}`}>
        Compliance Score Legend
      </h4>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className={`text-sm text-gray-700 ${textClass}`}>Excellent (90-100%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className={`text-sm text-gray-700 ${textClass}`}>Good (75-89%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className={`text-sm text-gray-700 ${textClass}`}>Warning (60-74%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className={`text-sm text-gray-700 ${textClass}`}>Critical (0-59%)</span>
        </div>
      </div>
    </div>
  )

  const renderControls = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
              View Mode:
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="department">By Department</option>
              <option value="area">By Area</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium text-gray-700 ${textClass}`}>
              Filter:
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warning Only</option>
              <option value="good">Good Only</option>
              <option value="excellent">Excellent Only</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={loadHeatmapData}
          className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  )

  const renderDrilldownModal = () => {
    if (!showDetails || !selectedCell) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
                {selectedCell.name} - Compliance Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className={`font-medium text-gray-900 mb-2 ${textClass}`}>
                  Overall Score
                </h4>
                <div className="text-3xl font-bold text-blue-600">
                  {selectedCell.compliance_score}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${getScoreColor(selectedCell.compliance_score)}`}
                    style={{ width: `${selectedCell.compliance_score}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className={`font-medium text-gray-900 mb-2 ${textClass}`}>
                  Key Metrics
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm text-gray-600 ${textClass}`}>Total Checks:</span>
                    <span className={`text-sm font-medium ${textClass}`}>{selectedCell.total_checks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm text-gray-600 ${textClass}`}>Issues Found:</span>
                    <span className={`text-sm font-medium ${textClass}`}>{selectedCell.issues || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm text-gray-600 ${textClass}`}>Last Updated:</span>
                    <span className={`text-sm font-medium ${textClass}`}>
                      {selectedCell.last_updated ? new Date(selectedCell.last_updated).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {drilldownData && (
              <div className="space-y-4">
                <h4 className={`font-medium text-gray-900 ${textClass}`}>
                  Recent Compliance Issues
                </h4>
                <div className="space-y-3">
                  {drilldownData.issues?.map((issue, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className={`font-medium text-gray-900 ${textClass}`}>
                            {issue.title}
                          </h5>
                          <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
                            {issue.description}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
            Compliance Heatmap
          </h3>
          <p className={`text-sm text-gray-600 mt-1 ${textClass}`}>
            Visual compliance status mapping with drill-down capabilities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className={`text-sm text-gray-600 ${textClass}`}>
            {selectedPeriod === '7d' ? 'Last 7 days' :
             selectedPeriod === '30d' ? 'Last 30 days' :
             selectedPeriod === '90d' ? 'Last 90 days' : 'Last year'}
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
      {renderLegend()}
      {renderHeatmapGrid()}
      {renderDrilldownModal()}
    </div>
  )
}

export default ComplianceHeatmap 