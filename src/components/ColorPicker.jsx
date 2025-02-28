import { useState, useRef } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'

const ColorPicker = ({ onBack }) => {
  const { addToHistory, getTooltip } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
        extractColors(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const extractColors = async (imageUrl) => {
    try {
      setLoading(true)
      const img = new Image()
      img.src = imageUrl
      await new Promise((resolve) => (img.onload = resolve))

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const colorMap = new Map()

      // Sample pixels and count color occurrences
      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i]
        const g = imageData[i + 1]
        const b = imageData[i + 2]
        const rgb = `rgb(${r},${g},${b})`
        colorMap.set(rgb, (colorMap.get(rgb) || 0) + 1)
      }

      // Convert to array and sort by frequency
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([color]) => ({
          value: color,
          hex: rgbToHex(color),
          name: getColorName(color)
        }))

      setColors(sortedColors)
      addToHistory({
        type: 'Color Extraction',
        details: `Extracted ${sortedColors.length} dominant colors`,
        originalUrl: imageUrl,
        metadata: { colors: sortedColors }
      })

      setLoading(false)
    } catch (error) {
      console.error('Error extracting colors:', error)
      setLoading(false)
    }
  }

  const rgbToHex = (rgb) => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    if (!match) return ''

    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])

    const toHex = (n) => {
      const hex = n.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const getColorName = (rgb) => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    if (!match) return ''

    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])

    // Simple color naming logic
    const brightness = (r + g + b) / 3
    const saturation = Math.max(r, g, b) - Math.min(r, g, b)

    if (saturation < 30) {
      if (brightness < 50) return 'Black'
      if (brightness > 200) return 'White'
      return 'Gray'
    }

    const hue = Math.max(r, g, b)
    if (hue === r) return 'Red'
    if (hue === g) return 'Green'
    return 'Blue'
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show a temporary tooltip or notification
        const tooltip = document.createElement('div')
        tooltip.className = 'copy-tooltip'
        tooltip.textContent = 'Copied!'
        document.body.appendChild(tooltip)
        setTimeout(() => document.body.removeChild(tooltip), 2000)
      })
      .catch(err => console.error('Failed to copy:', err))
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>Color Picker</h2>
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
          <div className="color-picker-section">
            <div className="preview-container">
              <img
                src={previewUrl}
                alt="Color preview"
                className="preview-image"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            {loading ? (
              <div className="loading-message">Extracting colors...</div>
            ) : (
              <div className="color-palette">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className="color-item"
                    onClick={() => copyToClipboard(color.hex)}
                    title="Click to copy HEX code"
                  >
                    <div
                      className="color-preview"
                      style={{ backgroundColor: color.value }}
                    ></div>
                    <div className="color-info">
                      <span className="color-name">{color.name}</span>
                      <span className="color-hex">{color.hex}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ColorPicker