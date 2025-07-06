import { BarChart3, TrendingUp, MoreHorizontal } from 'lucide-react'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'

const ChartWidget = ({ 
  title, 
  subtitle,
  data = [], 
  type = 'bar',
  height = 'h-64',
  showLegend = true,
  onMoreClick,
  loading = false 
}) => {
  const { textClass, headerClass } = useLanguageStyles()

  // Simple bar chart implementation
  const renderBarChart = () => {
    if (!data.length) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p className={`text-sm ${textClass}`}>No data available</p>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...data.map(item => item.value))
    
    return (
      <div className="flex items-end space-x-2 h-32">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t">
                <div 
                  className="bg-gradient-to-t from-amber-500 to-amber-400 rounded-t transition-all duration-500"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium text-gray-900 ${textClass}`}>
                  {item.value}
                </p>
                <p className={`text-xs text-gray-500 truncate ${textClass}`}>
                  {item.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Simple line chart implementation
  const renderLineChart = () => {
    if (!data.length) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <p className={`text-sm ${textClass}`}>No data available</p>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...data.map(item => item.value))
    const minValue = Math.min(...data.map(item => item.value))
    const range = maxValue - minValue || 1

    return (
      <div className="relative h-32">
        <svg className="w-full h-full" viewBox="0 0 400 100">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="400" 
              y2={y} 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400
              const y = 100 - ((item.value - minValue) / range) * 100
              return `${x},${y}`
            }).join(' ')}
          />
          
          {/* Area fill */}
          <polygon
            fill="url(#lineGradient)"
            points={[
              ...data.map((item, index) => {
                const x = (index / (data.length - 1)) * 400
                const y = 100 - ((item.value - minValue) / range) * 100
                return `${x},${y}`
              }),
              `400,100`,
              `0,100`
            ].join(' ')}
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400
            const y = 100 - ((item.value - minValue) / range) * 100
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-2">
          {data.map((item, index) => (
            <span key={index} className={`text-xs text-gray-500 ${textClass}`}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${height}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${height}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm text-gray-600 ${textClass}`}>
              {subtitle}
            </p>
          )}
        </div>
        {onMoreClick && (
          <button
            onClick={onMoreClick}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1">
        {type === 'line' ? renderLineChart() : renderBarChart()}
      </div>

      {/* Legend */}
      {showLegend && data.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
            <span className={`text-sm text-gray-600 ${textClass}`}>
              Current Period
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChartWidget 