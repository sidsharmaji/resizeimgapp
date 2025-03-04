import { createContext, useContext, useState, useCallback } from 'react'

const ImageProcessingContext = createContext()

// Error types for consistent error handling
export const ErrorTypes = {
  FILE_SIZE: 'FILE_SIZE',
  FILE_TYPE: 'FILE_TYPE',
  PERMISSIONS: 'PERMISSIONS',
  NETWORK: 'NETWORK',
  PROCESSING: 'PROCESSING',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
}

export const ErrorMessages = {
  [ErrorTypes.FILE_SIZE]: 'File size exceeds the maximum limit',
  [ErrorTypes.FILE_TYPE]: 'Unsupported file type',
  [ErrorTypes.PERMISSIONS]: 'Permission denied for operation',
  [ErrorTypes.NETWORK]: 'Network error occurred while processing',
  [ErrorTypes.PROCESSING]: 'Error occurred while processing the image',
  [ErrorTypes.VALIDATION]: 'Invalid input parameters',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred'
}

export const useImageProcessing = () => {
  const context = useContext(ImageProcessingContext)
  if (!context) {
    throw new Error('useImageProcessing must be used within an ImageProcessingProvider')
  }
  return context
}

export const ImageProcessingProvider = ({ children }) => {
  const [history, setHistory] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [memoryUsage, setMemoryUsage] = useState(null)
  const [tooltips, setTooltips] = useState({
    resize: 'Change the dimensions of your image while maintaining quality',
    compress: 'Reduce file size with smart compression algorithms',
    convert: 'Convert your image between different formats',
    crop: 'Crop and adjust the dimensions of your image',
    rotate: 'Rotate and flip your image',
    watermark: 'Add custom text watermarks to your image'
  })

  const addToHistory = useCallback((operation) => {
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(operation)
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }, [history, currentIndex])

  const undo = useCallback(() => {
    if (currentIndex > -1) {
      setCurrentIndex(currentIndex - 1)
      return history[currentIndex - 1]
    }
    return null
  }, [history, currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
      return history[currentIndex + 1]
    }
    return null
  }, [history, currentIndex])

  const canUndo = currentIndex > -1
  const canRedo = currentIndex < history.length - 1

  const getTooltip = useCallback((tool) => tooltips[tool], [tooltips])

  const handleError = useCallback((type, message, details = null) => {
    setError({ 
      type, 
      message: message || ErrorMessages[type],
      details,
      timestamp: new Date().toISOString()
    })
    setLoading(false)
    setProgress(0)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const validateOperation = useCallback((operation) => {
    if (!operation || typeof operation !== 'object') {
      throw new Error('Invalid operation parameters')
    }
    return true
  }, [])

  const startLoading = useCallback(() => {
    setLoading(true)
    setError(null)
    setProgress(0)
  }, [])

  const stopLoading = useCallback(() => {
    setLoading(false)
    setProgress(100)
  }, [])

  const updateProgress = useCallback((value, message = '') => {
    setProgress(Math.min(Math.max(value, 0), 100))
    setProgressMessage(message)
    // Monitor memory usage
    if (window.performance && window.performance.memory) {
      setMemoryUsage({
        usedHeap: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)),
        totalHeap: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024))
      })
    }
  }, [])

  const cleanupResources = useCallback(() => {
    // Cleanup object URLs and release memory
    if (history.length > 0) {
      history.forEach(operation => {
        if (operation.resultUrl && operation.resultUrl.startsWith('blob:')) {
          URL.revokeObjectURL(operation.resultUrl)
        }
        if (operation.originalUrl && operation.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(operation.originalUrl)
        }
      })
    }
    // Reset states
    setProgress(0)
    setProgressMessage('')
    setMemoryUsage(null)
  }, [history])

  const value = {
    history,
    currentOperation: history[currentIndex],
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getTooltip,
    loading,
    error,
    progress,
    handleError,
    clearError,
    validateOperation,
    ErrorTypes,
    ErrorMessages,
    progressMessage,
    memoryUsage,
    cleanupResources
  }

  return (
    <ImageProcessingContext.Provider value={value}>
      {children}
    </ImageProcessingContext.Provider>
  )
}