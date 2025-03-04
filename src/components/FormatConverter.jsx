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
  const [quality, setQuality] = useState(90)
  const [error, setError] = useState(null)

  const formatOptions = [
    { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', description: 'Best for photographs' },
    { value: 'image/png', label: 'PNG', extension: 'png', description: 'Best for graphics with transparency' },
    { value: 'image/webp', label: 'WebP', extension: 'webp', description: 'Modern format with good compression' },
    { value: 'image/gif', label: 'GIF', extension: 'gif', description: 'Best for simple animations' },
    { value: 'image/bmp', label: 'BMP', extension: 'bmp', description: 'Uncompressed format' },
    { value: 'image/tiff', label: 'TIFF', extension: 'tiff', description: 'Best for high-quality prints' }
  ];

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
      setError(null)
      const convertedImage = await createConvertedImage(selectedFile)
      setPreviewUrl(convertedImage.url)
      setNewSize(Math.round(convertedImage.size / 1024))
    } catch (error) {
      console.error('Error converting image:', error)
      setError('Failed to convert image. Please try again.')
    } finally {
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

        canvas.toBlob(
          (blob) => {
            resolve({
              url: URL.createObjectURL(blob),
              size: blob.size,
              blob: blob
            });
          },
          targetFormat,
          quality / 100
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleDownload = async () => {
    if (!previewUrl) return
    setError(null)

    try {
      if (Capacitor.getPlatform() === 'android') {
        const { checkAndRequestPermissions } = await import('../utils/androidPermissions');
        const hasPermission = await checkAndRequestPermissions();
        if (!hasPermission) {
          setError('Storage permission is required to save images');
          return;
        }

        try {
          const selectedFormat = formatOptions.find(format => format.value === targetFormat);
          const fileName = `converted-${selectedFile.name.split('.')[0]}.${selectedFormat.extension}`;
          const savedUri = await downloadFileOnMobile(previewUrl, fileName);
          if (savedUri) {
            alert('Image saved successfully to: ' + savedUri);
          } else {
            throw new Error('Failed to get saved file URI');
          }
        } catch (error) {
          console.error('Error saving file:', error);
          setError(error.message || 'Error saving image. Please try again.');
        }
      } else {
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error('Failed to fetch image data');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        const selectedFormat = formatOptions.find(format => format.value === targetFormat);
        link.download = `converted-${selectedFile.name.split('.')[0]}.${selectedFormat.extension}`;
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error('Error during download:', error);
      setError('Error downloading image. Please try again.');
    }
  };

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
                {formatOptions.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label} - {format.description}
                  </option>
                ))}
              </select>

              <div className="quality-control">
                <label>Quality: {quality}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="quality-slider"
                />
              </div>
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
  );
};

export default FormatConverter;