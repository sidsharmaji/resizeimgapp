import { useState } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import QRCode from 'qrcode'

const QRGenerator = ({ onBack }) => {
  const { addToHistory, getTooltip } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 8,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateQR = async (data) => {
    try {
      setLoading(true)

      // Use the actual image data URL
      const imageUrl = previewUrl

      const qrCodeUrl = await QRCode.toDataURL(imageUrl, {
        errorCorrectionLevel: settings.errorCorrectionLevel,
        margin: settings.margin,
        scale: settings.scale,
        color: settings.color
      })

      setQrUrl(qrCodeUrl)
      addToHistory({
        type: 'QR Generation',
        details: `Generated QR code with ${settings.errorCorrectionLevel} error correction`,
        originalUrl: imageUrl,
        resultUrl: qrCodeUrl
      })

      setLoading(false)
    } catch (error) {
      console.error('Error generating QR code:', error)
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrUrl) return

    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${selectedFile.name.split('.')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>QR Code Generator</h2>
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
          <div className="qr-section">
            <div className="settings-panel">
              <div className="setting-group">
                <label>Error Correction:</label>
                <select
                  value={settings.errorCorrectionLevel}
                  onChange={(e) => setSettings({ ...settings, errorCorrectionLevel: e.target.value })}
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Margin: {settings.margin}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.margin}
                  onChange={(e) => setSettings({ ...settings, margin: parseInt(e.target.value) })}
                />
              </div>

              <div className="setting-group">
                <label>Scale: {settings.scale}</label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={settings.scale}
                  onChange={(e) => setSettings({ ...settings, scale: parseInt(e.target.value) })}
                />
              </div>

              <div className="setting-group">
                <label>QR Color:</label>
                <input
                  type="color"
                  value={settings.color.dark}
                  onChange={(e) => setSettings({
                    ...settings,
                    color: { ...settings.color, dark: e.target.value }
                  })}
                />
              </div>

              <div className="setting-group">
                <label>Background:</label>
                <input
                  type="color"
                  value={settings.color.light}
                  onChange={(e) => setSettings({
                    ...settings,
                    color: { ...settings.color, light: e.target.value }
                  })}
                />
              </div>

              <button 
                onClick={() => previewUrl && generateQR(previewUrl)} 
                className="generate-button"
                disabled={!previewUrl || loading}
                title={getTooltip('generate')}
              >
                {loading ? 'Generating...' : 'Generate QR Code'}
              </button>
            </div>

            <div className="preview-container">
              {loading ? (
                <div className="loading-message">Generating QR code...</div>
              ) : qrUrl && (
                <div className="qr-preview">
                  <img
                    src={qrUrl}
                    alt="Generated QR code"
                    className="qr-image"
                  />
                  <button 
                    onClick={handleDownload} 
                    className="download-button"
                    title={getTooltip('download')}
                  >
                    Download QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRGenerator