import { useState } from 'react'

import { Capacitor } from '@capacitor/core'
import { downloadFileOnMobile } from '../utils/mobileDownload'

const FormatConverter = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [targetFormat, setTargetFormat] = useState('image/jpeg')

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

  const handleConvert = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      const convertedImage = await createConvertedImage(selectedFile)
      setPreviewUrl(convertedImage.url)
      setNewSize(Math.round(convertedImage.size / 1024))
      setLoading(false)
    } catch (error) {
      console.error('Error converting image:', error)
      setLoading(false)
    }
  }

  const createConvertedImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          resolve({
            url: URL.createObjectURL(blob),
            size: blob.size
          })
        }, targetFormat)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const [error, setError] = useState(null)

  const handleDownload = async () => {
    if (!previewUrl) return
    setError(null)

    try {
      const { Capacitor } = await import('@capacitor/core')
      const { downloadFileOnMobile } = await import('../utils/mobileDownload')
      const { checkAndRequestPermissions } = await import('../utils/androidPermissions')

      if (Capacitor.getPlatform() === 'android') {
        const hasPermission = await checkAndRequestPermissions()
        if (!hasPermission) {
          setError('Storage permission is required to save images')
          return
        }

        try {
          const extension = targetFormat.split('/')[1]
          const fileName = `converted-${selectedFile.name.split('.')[0]}.${extension}`
          const savedUri = await downloadFileOnMobile(previewUrl, fileName)
          if (savedUri) {
            alert('Image saved successfully to: ' + savedUri)
          } else {
            throw new Error('Failed to get saved file URI')
          }
        } catch (error) {
          console.error('Error saving file:', error)
          setError(error.message || 'Error saving image. Please try again.')
        }
      } else {
        // Web browser download
        try {
          const response = await fetch(previewUrl)
          if (!response.ok) throw new Error('Failed to fetch image data')
          
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.style.display = 'none'
          link.href = url
          const extension = targetFormat.split('/')[1]
          link.download = `converted-${selectedFile.name.split('.')[0]}.${extension}`
          
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)
        } catch (downloadError) {
          console.error('Error during file download:', downloadError)
          setError('Failed to download the image. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error during download:', error)
      setError('Error downloading image. Please try again.')
    }
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Convert Format</h2>
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
          <div className="convert-section">
            <div className="format-selection">
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="format-select"
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
                <option value="image/gif">GIF</option>
              </select>
            </div>

            <button
              onClick={handleConvert}
              disabled={loading}
              className="action-button"
            >
              {loading ? 'Converting...' : 'Convert Image'}
            </button>

            {previewUrl && (
              <div className="preview-section">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <div className="size-info">
                  <p>Original size: {originalSize} KB</p>
                  {newSize && <p>New size: {newSize} KB</p>}
                </div>
                <div className="download-section">
                  <button onClick={handleDownload} className="download-button">
                    Download Converted Image
                  </button>
                  {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FormatConverter