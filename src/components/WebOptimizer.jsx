import { useState } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import ImageComparison from './ImageComparison'

const WebOptimizer = ({ onBack }) => {
  const { addToHistory, getTooltip } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalUrl, setOriginalUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    format: 'webp',
    quality: 80,
    maxWidth: 1920,
    lazyLoad: true,
    responsive: true
  })

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setOriginalSize(Math.round(file.size / 1024))
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
        setOriginalUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const optimizeImage = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)

      const img = new Image()
      img.src = originalUrl
      await new Promise((resolve) => (img.onload = resolve))

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width
      let height = img.height
      if (width > settings.maxWidth) {
        height = (settings.maxWidth / width) * height
        width = settings.maxWidth
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to the selected format with specified quality
      const optimizedImageUrl = canvas.toDataURL(`image/${settings.format}`, settings.quality / 100)
      const response = await fetch(optimizedImageUrl)
      const blob = await response.blob()
      const optimizedSize = Math.round(blob.size / 1024)

      setPreviewUrl(optimizedImageUrl)
      setNewSize(optimizedSize)

      // Generate responsive HTML code
      const responsiveCode = settings.responsive ? 
        `<img src="${optimizedImageUrl}"
          ${settings.lazyLoad ? 'loading="lazy"' : ''}
          srcset="${optimizedImageUrl} ${width}w"
          sizes="(max-width: ${width}px) 100vw, ${width}px"
          alt="Optimized image"
        />` : ''

      addToHistory({
        type: 'Web Optimization',
        details: `Format: ${settings.format.toUpperCase()}, Quality: ${settings.quality}%, Size: ${width}x${height}`,
        originalUrl: originalUrl,
        resultUrl: optimizedImageUrl,
        metadata: { responsiveCode }
      })

      setLoading(false)
    } catch (error) {
      console.error('Error optimizing image:', error)
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `optimized-${selectedFile.name.split('.')[0]}.${settings.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>Web Optimizer</h2>
      </div>
      
      <div className="tool-content">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
            title={getTooltip('upload')}
          />
        </div>

        {selectedFile && (
          <div className="optimize-section">
            <div className="settings-panel">
              <div className="setting-group">
                <label>Format:</label>
                <select
                  value={settings.format}
                  onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                >
                  <option value="webp">WebP</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Quality: {settings.quality}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
                />
              </div>

              <div className="setting-group">
                <label>Max Width:</label>
                <input
                  type="number"
                  value={settings.maxWidth}
                  onChange={(e) => setSettings({ ...settings, maxWidth: parseInt(e.target.value) })}
                  min="100"
                  max="4096"
                />
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.lazyLoad}
                    onChange={(e) => setSettings({ ...settings, lazyLoad: e.target.checked })}
                  />
                  Enable Lazy Loading
                </label>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.responsive}
                    onChange={(e) => setSettings({ ...settings, responsive: e.target.checked })}
                  />
                  Generate Responsive Code
                </label>
              </div>
            </div>

            <button
              onClick={optimizeImage}
              disabled={loading}
              className="action-button"
              title={getTooltip('apply')}
            >
              {loading ? 'Processing...' : 'Optimize for Web'}
            </button>

            {previewUrl && previewUrl !== originalUrl && (
              <div className="preview-section">
                <ImageComparison
                  originalImage={originalUrl}
                  processedImage={previewUrl}
                />
                <div className="size-info">
                  <p>Original size: {originalSize} KB</p>
                  {newSize && <p>New size: {newSize} KB</p>}
                </div>
                <button 
                  onClick={handleDownload} 
                  className="download-button"
                  title={getTooltip('download')}
                >
                  Download Optimized Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WebOptimizer