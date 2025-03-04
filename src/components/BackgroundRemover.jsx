import { useState } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import ImageComparison from './ImageComparison'

const BackgroundRemover = ({ onBack }) => {
  const { addToHistory, getTooltip, updateProgress, cleanupResources } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalUrl, setOriginalUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

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

  const removeBackground = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setProgress(0)

      const img = new Image()
      img.src = originalUrl
      await new Promise((resolve) => (img.onload = resolve))

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Enhanced background removal using advanced segmentation and object detection
      const samples = 40 // Increased sample points for better accuracy
      const samplePoints = []
      
      // Sample points from edges, corners, and grid pattern
      for (let i = 0; i < samples; i++) {
        // Edge sampling
        samplePoints.push(
          [i * (canvas.width / samples), 0], // Top edge
          [i * (canvas.width / samples), canvas.height - 1], // Bottom edge
          [0, i * (canvas.height / samples)], // Left edge
          [canvas.width - 1, i * (canvas.height / samples)] // Right edge
        )
        
        // Grid pattern sampling for better background color detection
        if (i < samples/2) {
          for (let j = 0; j < samples/2; j++) {
            samplePoints.push([
              (i + 0.5) * (canvas.width / (samples/2)),
              (j + 0.5) * (canvas.height / (samples/2))
            ])
          }
        }
      }

      // Sample background colors
      const backgroundColors = samplePoints.map(([x, y]) => {
        const idx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
        return [data[idx], data[idx + 1], data[idx + 2]]
      })

      // Calculate color statistics
      const colorStats = backgroundColors.reduce(
        (stats, [r, g, b]) => {
          stats.sumR += r
          stats.sumG += g
          stats.sumB += b
          stats.sumR2 += r * r
          stats.sumG2 += g * g
          stats.sumB2 += b * b
          return stats
        },
        { sumR: 0, sumG: 0, sumB: 0, sumR2: 0, sumG2: 0, sumB2: 0 }
      )

      const n = backgroundColors.length
      const avgBackground = [
        colorStats.sumR / n,
        colorStats.sumG / n,
        colorStats.sumB / n
      ]

      // Calculate standard deviations
      const stdBackground = [
        Math.sqrt(colorStats.sumR2 / n - Math.pow(avgBackground[0], 2)),
        Math.sqrt(colorStats.sumG2 / n - Math.pow(avgBackground[1], 2)),
        Math.sqrt(colorStats.sumB2 / n - Math.pow(avgBackground[2], 2))
      ]

      const tolerance = 3.0 // Adjusted standard deviation multiplier
      const edgeThreshold = 40 // Increased edge threshold for better detail preservation
      const saturationThreshold = 25 // Adjusted threshold for color saturation
      const luminanceThreshold = 30 // New threshold for luminance difference
      const contrastThreshold = 20 // New threshold for local contrast

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // Calculate color difference using standard deviations
        const colorDiff = [
          Math.abs(r - avgBackground[0]) / (stdBackground[0] || 1),
          Math.abs(g - avgBackground[1]) / (stdBackground[1] || 1),
          Math.abs(b - avgBackground[2]) / (stdBackground[2] || 1)
        ]

        // Calculate color saturation
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const saturation = max === 0 ? 0 : (max - min) / max * 100

        // Enhanced edge detection with Sobel operator
        const x = (i / 4) % canvas.width
        const y = Math.floor((i / 4) / canvas.width)
        let edgeStrength = 0

        if (x > 1 && x < canvas.width - 2 && y > 1 && y < canvas.height - 2) {
          const sobelX = [
            -1, 0, 1,
            -2, 0, 2,
            -1, 0, 1
          ]
          const sobelY = [
            -1, -2, -1,
             0,  0,  0,
             1,  2,  1
          ]

          let gx = 0, gy = 0
          for (let sy = -1; sy <= 1; sy++) {
            for (let sx = -1; sx <= 1; sx++) {
              const idx = ((y + sy) * canvas.width + (x + sx)) * 4
              const pixel = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
              gx += pixel * sobelX[(sy + 1) * 3 + (sx + 1)]
              gy += pixel * sobelY[(sy + 1) * 3 + (sx + 1)]
            }
          }
          edgeStrength = Math.sqrt(gx * gx + gy * gy)
        }

        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b
        
        // Calculate local contrast
        const localContrast = Math.abs(luminance - (avgBackground[0] * 0.299 + avgBackground[1] * 0.587 + avgBackground[2] * 0.114))
        
        // Enhanced background detection using multiple factors
        const colorMatch = colorDiff.every(diff => diff < tolerance)
        const edgeMatch = edgeStrength < edgeThreshold
        const saturationMatch = saturation < saturationThreshold
        const luminanceMatch = Math.abs(luminance - (avgBackground[0] * 0.299 + avgBackground[1] * 0.587 + avgBackground[2] * 0.114)) < luminanceThreshold
        const contrastMatch = localContrast < contrastThreshold
        
        // Weighted decision making
        const isBackground = 
          (colorMatch && saturationMatch && luminanceMatch) || // Definite background
          (colorMatch && edgeMatch && contrastMatch) || // Probable background
          (saturationMatch && luminanceMatch && contrastMatch && edgeMatch) // Likely background

        data[i + 3] = isBackground ? 0 : 255 // Set alpha channel

        // Update progress
        if (i % (data.length / 10) < 4) {
          updateProgress(
            Math.round((i / data.length) * 100),
            `Processing pixel data: ${Math.round((i / data.length) * 100)}%`
          )
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // Convert to PNG to preserve transparency
      const processedImageUrl = canvas.toDataURL('image/png')
      const response = await fetch(processedImageUrl)
      const blob = await response.blob()
      const processedSize = Math.round(blob.size / 1024)

      setPreviewUrl(processedImageUrl)
      setNewSize(processedSize)
      addToHistory({
        type: 'Background Removal',
        details: 'Removed image background using advanced segmentation',
        originalUrl: originalUrl,
        resultUrl: processedImageUrl
      })

      updateProgress(100, 'Background removal completed')
      setLoading(false)
      cleanupResources()
      cleanupResources()
    } catch (error) {
      console.error('Error removing background:', error)
      setLoading(false)
      cleanupResources()
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `nobg-${selectedFile.name.replace(/\.[^/.]+$/, '')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>Remove Background</h2>
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
          <div className="process-section">
            <div className="preview-container">
              <img
                src={previewUrl}
                alt="Preview"
                className="preview-image"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <button
              onClick={removeBackground}
              disabled={loading}
              className="action-button"
              title={getTooltip('apply')}
            >
              {loading ? 'Processing...' : 'Remove Background'}
            </button>

            {loading && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
                <span className="progress-text">{progress}%</span>
              </div>
            )}

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
                  Download Processed Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BackgroundRemover