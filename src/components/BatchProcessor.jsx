import { useState, useRef } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'

const BatchProcessor = ({ onBack }) => {
  const { addToHistory } = useImageProcessing()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100
  })
  const [metadata, setMetadata] = useState([])
  const canvasRef = useRef(null)

  const handleFilesSelect = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(files)
    
    // Generate previews and extract metadata
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: Math.round(file.size / 1024),
      type: file.type
    }))
    
    setPreviewUrls(previews)
    extractMetadata(files)
  }

  const extractMetadata = async (files) => {
    const metadataList = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            resolve({
              name: file.name,
              dimensions: `${img.width}x${img.height}`,
              type: file.type,
              lastModified: new Date(file.lastModified).toLocaleString()
            })
          }
          img.src = e.target.result
        }
        reader.readAsDataURL(file)
      })
    }))
    setMetadata(metadataList)
  }

  const applyFilters = async () => {
    if (!selectedFiles.length) return

    setLoading(true)
    const totalFiles = selectedFiles.length
    let processedCount = 0

    const processedImages = await Promise.all(selectedFiles.map(async (file, index) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      return new Promise((resolve) => {
        img.onload = () => {
          // Preserve original dimensions
          canvas.width = img.width
          canvas.height = img.height
          
          // Apply filters with enhanced quality
          ctx.filter = `
            brightness(${filters.brightness}%) 
            contrast(${filters.contrast}%) 
            saturate(${filters.saturation}%)
          `
          
          // Use high-quality image rendering
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // Draw image with proper scaling
          ctx.drawImage(img, 0, 0, img.width, img.height)
          
          // Convert to blob with optimal quality
          canvas.toBlob((blob) => {
            processedCount++
            const progress = Math.round((processedCount / totalFiles) * 100)
            setProgress(progress)
          
            resolve({
              url: URL.createObjectURL(blob),
              name: file.name,
              size: Math.round(blob.size / 1024),
              dimensions: `${img.width}x${img.height}`
            })
          }, 'image/jpeg', 0.92) // Increased quality setting
        }
      
        img.src = previewUrls[index].url
      })
    }))
  
    // Update preview URLs with enhanced metadata
    setPreviewUrls(processedImages)
    
    // Add detailed processing history
    addToHistory({
      type: 'Batch Process',
      details: `Applied filters: Brightness: ${filters.brightness}%, Contrast: ${filters.contrast}%, Saturation: ${filters.saturation}%`,
      files: processedImages.length,
      totalSize: processedImages.reduce((acc, img) => acc + img.size, 0),
      dimensions: processedImages.map(img => img.dimensions)
    })
  
    setLoading(false)
  }

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }))
  }

  const handleDownload = async () => {
    previewUrls.forEach(image => {
      const link = document.createElement('a')
      link.href = image.url
      link.download = `processed-${image.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Batch Image Processor</h2>
      </div>
      
      <div className="tool-content">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelect}
            className="file-input"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="batch-process-section">
            <div className="filters-panel">
              <h3>Image Filters</h3>
              <div className="filter-controls">
                <div className="filter-control">
                  <label>Brightness</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.brightness}
                    onChange={(e) => handleFilterChange('brightness', e.target.value)}
                  />
                  <span>{filters.brightness}%</span>
                </div>
                <div className="filter-control">
                  <label>Contrast</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.contrast}
                    onChange={(e) => handleFilterChange('contrast', e.target.value)}
                  />
                  <span>{filters.contrast}%</span>
                </div>
                <div className="filter-control">
                  <label>Saturation</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.saturation}
                    onChange={(e) => handleFilterChange('saturation', e.target.value)}
                  />
                  <span>{filters.saturation}%</span>
                </div>
              </div>
              <button
                onClick={applyFilters}
                disabled={loading}
                className="action-button"
              >
                {loading ? 'Processing...' : 'Apply Filters'}
              </button>
            </div>

            <div className="metadata-panel">
              <h3>Image Metadata</h3>
              <div className="metadata-list">
                {metadata.map((item, index) => (
                  <div key={index} className="metadata-item">
                    <h4>{item.name}</h4>
                    <p>Dimensions: {item.dimensions}</p>
                    <p>Type: {item.type}</p>
                    <p>Last Modified: {item.lastModified}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-grid">
              {previewUrls.map((image, index) => (
                <div key={index} className="preview-item">
                  <img src={image.url} alt={`Preview ${index + 1}`} />
                  <div className="preview-info">
                    <p>{image.name}</p>
                    <p>{image.size} KB</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownload}
              className="download-button"
              disabled={loading}
            >
              Download All Processed Images
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchProcessor