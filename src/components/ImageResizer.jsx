import { useState } from 'react';
import imageCompression from 'browser-image-compression';

const ImageResizer = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [newSize, setNewSize] = useState(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [targetSize, setTargetSize] = useState('');
  const [targetSizeUnit, setTargetSizeUnit] = useState('KB');
  const [loading, setLoading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [activeTab, setActiveTab] = useState('dimensions');
  const [resizedBlob, setResizedBlob] = useState(null);

  const presets = {
    'HD (1280x720)': { width: 1280, height: 720 },
    'Full HD (1920x1080)': { width: 1920, height: 1080 },
    '4K (3840x2160)': { width: 3840, height: 2160 },
    'Instagram Post (1080x1080)': { width: 1080, height: 1080 },
    'Instagram Story (1080x1920)': { width: 1080, height: 1920 },
    'Twitter Post (1200x675)': { width: 1200, height: 675 },
    'Facebook Cover (851x315)': { width: 851, height: 315 },
    'LinkedIn Cover (1584x396)': { width: 1584, height: 396 },
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setOriginalSize(Math.round(file.size / 1024));
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);

      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
        setOriginalAspectRatio(img.width / img.height);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleWidthChange = (e) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    if (maintainAspectRatio && originalAspectRatio) {
      setHeight(Math.round(newWidth / originalAspectRatio));
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    if (maintainAspectRatio && originalAspectRatio) {
      setWidth(Math.round(newHeight * originalAspectRatio));
    }
  };

  const handlePresetChange = (e) => {
    const preset = e.target.value;
    setSelectedPreset(preset);
    if (preset) {
      setWidth(presets[preset].width);
      setHeight(presets[preset].height);
    }
  };

  const compressToTargetSize = async (file, targetBytes) => {
    let minQuality = 0.01; // Minimum quality level
    let maxQuality = 1.0; // Maximum quality level
    let quality = 0.7; // Starting quality level
    let compressedFile = file;
    let attempts = 0;
    const maxAttempts = 15; // Maximum number of attempts
    const tolerance = 0.01; // Tolerance for the target size (1%)

    if (targetBytes >= file.size) {
      return file; // If the target size is larger than the original, return the original file
    }

    while (attempts < maxAttempts) {
      const options = {
        maxSizeMB: targetBytes / (1024 * 1024), // Convert targetBytes to MB
        useWebWorker: true,
        initialQuality: quality,
        fileType: 'image/jpeg',
        onProgress: (progress) => {
          const attemptProgress = (attempts / maxAttempts) * 100;
          setCompressionProgress(Math.min(Math.round(attemptProgress + progress), 100));
        },
      };

      try {
        compressedFile = await imageCompression(file, options);
        const currentSize = compressedFile.size;
        const sizeRatio = currentSize / targetBytes;

        if (Math.abs(1 - sizeRatio) <= tolerance) {
          // If the size is within the tolerance, return the compressed file
          return compressedFile;
        }

        // Adjust the quality level based on whether the current size is too large or too small
        if (currentSize > targetBytes) {
          maxQuality = quality; // Reduce the quality range
        } else {
          minQuality = quality; // Increase the quality range
        }

        // Set the new quality level to the midpoint of the current range
        quality = (minQuality + maxQuality) / 2;

        // Prevent quality from going too low or too high
        quality = Math.max(0.01, Math.min(1, quality));

        attempts++;
      } catch (error) {
        console.error('Compression attempt failed:', error);
        break;
      }
    }

    // If we couldn't achieve the target size within the maximum attempts, return the best attempt
    return compressedFile;
  };

  const createResizedImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = Number(width);
        canvas.height = Number(height);
        ctx.drawImage(img, 0, 0, Number(width), Number(height));

        // Use a fixed quality value of 0.9 for better consistency
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: new Date().getTime(),
            });
            const finalSize = Math.round(resizedFile.size / 1024);
            resolve({
              url: URL.createObjectURL(resizedFile),
              blob: blob, // Store the blob for direct download
              size: finalSize,
              width: canvas.width,
              height: canvas.height,
            });
          },
          'image/jpeg',
          0.9
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleDimensionResize = async () => {
    if (!selectedFile || !width || !height) {
      alert('Please select an image and specify dimensions');
      return;
    }

    try {
      setLoading(true);
      setCompressionProgress(0);
      const resizedImage = await createResizedImage(selectedFile);
      setPreviewUrl(resizedImage.url);
      setNewSize(resizedImage.size);
      setResizedBlob(resizedImage.blob); // Ensure resizedBlob is set
      setLoading(false);
    } catch (error) {
      console.error('Error resizing image:', error);
      alert('Error resizing image. Please try again.');
      setLoading(false);
      setCompressionProgress(0);
    }
  };

  const handleTargetSizeCompression = async () => {
    if (!selectedFile || !targetSize) {
      alert('Please select an image and specify target size');
      return;
    }

    try {
      setLoading(true);
      setCompressionProgress(0);

      const targetBytes =
        targetSizeUnit === 'KB' ? targetSize * 1024 : targetSize * 1024 * 1024;
      const processedFile = await compressToTargetSize(selectedFile, targetBytes);

      // Create a preview URL for the compressed file
      const url = URL.createObjectURL(processedFile);
      const finalSize = Math.round(processedFile.size / 1024);

      setPreviewUrl(url);
      setNewSize(finalSize);
      setResizedBlob(processedFile); // Store the compressed file blob
      setLoading(false);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error compressing image. Please try again.');
      setLoading(false);
      setCompressionProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl || !resizedBlob) {
      alert('No resized image available to download.');
      return;
    }

    try {
      // Web browser download
      const url = URL.createObjectURL(resizedBlob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `resized-${selectedFile.name}`;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (downloadError) {
      console.error('Error during file download:', downloadError);
      alert('Failed to download the image. Please try again.');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">
          ←
        </button>
        <h2>Resize Image</h2>
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
          <div className="resize-section">
            <div className="resize-tabs">
              <button
                className={`tab-button ${activeTab === 'dimensions' ? 'active' : ''}`}
                onClick={() => setActiveTab('dimensions')}
              >
                Resize by Dimensions
              </button>
              <button
                className={`tab-button ${activeTab === 'target-size' ? 'active' : ''}`}
                onClick={() => setActiveTab('target-size')}
              >
                Target Size Compression
              </button>
            </div>

            {activeTab === 'dimensions' && (
              <div className="tab-content">
                <select
                  value={selectedPreset}
                  onChange={handlePresetChange}
                  className="dimension-input"
                  style={{ marginBottom: '1rem', width: '100%', maxWidth: '300px' }}
                >
                  <option value="">Custom Size</option>
                  {Object.keys(presets).map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>

                <div className="dimensions">
                  <input
                    type="number"
                    placeholder="Width"
                    value={width}
                    onChange={handleWidthChange}
                    className="dimension-input"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    placeholder="Height"
                    value={height}
                    onChange={handleHeightChange}
                    className="dimension-input"
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    />
                    Maintain Aspect Ratio
                  </label>
                </div>
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
                    className="dimension-input"
                    style={{ maxWidth: '150px' }}
                  />
                  <select
                    value={targetSizeUnit}
                    onChange={(e) => setTargetSizeUnit(e.target.value)}
                    className="dimension-input"
                    style={{ maxWidth: '80px' }}
                  >
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={activeTab === 'dimensions' ? handleDimensionResize : handleTargetSizeCompression}
              disabled={loading}
              className="action-button"
            >
              {loading ? (
                <span className="loading-text">
                  Processing... {compressionProgress}%
                </span>
              ) : (
                activeTab === 'dimensions' ? 'Resize Image' : 'Compress Image'
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
                  Download Resized Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer;