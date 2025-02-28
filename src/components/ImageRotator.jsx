import { useState, useRef, useEffect } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import ImageComparison from './ImageComparison'
import { setupSwipe, setupPan, cleanupGestures } from '../utils/touchGestures'

const ImageRotator = ({ onBack }) => {
  const { addToHistory, getTooltip } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalUrl, setOriginalUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(null)
  const [newSize, setNewSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
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

  const [animationClass, setAnimationClass] = useState('')
  const [touchFeedback, setTouchFeedback] = useState(false)

  const handleRotate = (degrees) => {
    setAnimationClass('rotate-animation')
    setRotation((prev) => (prev + degrees) % 360)
    setTimeout(() => setAnimationClass(''), 300)
  }

  const handleFlipHorizontal = () => {
    setAnimationClass('flip-h-animation')
    setFlipH((prev) => !prev)
    setTimeout(() => setAnimationClass(''), 300)
  }

  const handleFlipVertical = () => {
    setAnimationClass('flip-v-animation')
    setFlipV((prev) => !prev)
    setTimeout(() => setAnimationClass(''), 300)
  }

  const handleTouchStart = () => {
    setTouchFeedback(true)
  }

  const handleTouchEnd = () => {
    setTouchFeedback(false)
  }

  const handleApplyTransforms = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      const transformedImage = await createTransformedImage(selectedFile)
      setPreviewUrl(transformedImage.url)
      setNewSize(Math.round(transformedImage.size / 1024))
      addToHistory({
        type: 'Transform',
        details: `Rotation: ${rotation}°, Flip H: ${flipH}, Flip V: ${flipV}`,
        originalUrl: originalUrl,
        resultUrl: transformedImage.url
      })
      setLoading(false)
    } catch (error) {
      console.error('Error transforming image:', error)
      setLoading(false)
    }
  }

  const createTransformedImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const rotationRad = (rotation * Math.PI) / 180
        const isRotated90or270 = rotation % 180 !== 0

        canvas.width = isRotated90or270 ? img.height : img.width
        canvas.height = isRotated90or270 ? img.width : img.height

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(rotationRad)
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)

        ctx.drawImage(
          img,
          -img.width / 2,
          -img.height / 2,
          img.width,
          img.height
        )

        ctx.restore()

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
    link.download = `rotated-${selectedFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (containerRef.current && previewUrl) {
      // Setup swipe for rotation
      const swipeHammer = setupSwipe(
        containerRef.current,
        () => handleRotate(90),  // swipe left to rotate clockwise
        () => handleRotate(-90)  // swipe right to rotate counter-clockwise
      )

      // Setup pan for flipping
      const panHammer = setupPan(
        containerRef.current,
        (e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            if (Math.abs(e.deltaX) > 50) {
              handleFlipHorizontal()
            }
          } else {
            if (Math.abs(e.deltaY) > 50) {
              handleFlipVertical()
            }
          }
        }
      )

      hammerRef.current = [swipeHammer, panHammer]
    }

    return () => {
      if (hammerRef.current) {
        hammerRef.current.forEach(hammer => cleanupGestures(hammer))
      }
    }
  }, [previewUrl])

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>Rotate Image</h2>
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
          <div className="rotate-section">
            <div className="transform-controls">
              <button
                onClick={() => handleRotate(-90)}
                className="rotate-button"
                title={getTooltip('rotate')}
              >
                ↶ Rotate Left
              </button>
              <button
                onClick={() => handleRotate(90)}
                className="rotate-button"
                title={getTooltip('rotate')}
              >
                ↷ Rotate Right
              </button>
              <button
                onClick={handleFlipHorizontal}
                className={`flip-button ${flipH ? 'active' : ''}`}
                title={getTooltip('flip')}
              >
                ↔ Flip Horizontal
              </button>
              <button
                onClick={handleFlipVertical}
                className={`flip-button ${flipV ? 'active' : ''}`}
                title={getTooltip('flip')}
              >
                ↕ Flip Vertical
              </button>
            </div>

            <div 
              className={`preview-container ${touchFeedback ? 'touch-active' : ''}`}
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              role="img"
              aria-label="Image preview with rotation and flip controls"
            >
              <img
                src={previewUrl}
                alt="Preview"
                className={`preview-image ${animationClass}`}
                style={{
                  transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                }}
              />
            </div>

            <button
              onClick={handleApplyTransforms}
              disabled={loading}
              className="action-button"
              title={getTooltip('apply')}
            >
              {loading ? 'Processing...' : 'Apply Transforms'}
            </button>

            {previewUrl && (
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
                  Download Transformed Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageRotator