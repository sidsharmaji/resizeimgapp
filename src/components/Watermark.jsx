import { useState } from 'react'

const Watermark = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [watermarkText, setWatermarkText] = useState('')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5)
  const [watermarkPosition, setWatermarkPosition] = useState('center')
  const [watermarkSize, setWatermarkSize] = useState(24)
  const [watermarkColor, setWatermarkColor] = useState('#ffffff')
  const [watermarkFont, setWatermarkFont] = useState('Arial')
  const [watermarkRotation, setWatermarkRotation] = useState(0)
  const [watermarkPattern, setWatermarkPattern] = useState('single')
  const [watermarkShadow, setWatermarkShadow] = useState(false)
  const [watermarkShadowColor, setWatermarkShadowColor] = useState('#000000')
  const [watermarkShadowBlur, setWatermarkShadowBlur] = useState(3)
  const [watermarkPresets, setWatermarkPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setOriginalSize(Math.round(file.size / 1024))
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleApplyWatermark = async () => {
    if (!selectedFile || !watermarkText) return

    try {
      setLoading(true)
      const watermarkedImage = await createWatermarkedImage(selectedFile)
      setPreviewUrl(watermarkedImage.url)
      setNewSize(Math.round(watermarkedImage.size / 1024))
      setLoading(false)
    } catch (error) {
      console.error('Error applying watermark:', error)
      setLoading(false)
    }
  }

  const createWatermarkedImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Apply watermark text
        ctx.globalAlpha = watermarkOpacity
        ctx.fillStyle = watermarkColor
        ctx.font = `${watermarkSize}px ${watermarkFont}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const text = watermarkText
        const textWidth = ctx.measureText(text).width
        let positions = []

        if (watermarkPattern === 'tiled') {
          const spacing = Math.max(textWidth, watermarkSize * 3)
          for (let i = spacing; i < canvas.width - spacing; i += spacing * 2) {
            for (let j = spacing; j < canvas.height - spacing; j += spacing * 2) {
              positions.push({ x: i, y: j })
            }
          }
        } else if (watermarkPattern === 'diagonal') {
          const spacing = Math.max(textWidth, watermarkSize * 3)
          let x = spacing
          let y = spacing
          while (x < canvas.width && y < canvas.height) {
            positions.push({ x, y })
            x += spacing
            y += spacing
          }
        } else {
          let x, y
          switch (watermarkPosition) {
            case 'top-left':
              x = textWidth / 2 + 20
              y = watermarkSize + 20
              break
            case 'top-right':
              x = canvas.width - textWidth / 2 - 20
              y = watermarkSize + 20
              break
            case 'bottom-left':
              x = textWidth / 2 + 20
              y = canvas.height - watermarkSize - 20
              break
            case 'bottom-right':
              x = canvas.width - textWidth / 2 - 20
              y = canvas.height - watermarkSize - 20
              break
            default: // center
              x = canvas.width / 2
              y = canvas.height / 2
          }
          positions.push({ x, y })
        }

        positions.forEach(({ x, y }) => {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(watermarkRotation * Math.PI / 180)

          if (watermarkShadow) {
            ctx.shadowColor = watermarkShadowColor
            ctx.shadowBlur = watermarkShadowBlur
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
          }

          ctx.fillText(text, 0, 0)
          ctx.restore()
        })

        canvas.toBlob((blob) => {
          resolve({
            url: URL.createObjectURL(blob),
            size: blob.size
          })
        }, 'image/jpeg', 1)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `watermarked-${selectedFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Add Watermark</h2>
      </div>
      
      <div className="tool-content">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>

        {selectedFile && (
          <div className="watermark-section">
            <div className="watermark-controls">
              <input
                type="text"
                placeholder="Watermark Text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="watermark-input"
              />
              <div className="watermark-options">
                <div className="option-group">
                  <label>Font:</label>
                  <select
                    value={watermarkFont}
                    onChange={(e) => setWatermarkFont(e.target.value)}
                    className="font-select"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                <div className="option-group">
                  <label>Opacity:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="opacity-slider"
                  />
                </div>
                <div className="option-group">
                  <label>Position:</label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value)}
                    className="position-select"
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
                <div className="option-group">
                  <label>Pattern:</label>
                  <select
                    value={watermarkPattern}
                    onChange={(e) => setWatermarkPattern(e.target.value)}
                    className="pattern-select"
                  >
                    <option value="single">Single</option>
                    <option value="tiled">Tiled</option>
                    <option value="diagonal">Diagonal</option>
                  </select>
                </div>
                <div className="option-group">
                  <label>Rotation (deg):</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={watermarkRotation}
                    onChange={(e) => setWatermarkRotation(Number(e.target.value))}
                    className="rotation-slider"
                  />
                </div>
                <div className="option-group">
                  <label>Size:</label>
                  <input
                    type="number"
                    min="12"
                    max="72"
                    value={watermarkSize}
                    onChange={(e) => setWatermarkSize(Number(e.target.value))}
                    className="size-input"
                  />
                </div>
                <div className="option-group">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={watermarkColor}
                    onChange={(e) => setWatermarkColor(e.target.value)}
                    className="color-picker"
                  />
                </div>
                <div className="option-group">
                  <label>Shadow:</label>
                  <input
                    type="checkbox"
                    checked={watermarkShadow}
                    onChange={(e) => setWatermarkShadow(e.target.checked)}
                    className="shadow-toggle"
                  />
                </div>
                {watermarkShadow && (
                  <>
                    <div className="option-group">
                      <label>Shadow Color:</label>
                      <input
                        type="color"
                        value={watermarkShadowColor}
                        onChange={(e) => setWatermarkShadowColor(e.target.value)}
                        className="shadow-color-picker"
                      />
                    </div>
                    <div className="option-group">
                      <label>Shadow Blur:</label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={watermarkShadowBlur}
                        onChange={(e) => setWatermarkShadowBlur(Number(e.target.value))}
                        className="shadow-blur-slider"
                      />
                    </div>
                  </>
                )}
                <div className="presets-section">
                  <button
                    onClick={() => {
                      const preset = {
                        text: watermarkText,
                        font: watermarkFont,
                        opacity: watermarkOpacity,
                        position: watermarkPosition,
                        pattern: watermarkPattern,
                        rotation: watermarkRotation,
                        size: watermarkSize,
                        color: watermarkColor,
                        shadow: watermarkShadow,
                        shadowColor: watermarkShadowColor,
                        shadowBlur: watermarkShadowBlur
                      }
                      setWatermarkPresets([...watermarkPresets, preset])
                    }}
                    className="save-preset-button"
                  >
                    Save as Preset
                  </button>
                  {watermarkPresets.length > 0 && (
                    <select
                      value={selectedPreset}
                      onChange={(e) => {
                        const preset = watermarkPresets[e.target.value]
                        setSelectedPreset(e.target.value)
                        setWatermarkText(preset.text)
                        setWatermarkFont(preset.font)
                        setWatermarkOpacity(preset.opacity)
                        setWatermarkPosition(preset.position)
                        setWatermarkPattern(preset.pattern)
                        setWatermarkRotation(preset.rotation)
                        setWatermarkSize(preset.size)
                        setWatermarkColor(preset.color)
                        setWatermarkShadow(preset.shadow)
                        setWatermarkShadowColor(preset.shadowColor)
                        setWatermarkShadowBlur(preset.shadowBlur)
                      }}
                      className="preset-select"
                    >
                      <option value="">Load Preset</option>
                      {watermarkPresets.map((_, index) => (
                        <option key={index} value={index}>
                          Preset {index + 1}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyWatermark}
              disabled={loading || !watermarkText}
              className="action-button"
            >
              {loading ? 'Processing...' : 'Apply Watermark'}
            </button>

            {previewUrl && (
              <div className="preview-section">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <div className="size-info">
                  <p>Original size: {originalSize} KB</p>
                  {newSize && <p>New size: {newSize} KB</p>}
                </div>
                <button onClick={handleDownload} className="download-button">
                  Download Watermarked Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Watermark