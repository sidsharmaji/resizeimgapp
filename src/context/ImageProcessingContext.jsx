import { createContext, useContext, useState, useCallback } from 'react'

const ImageProcessingContext = createContext()

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

  const value = {
    history,
    currentOperation: history[currentIndex],
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getTooltip
  }

  return (
    <ImageProcessingContext.Provider value={value}>
      {children}
    </ImageProcessingContext.Provider>
  )
}