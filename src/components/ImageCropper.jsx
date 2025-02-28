import { useState, useRef } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import ImageComparison from './ImageComparison'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const ImageCropper = ({ onBack }) => {
  const { addToHistory, getTooltip } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalUrl, setOriginalUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [crop, setCrop] = useState({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  })
  const [completedCrop, setCompletedCrop] = useState(null)
  const imageRef = useRef(null)

  const aspectRatios = [
    { name: 'Free', value: null },
    { name: 'Square', value: 1 },
    { name: '16:9', value: 16/9 },
    { name: '4:3', value: 4/3 },
    { name: '3:2', value: 3/2 },
    { name: 'Portrait', value: 3/4 },
    { name: 'Instagram', value: 1 },
    { name: 'Facebook Cover', value: 2.7 }
  ]

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

  const handleAspectRatioChange = (ratio) => {
    if (ratio) {
      const width = 50
      const height = width / ratio
      setCrop({
        unit: '%',
        width,
        height,
        x: (100 - width) / 2,
        y: (100 - height) / 2
      })
    } else {
      setCrop({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25
      })
    }
  }

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          url: URL.createObjectURL(blob),
          size: blob.size
        })
      }, 'image/jpeg', 1)
    })
  }

  const handleCrop = async () => {
    if (!completedCrop || !imageRef.current) return

    try {
      setLoading(true)
      const croppedImage = await getCroppedImg(
        imageRef.current,
        completedCrop
      )
      setPreviewUrl(croppedImage.url)
      setNewSize(Math.round(croppedImage.size / 1024))
      addToHistory({
        type: 'Crop',
        details: `Cropped to ${completedCrop.width.toFixed(0)}x${completedCrop.height.toFixed(0)}`,
        originalUrl: originalUrl,
        resultUrl: croppedImage.url
      })
      setLoading(false)
    } catch (error) {
      console.error('Error cropping image:', error)
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `cropped-${selectedFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>Crop Image</h2>
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
          <div className="crop-section">
            <div className="aspect-ratio-controls">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.name}
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className="aspect-ratio-button"
                  title={`Set to ${ratio.name} aspect ratio`}
                >
                  {ratio.name}
                </button>
              ))}
            </div>

            <div className="crop-container">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={crop.width / crop.height}
              >
                <img
                  ref={imageRef}
                  src={originalUrl}
                  alt="Crop preview"
                  style={{ maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            <button
              onClick={handleCrop}
              disabled={loading || !completedCrop?.width}
              className="action-button"
              title={getTooltip('apply')}
            >
              {loading ? 'Processing...' : 'Apply Crop'}
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
                  Download Cropped Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageCropper