import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import PropTypes from 'prop-types'
import { memo } from 'react'

const StatWidget = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'bg-blue-500', 
  trend, 
  trendValue,
  onClick,
  loading = false 
}) => {
  const { textClass, headerClass } = useLanguageStyles()

  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-amber-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3 mr-4 shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-600 truncate ${textClass}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold text-gray-900 ${headerClass}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs text-gray-500 truncate ${textClass}`}>
              {subtitle}
            </p>
          )}
          {(trend || trendValue) && (
            <div className="flex items-center mt-1">
              {getTrendIcon()}
              {trendValue && (
                <span className={`text-xs ml-1 ${getTrendColor()} ${textClass}`}>
                  {trendValue}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

StatWidget.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  color: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', null]),
  trendValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClick: PropTypes.func,
  loading: PropTypes.bool
}

StatWidget.displayName = 'StatWidget'

export default StatWidget 