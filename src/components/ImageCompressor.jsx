import { useState } from 'react'
import imageCompression from 'browser-image-compression'

const ImageCompressor = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [compressionMode, setCompressionMode] = useState('dimensions')
  const [targetSize, setTargetSize] = useState('')
  const [targetSizeUnit, setTargetSizeUnit] = useState('KB')
  const [compressionProgress, setCompressionProgress] = useState(0)

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

  const bytesToKB = (bytes) => Math.round(bytes / 1024)
  const KBToBytes = (kb) => kb * 1024
  const MBToBytes = (mb) => mb * 1024 * 1024

  const compressToTargetSize = async (file, targetBytes) => {
    let min = 0.05 // Lower minimum quality for more compression range
    let max = 1.0
    let quality = 0.9 // Start with higher quality for better initial result
    let compressedFile = file
    let attempts = 0
    const maxAttempts = 50 // More attempts for better accuracy
    const tolerance = 0.02 // Tighter tolerance for more precise results
    const initialSize = file.size
    let bestFile = file
    let bestSizeDiff = Infinity

    // If target size is larger than original, return original
    if (targetBytes >= initialSize) {
      return file
    }

    while (attempts < maxAttempts) {
      const options = {
        maxSizeMB: Math.max(targetBytes / (1024 * 1024), 0.01),
        useWebWorker: true,
        initialQuality: quality,
        maxWidthOrHeight: 4096,
        fileType: 'image/jpeg',
        alwaysKeepResolution: true,
        exifOrientation: 1, // Preserve image orientation
        onProgress: (progress) => setCompressionProgress(progress * 100)
      }

      try {
        compressedFile = await imageCompression(file, options)
        const currentSize = compressedFile.size
        const targetRatio = currentSize / targetBytes

        // Normalize progress to stay between 1-100%
        const attemptProgress = Math.min((attempts / maxAttempts) * 50, 50) // 50% weight for attempts
        const compressionStepProgress = Math.min(progress * 50, 50) // 50% weight for compression
        setCompressionProgress(Math.min(Math.max(1, attemptProgress + compressionStepProgress), 100))

        const sizeDiff = Math.abs(currentSize - targetBytes)
        if (sizeDiff < bestSizeDiff) {
          bestSizeDiff = sizeDiff
          bestFile = compressedFile
        }

        if (Math.abs(1 - targetRatio) <= tolerance || Math.abs(max - min) < 0.001) {
          break
        }

        // Enhanced quality adjustment algorithm
        if (currentSize > targetBytes) {
          max = quality
          // More aggressive reduction when far from target
          const ratio = targetBytes / currentSize
          const step = (quality - min) * (1 - ratio) * 0.8
          quality = Math.max(min, quality - step)
        } else {
          min = quality
          // More conservative increase when close to target
          const ratio = currentSize / targetBytes
          const step = (max - quality) * (1 - ratio) * 0.5
          quality = Math.min(max, quality + step)
        }

        quality = Math.max(0.1, Math.min(1, quality)) // Ensure minimum quality of 0.1
      } catch (error) {
        console.error('Compression attempt failed:', error)
        // If compression fails, try with a lower quality
        quality = Math.max(0.01, quality - 0.1)
      }
      
      attempts++
    }

    // Return the file that got closest to target size
    return bestFile
  }

  const handleCompress = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setCompressionProgress(0)
      let processedFile

      if (compressionMode === 'dimensions') {
        const options = {
          maxSizeMB: 1,
          useWebWorker: true,
          initialQuality: 0.8,
          maxWidthOrHeight: 4096,
          onProgress: (progress) => setCompressionProgress(progress * 100)
        }
        processedFile = await imageCompression(selectedFile, options)
      } else {
        if (!targetSize) {
          throw new Error('Please enter a target size')
        }
        const targetBytes = targetSizeUnit === 'KB' 
          ? KBToBytes(Number(targetSize))
          : MBToBytes(Number(targetSize))
        processedFile = await compressToTargetSize(selectedFile, targetBytes)
      }

      setPreviewUrl(URL.createObjectURL(processedFile))
      setNewSize(bytesToKB(processedFile.size))
      setLoading(false)
    } catch (error) {
      console.error('Error compressing image:', error)
      alert(error.message || 'Error compressing image. Please try again.')
      setLoading(false)
      setCompressionProgress(0)
    }
  }

  const handleDownload = async () => {
    if (!previewUrl) return

    try {
      const { Capacitor } = await import('@capacitor/core')
      const { downloadFileOnMobile } = await import('../utils/mobileDownload')
      const { checkAndRequestPermissions } = await import('../utils/androidPermissions')

      if (Capacitor.getPlatform() === 'android') {
        const hasPermission = await checkAndRequestPermissions()
        if (!hasPermission) {
          alert('Storage permission is required to save images')
          return
        }

        try {
          const savedUri = await downloadFileOnMobile(previewUrl, `compressed-${selectedFile.name}`)
          if (savedUri) {
            alert('Image saved successfully to: ' + savedUri)
          } else {
            throw new Error('Failed to get saved file URI')
          }
        } catch (error) {
          console.error('Error saving file:', error)
          alert(error.message || 'Error saving image. Please try again.')
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
          link.download = `compressed-${selectedFile.name}`
          
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)
        } catch (downloadError) {
          console.error('Error during file download:', downloadError)
          alert('Failed to download the image. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error during download:', error)
      alert('Error downloading image. Please try again.')
    }
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Compress Image</h2>
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
          <div className="compress-section">
            <div className="compression-mode">
              <select 
                value={compressionMode}
                onChange={(e) => setCompressionMode(e.target.value)}
                className="mode-select"
              >
                <option value="dimensions">Quick Compression</option>
                <option value="size">Target Size Compression</option>
              </select>
            </div>

            {compressionMode === 'size' && (
              <div className="target-size">
                <input
                  type="number"
                  placeholder="Target Size"
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.value)}
                  className="size-input"
                />
                <select
                  value={targetSizeUnit}
                  onChange={(e) => setTargetSizeUnit(e.target.value)}
                  className="unit-select"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            )}

            <button
              onClick={handleCompress}
              disabled={loading}
              className="action-button"
            >
              {loading ? (
                <span className="loading-text">
                  Processing... {compressionProgress > 0 && `${Math.round(compressionProgress)}%`}
                </span>
              ) : (
                'Compress Image'
              )}
            </button>

            {previewUrl && (
              <div className="preview-section">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <div className="size-info">
                  <p>Original size: {originalSize} KB</p>
                  {newSize && <p>New size: {newSize} KB</p>}
                </div>
                <button onClick={handleDownload} className="download-button">
                  Download Compressed Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageCompressor