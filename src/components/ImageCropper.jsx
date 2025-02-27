import { useState, useRef, useEffect } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useImageProcessing } from '../context/ImageProcessingContext'
import ImageComparison from './ImageComparison'
import { setupPinchZoom, setupDoubleTap, setupPan, cleanupGestures } from '../utils/touchGestures'

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
    y: 25,
    aspect: 16 / 9
  })
  const [completedCrop, setCompletedCrop] = useState(null)
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const hammerRef = useRef(null)

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

  const onImageLoad = (e) => {
    imgRef.current = e.target

    if (containerRef.current) {
      // Setup pinch zoom
      const pinchHammer = setupPinchZoom(containerRef.current, (scale) => {
        setCrop(prev => ({
          ...prev,
          width: Math.min(100, prev.width * scale),
          height: Math.min(100, prev.height * scale)
        }))
      })

      // Setup double tap to reset
      const doubleTapHammer = setupDoubleTap(containerRef.current, () => {
        setCrop({
          unit: '%',
          width: 50,
          height: 50,
          x: 25,
          y: 25,
          aspect: 16 / 9
        })
      })

      // Setup pan gesture
      const panHammer = setupPan(containerRef.current,
        (e) => {
          setCrop(prev => ({
            ...prev,
            x: Math.min(100 - prev.width, Math.max(0, prev.x + e.deltaX / imgRef.current.width * 100)),
            y: Math.min(100 - prev.height, Math.max(0, prev.y + e.deltaY / imgRef.current.height * 100))
          }))
        }
      )

      hammerRef.current = [pinchHammer, doubleTapHammer, panHammer]
    }
  }

  const handleCrop = async () => {
    if (!imgRef.current || !completedCrop) return

    try {
      setLoading(true)
      const croppedImage = await createCroppedImage(imgRef.current, completedCrop)
      setPreviewUrl(croppedImage.url)
      setNewSize(Math.round(croppedImage.size / 1024))
      addToHistory({
        type: 'Crop',
        details: `Cropped to ${completedCrop.width}x${completedCrop.height}`,
        originalUrl: originalUrl,
        resultUrl: croppedImage.url
      })
      setLoading(false)
    } catch (error) {
      console.error('Error cropping image:', error)
      setLoading(false)
    }
  }

  const createCroppedImage = (image, crop) => {
    return new Promise((resolve) => {
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

      canvas.toBlob((blob) => {
        resolve({
          url: URL.createObjectURL(blob),
          size: blob.size
        })
      }, 'image/jpeg', 1)
    })
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

  useEffect(() => {
    return () => {
      if (hammerRef.current) {
        hammerRef.current.forEach(hammer => cleanupGestures(hammer))
      }
    }
  }, [])

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
            <div className="crop-controls">
              <select
                value={crop.aspect}
                onChange={(e) => setCrop({ ...crop, aspect: Number(e.target.value) })}
                className="aspect-select"
                title={getTooltip('aspect')}
              >
                <option value={16/9}>16:9</option>
                <option value={4/3}>4:3</option>
                <option value={1}>1:1</option>
                <option value={null}>Free</option>
              </select>
            </div>

            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={crop.aspect}
            >
              <img
                src={previewUrl}
                onLoad={onImageLoad}
                alt="Crop preview"
                className="crop-image"
              />
            </ReactCrop>

            <button
              onClick={handleCrop}
              disabled={loading || !completedCrop}
              className="action-button"
              title={getTooltip('crop')}
            >
              {loading ? 'Processing...' : 'Crop Image'}
            </button>

            {completedCrop && previewUrl && (
              <ImageComparison
                originalImage={originalUrl}
                processedImage={previewUrl}
              />
            )}

            <div className="preview-section">
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
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageCropper