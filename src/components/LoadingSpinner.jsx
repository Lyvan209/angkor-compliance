import PropTypes from 'prop-types'
import { memo } from 'react'

const LoadingSpinner = memo(({ 
  size = 'md', 
  variant = 'primary', 
  text = '', 
  className = '',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    white: 'text-white'
  }

  const spinnerElement = (
    <div className="flex items-center justify-center space-x-2">
      <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
        <div className="sr-only">Loading...</div>
      </div>
      {text && (
        <span className={`text-sm font-medium ${variantClasses[variant]}`}>
          {text}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          {spinnerElement}
        </div>
      </div>
    )
  }

  return spinnerElement
})

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'white']),
  text: PropTypes.string,
  className: PropTypes.string,
  fullScreen: PropTypes.bool
}

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner 