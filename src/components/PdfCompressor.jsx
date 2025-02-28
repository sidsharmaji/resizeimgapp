import { useState } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import { PDFDocument } from 'pdf-lib'

const PdfCompressor = ({ onBack }) => {
  const { addToHistory } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [compressionLevel, setCompressionLevel] = useState('medium')
  const [targetSize, setTargetSize] = useState('')
  const [targetSizeUnit, setTargetSizeUnit] = useState('MB')
  const [activeTab, setActiveTab] = useState('quality')
  const [compressionProgress, setCompressionProgress] = useState(0)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setOriginalSize(Math.round(file.size / 1024))
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      alert('Please select a PDF file')
    }
  }

  const getCompressionQuality = () => {
    switch (compressionLevel) {
      case 'low':
        return 0.8
      case 'medium':
        return 0.6
      case 'high':
        return 0.4
      default:
        return 0.6
    }
  }

  const compressPdf = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file')
      return
    }

    if (activeTab === 'target-size' && (!targetSize || targetSize <= 0)) {
      alert('Please enter a valid target size greater than 0')
      return
    }

    try {
      setLoading(true)
      setCompressionProgress(0)

      const fileData = await selectedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(fileData)
      const pages = pdfDoc.getPages()
      const totalPages = pages.length

      // Calculate target size in bytes
      const targetBytes = activeTab === 'target-size' ?
        (targetSizeUnit === 'MB' ? targetSize * 1024 * 1024 : targetSize * 1024) :
        null

      // Optimize compression settings
      const compressionSettings = {
        quality: activeTab === 'quality' ? getCompressionQuality() : 0.6,
        preserveDetails: true,
        optimizeImages: true,
        imageQuality: 'medium',
        colorSpace: 'rgb'
      }

      // Process each page
      for (let i = 0; i < totalPages; i++) {
        const page = pages[i]
        const images = await page.getImages()

        for (const image of images) {
          const imageBytes = await image.fetch()
          const embeddedImage = await pdfDoc.embedJpg(imageBytes)

          // Apply optimized compression
          if (activeTab === 'target-size') {
            const currentSize = (await pdfDoc.save()).length
            const targetRatio = targetBytes / currentSize
            const scaleFactor = Math.min(1, Math.max(0.1, targetRatio))
            await embeddedImage.scale(scaleFactor)
          } else {
            await embeddedImage.scale(compressionSettings.quality)
          }
        }

        setCompressionProgress(Math.round(((i + 1) / totalPages) * 100))
      }

      // Save with optimized settings
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        preservePDFForm: true,
        updateMetadata: true
      })

      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' })
      const newUrl = URL.createObjectURL(blob)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(newUrl)
      setNewSize(Math.round(blob.size / 1024))

      // Add to history
      addToHistory({
        type: 'PDF Compression',
        details: `Compressed PDF using ${activeTab === 'quality' ? compressionLevel : 'target size'} mode`,
        originalSize: originalSize,
        newSize: Math.round(blob.size / 1024)
      })

      setLoading(false)
    } catch (error) {
      console.error('Error compressing PDF:', error)
      alert('Error compressing PDF. Please try again.')
      setLoading(false)
      setCompressionProgress(0)
    }
  }

  const handleDownload = async () => {
    if (!previewUrl) return

    try {
      const response = await fetch(previewUrl)
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
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Compress PDF</h2>
      </div>
      
      <div className="tool-content">
        <div className="upload-section">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>

        {selectedFile && (
          <div className="compress-section">
            <div className="compress-tabs">
              <button
                className={`tab-button ${activeTab === 'quality' ? 'active' : ''}`}
                onClick={() => setActiveTab('quality')}
              >
                Quality-based Compression
              </button>
              <button
                className={`tab-button ${activeTab === 'target-size' ? 'active' : ''}`}
                onClick={() => setActiveTab('target-size')}
              >
                Target Size Compression
              </button>
            </div>

            {activeTab === 'quality' && (
              <div className="tab-content">
                <select
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(e.target.value)}
                  className="compression-select"
                >
                  <option value="low">Low Compression</option>
                  <option value="medium">Medium Compression</option>
                  <option value="high">High Compression</option>
                </select>
              </div>
            )}

            {activeTab === 'target-size' && (
              <div className="tab-content">
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
                    <option value="MB">MB</option>
                    <option value="KB">KB</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={compressPdf}
              disabled={loading}
              className="action-button"
            >
              {loading ? (
                <span className="loading-text">
                  Compressing... {compressionProgress}%
                </span>
              ) : (
                'Compress PDF'
              )}
            </button>

            {newSize && (
              <div className="result-section">
                <div className="size-info">
                  <p>Original size: {originalSize} KB</p>
                  <p>New size: {newSize} KB</p>
                  <p>Reduction: {Math.round(((originalSize - newSize) / originalSize) * 100)}%</p>
                </div>
                <button onClick={handleDownload} className="download-button">
                  Download Compressed PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PdfCompressor