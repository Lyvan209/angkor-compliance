import PropTypes from 'prop-types'
import { memo, forwardRef } from 'react'

const AccessibleInput = memo(forwardRef(({ 
  label, 
  id, 
  error, 
  helperText, 
  required = false, 
  type = 'text', 
  className = '',
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <div className="mb-4">
      <label 
        htmlFor={inputId} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
        aria-required={required}
        {...props}
      />
      
      {error && (
        <div id={errorId} className="text-red-600 text-sm mt-1" role="alert">
          {error}
        </div>
      )}
      
      {helperText && (
        <div id={helperId} className="text-gray-500 text-sm mt-1">
          {helperText}
        </div>
      )}
    </div>
  )
}))

const AccessibleTextarea = memo(forwardRef(({ 
  label, 
  id, 
  error, 
  helperText, 
  required = false, 
  rows = 4, 
  className = '',
  ...props 
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${textareaId}-error`
  const helperId = `${textareaId}-helper`

  return (
    <div className="mb-4">
      <label 
        htmlFor={textareaId} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
        aria-required={required}
        {...props}
      />
      
      {error && (
        <div id={errorId} className="text-red-600 text-sm mt-1" role="alert">
          {error}
        </div>
      )}
      
      {helperText && (
        <div id={helperId} className="text-gray-500 text-sm mt-1">
          {helperText}
        </div>
      )}
    </div>
  )
}))

AccessibleInput.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string
}

AccessibleTextarea.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  rows: PropTypes.number,
  className: PropTypes.string
}

AccessibleInput.displayName = 'AccessibleInput'
AccessibleTextarea.displayName = 'AccessibleTextarea'

export { AccessibleInput, AccessibleTextarea } 