import { useState, useEffect } from 'react'
import { useImageProcessing } from '../context/ImageProcessingContext'
import Tesseract from 'tesseract.js'

const TextExtractor = ({ onBack }) => {
  const { addToHistory, getTooltip } = useImageProcessing()
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    let worker = null;

    const initWorker = async () => {
      try {
        worker = await Tesseract.createWorker({
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(parseInt(m.progress * 100))
            }
          }
        });
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
      } catch (error) {
        console.error('Error initializing Tesseract worker:', error);
        setError('Failed to initialize text extraction. Please try again.');
      }
    };

    initWorker();

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setExtractedText('')
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
      }
      reader.onerror = () => {
        setError('Error reading file')
      }
      reader.readAsDataURL(file)
    }
  }

  const extractText = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setProgress(0)
      setError(null)

      // Create a new worker for each recognition task
      const worker = await Tesseract.createWorker('eng')
      await worker.loadLanguage('eng')
      await worker.initialize('eng')

      // Set recognition parameters for better accuracy
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-_\'"()[]{}:;/ ',
        tessjs_create_pdf: '0',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
      })

      const result = await worker.recognize(previewUrl)
      const text = result.data.text.trim()

      if (!text) {
        throw new Error('No text was detected in the image')
      }

      setExtractedText(text)
      addToHistory({
        type: 'Text Extraction',
        details: `Extracted ${text.length} characters`,
        originalUrl: previewUrl,
        metadata: { text }
      })

      // Terminate worker after task completion
      await worker.terminate()
    } catch (error) {
      console.error('Error extracting text:', error)
      setError(error.message || 'Failed to extract text. Please try a different image.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText)
        .then(() => {
          const tooltip = document.createElement('div')
          tooltip.className = 'copy-tooltip'
          tooltip.textContent = 'Copied!'
          document.body.appendChild(tooltip)
          setTimeout(() => document.body.removeChild(tooltip), 2000)
        })
        .catch(err => {
          console.error('Failed to copy:', err)
          setError('Failed to copy text to clipboard')
        })
    }
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button" title={getTooltip('back')}>←</button>
        <h2>Text Extractor</h2>
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
          <div className="ocr-section">
            <div className="preview-container">
              <img
                src={previewUrl}
                alt="Preview"
                className="preview-image"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <button
              onClick={extractText}
              disabled={loading}
              className="action-button"
              title={getTooltip('apply')}
            >
              {loading ? `Extracting Text... ${progress}%` : 'Extract Text'}
            </button>

            {loading && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
                <span className="progress-text">{progress}%</span>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {extractedText && (
              <div className="result-section">
                <div className="extracted-text">
                  <h3>Extracted Text:</h3>
                  <pre>{extractedText}</pre>
                </div>
                <button 
                  onClick={handleCopyText} 
                  className="copy-button"
                  title={getTooltip('copy')}
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TextExtractor