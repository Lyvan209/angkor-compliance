import { useCallback, useRef } from 'react'

/**
 * Custom hook for optimized callbacks that prevent unnecessary re-renders
 * Automatically handles common callback patterns with stable references
 */
export const useOptimizedCallback = () => {
  const callbacksRef = useRef({})

  // Memoized callback for handling form submissions
  const handleSubmit = useCallback((onSubmit) => {
    return (formData) => {
      if (typeof onSubmit === 'function') {
        onSubmit(formData)
      }
    }
  }, [])

  // Memoized callback for handling item selection
  const handleSelect = useCallback((onSelect) => {
    return (item) => {
      if (typeof onSelect === 'function') {
        onSelect(item)
      }
    }
  }, [])

  // Memoized callback for handling item deletion
  const handleDelete = useCallback((onDelete) => {
    return (itemId) => {
      if (typeof onDelete === 'function') {
        onDelete(itemId)
      }
    }
  }, [])

  // Memoized callback for handling navigation
  const handleNavigate = useCallback((onNavigate) => {
    return (route) => {
      if (typeof onNavigate === 'function') {
        onNavigate(route)
      }
    }
  }, [])

  // Memoized callback for handling modal operations
  const handleModal = useCallback((onOpen, onClose) => {
    return {
      open: (data) => {
        if (typeof onOpen === 'function') {
          onOpen(data)
        }
      },
      close: () => {
        if (typeof onClose === 'function') {
          onClose()
        }
      }
    }
  }, [])

  return {
    handleSubmit,
    handleSelect,
    handleDelete,
    handleNavigate,
    handleModal
  }
}

/**
 * Custom hook for memoizing expensive computations
 */
export const useOptimizedMemo = (data, dependencies = []) => {
  const memoizedData = useMemo(() => {
    if (!data) return null
    
    // Common data processing optimizations
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        // Add computed properties if needed
        displayName: item.name || item.title || item.label || 'Unnamed'
      }))
    }
    
    return data
  }, [data, ...dependencies])

  return memoizedData
}

export default useOptimizedCallback 