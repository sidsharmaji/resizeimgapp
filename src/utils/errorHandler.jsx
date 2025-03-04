// Error handling utility for consistent error management across components

export const ErrorTypes = {
  FILE_SIZE: 'FILE_SIZE',
  FILE_TYPE: 'FILE_TYPE',
  NETWORK: 'NETWORK',
  PERMISSION: 'PERMISSION',
  PROCESSING: 'PROCESSING',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
}

export const ErrorMessages = {
  [ErrorTypes.FILE_SIZE]: 'File size exceeds the maximum limit',
  [ErrorTypes.FILE_TYPE]: 'Unsupported file type',
  [ErrorTypes.NETWORK]: 'Network error occurred while processing',
  [ErrorTypes.PERMISSION]: 'Permission denied for file operation',
  [ErrorTypes.PROCESSING]: 'Error occurred while processing the image',
  [ErrorTypes.VALIDATION]: 'Invalid input parameters',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred'
}

export class ImageProcessingError extends Error {
  constructor(type, message, details = null) {
    super(message || ErrorMessages[type])
    this.type = type
    this.details = details
    this.name = 'ImageProcessingError'
  }
}

export const validateImage = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options

  if (!file) {
    throw new ImageProcessingError(ErrorTypes.VALIDATION, 'No file selected')
  }

  if (file.size > maxSize) {
    throw new ImageProcessingError(
      ErrorTypes.FILE_SIZE,
      `File size (${Math.round(file.size / 1024)}KB) exceeds maximum limit (${Math.round(maxSize / 1024)}KB)`
    )
  }

  if (!allowedTypes.includes(file.type)) {
    throw new ImageProcessingError(
      ErrorTypes.FILE_TYPE,
      `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`
    )
  }

  return true
}

export const handleProcessingError = (error, setError) => {
  console.error('Image processing error:', error)

  if (error instanceof ImageProcessingError) {
    setError({
      type: error.type,
      message: error.message,
      details: error.details
    })
  } else if (error.name === 'SecurityError') {
    setError({
      type: ErrorTypes.PERMISSION,
      message: ErrorMessages[ErrorTypes.PERMISSION]
    })
  } else if (error.name === 'NetworkError' || error instanceof TypeError) {
    setError({
      type: ErrorTypes.NETWORK,
      message: ErrorMessages[ErrorTypes.NETWORK]
    })
  } else {
    setError({
      type: ErrorTypes.UNKNOWN,
      message: ErrorMessages[ErrorTypes.UNKNOWN]
    })
  }
}

export const ErrorComponent = ({ error, onClose }) => {
  if (!error) return null

  const getErrorIcon = (type) => {
    switch (type) {
      case ErrorTypes.FILE_SIZE:
        return '📁'
      case ErrorTypes.FILE_TYPE:
        return '🖼️'
      case ErrorTypes.NETWORK:
        return '🌐'
      case ErrorTypes.PERMISSION:
        return '🔒'
      case ErrorTypes.PROCESSING:
        return '⚙️'
      case ErrorTypes.VALIDATION:
        return '⚠️'
      default:
        return '❌'
    }
  }

  const getErrorClass = (type) => {
    switch (type) {
      case ErrorTypes.FILE_SIZE:
      case ErrorTypes.FILE_TYPE:
        return 'bg-yellow-50 border-yellow-400 text-yellow-800'
      case ErrorTypes.NETWORK:
      case ErrorTypes.PERMISSION:
        return 'bg-red-50 border-red-400 text-red-800'
      case ErrorTypes.PROCESSING:
      case ErrorTypes.VALIDATION:
        return 'bg-orange-50 border-orange-400 text-orange-800'
      default:
        return 'bg-gray-50 border-gray-400 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className={`bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border-l-4 ${getErrorClass(error.type)}`}>
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3" role="img" aria-label="error icon">
            {getErrorIcon(error.type)}
          </span>
          <div className="font-semibold">
            {error.type === ErrorTypes.UNKNOWN ? 'Error' : error.type.replace('_', ' ')}
          </div>
        </div>
        <p className="mb-4">{error.message}</p>
        {error.details && (
          <p className="text-sm opacity-75 mb-4">{error.details}</p>
        )}
        {error.timestamp && (
          <p className="text-xs opacity-50 mb-4">
            {new Date(error.timestamp).toLocaleString()}
          </p>
        )}
        <button
          onClick={onClose}
          className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}