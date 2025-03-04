import { useState, useRef } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'

const BatchProcessor = ({ onBack }) => {
  const { addToHistory } = useImageProcessing()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    quality: 90
  })
  const [metadata, setMetadata] = useState([])
  const [error, setError] = useState(null)
  const [targetFormat, setTargetFormat] = useState('image/jpeg')
  const canvasRef = useRef(null)

  const formatOptions = [
    { value: 'image/jpeg', label: 'JPEG', extension: 'jpg' },
    { value: 'image/png', label: 'PNG', extension: 'png' },
    { value: 'image/webp', label: 'WebP', extension: 'webp' }
  ]

  const handleFilesSelect = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 20) {
      setError('Maximum 20 files can be processed at once');
      return;
    }
    setSelectedFiles(files);
    setError(null);
    
    // Generate previews and extract metadata
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: Math.round(file.size / 1024),
      type: file.type
    }));
    
    setPreviewUrls(previews);
    extractMetadata(files);
  };

  const extractMetadata = async (files) => {
    const metadataList = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              name: file.name,
              dimensions: `${img.width}x${img.height}`,
              type: file.type,
              lastModified: new Date(file.lastModified).toLocaleString(),
              size: Math.round(file.size / 1024)
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }));
    setMetadata(metadataList);
  };

  const processImage = async (file, index, totalFiles) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        canvas.toBlob(
          (blob) => {
            const progress = Math.round(((index + 1) / totalFiles) * 100);
            setProgress(progress);

            resolve({
              url: URL.createObjectURL(blob),
              name: file.name,
              size: Math.round(blob.size / 1024),
              dimensions: `${img.width}x${img.height}`,
              blob: blob
            });
          },
          targetFormat,
          filters.quality / 100
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const applyFilters = async () => {
    if (!selectedFiles.length) {
      setError('Please select files to process');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      const processedImages = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const result = await processImage(selectedFiles[i], i, selectedFiles.length);
        processedImages.push(result);
      }

      setPreviewUrls(processedImages);
      
      addToHistory({
        type: 'Batch Process',
        details: `Processed ${processedImages.length} images with filters and format conversion`,
        files: processedImages.length,
        totalSize: processedImages.reduce((acc, img) => acc + img.size, 0),
        format: formatOptions.find(f => f.value === targetFormat).label
      });
    } catch (error) {
      console.error('Error processing images:', error);
      setError('Failed to process images. Please try again.');
    } finally {
      setLoading(false);
      updateProgress(0, 'Processing completed');
      cleanupResources();
    }
  };

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };

  const handleDownload = async () => {
    if (!previewUrls.length) {
      setError('No processed images to download');
      return;
    }

    try {
      const selectedFormat = formatOptions.find(format => format.value === targetFormat);
      previewUrls.forEach(image => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `processed-${image.name.split('.')[0]}.${selectedFormat.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      setError('Failed to download processed images');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Batch Image Processor</h2>
      </div>
      
      <div className="tool-content">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelect}
            className="file-input"
          />
          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        </div>

        {selectedFiles.length > 0 && (
          <div className="batch-process-section">
            <div className="filters-panel">
              <h3>Image Adjustments</h3>
              <div className="filter-controls">
                <div className="filter-control">
                  <label>Brightness</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.brightness}
                    onChange={(e) => handleFilterChange('brightness', e.target.value)}
                  />
                  <span>{filters.brightness}%</span>
                </div>
                <div className="filter-control">
                  <label>Contrast</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.contrast}
                    onChange={(e) => handleFilterChange('contrast', e.target.value)}
                  />
                  <span>{filters.contrast}%</span>
                </div>
                <div className="filter-control">
                  <label>Saturation</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.saturation}
                    onChange={(e) => handleFilterChange('saturation', e.target.value)}
                  />
                  <span>{filters.saturation}%</span>
                </div>
                <div className="filter-control">
                  <label>Quality</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.quality}
                    onChange={(e) => handleFilterChange('quality', e.target.value)}
                  />
                  <span>{filters.quality}%</span>
                </div>
              </div>

              <div className="format-selection">
                <label>Output Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="format-select"
                >
                  {formatOptions.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={applyFilters}
                disabled={loading}
                className="action-button"
              >
                {loading ? `Processing... ${progress}%` : 'Process Images'}
              </button>
            </div>

            <div className="metadata-panel">
              <h3>Image Information</h3>
              <div className="metadata-list">
                {metadata.map((item, index) => (
                  <div key={index} className="metadata-item">
                    <h4>{item.name}</h4>
                    <p>Dimensions: {item.dimensions}</p>
                    <p>Size: {item.size} KB</p>
                    <p>Type: {item.type}</p>
                    <p>Modified: {item.lastModified}</p>
                  </div>
                ))}
              </div>
            </div>

            {previewUrls.length > 0 && (
              <div className="preview-grid">
                {previewUrls.map((image, index) => (
                  <div key={index} className="preview-item">
                    <img src={image.url} alt={`Preview ${index + 1}`} />
                    <div className="preview-info">
                      <p>{image.name}</p>
                      <p>{image.size} KB</p>
                      {image.dimensions && <p>{image.dimensions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewUrls.length > 0 && (
              <button
                onClick={handleDownload}
                className="download-button"
                disabled={loading}
              >
                Download All Processed Images
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcessor;