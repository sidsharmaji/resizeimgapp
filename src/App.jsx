import { useState } from 'react'
import './App.css'
import ImageResizer from './components/ImageResizer'
import FormatConverter from './components/FormatConverter'
import ImageRotator from './components/ImageRotator'
import Watermark from './components/Watermark'
import ImageToPdf from './components/ImageToPdf'
import PdfCompressor from './components/PdfCompressor'
import BatchProcessor from './components/BatchProcessor'
import ImageCropper from './components/ImageCropper'
import BackgroundRemover from './components/BackgroundRemover'
import WebOptimizer from './components/WebOptimizer'
import ColorPicker from './components/ColorPicker'
import QRGenerator from './components/QRGenerator'
import TextExtractor from './components/TextExtractor'

function App() {
  const [activeView, setActiveView] = useState('home')

  const renderContent = () => {
    switch (activeView) {
      case 'resize':
        return <ImageResizer onBack={() => setActiveView('home')} />
      case 'pdf':
        return <ImageToPdf onBack={() => setActiveView('home')} />
      case 'convert':
        return <FormatConverter onBack={() => setActiveView('home')} />
      case 'rotate':
        return <ImageRotator onBack={() => setActiveView('home')} />
      case 'watermark':
        return <Watermark onBack={() => setActiveView('home')} />
      case 'compress-pdf':
        return <PdfCompressor onBack={() => setActiveView('home')} />
      case 'batch':
        return <BatchProcessor onBack={() => setActiveView('home')} />
      case 'crop':
        return <ImageCropper onBack={() => setActiveView('home')} />
      case 'remove-bg':
        return <BackgroundRemover onBack={() => setActiveView('home')} />
      case 'optimize':
        return <WebOptimizer onBack={() => setActiveView('home')} />
      case 'color-picker':
        return <ColorPicker onBack={() => setActiveView('home')} />
      case 'qr-code':
        return <QRGenerator onBack={() => setActiveView('home')} />
      case 'ocr':
        return <TextExtractor onBack={() => setActiveView('home')} />
      default:
        return (
          <>
            <div className="hero-section">
              <h1>Transform Your Images with Ease</h1>
              <p className="hero-description">
                Powerful image tools at your fingertips.
                Transform, convert, and enhance your images.
              </p>
            </div>

            <div className="tools-section" id="tools">
              <h2>Image Tools</h2>
              <div className="tool-cards">
                <div className="tool-card" onClick={() => setActiveView('resize')}>
                  <div className="tool-icon">📐</div>
                  <h3>Resize Image</h3>
                  <p>Change image dimensions while preserving quality</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('pdf')}>
                  <div className="tool-icon">📄</div>
                  <h3>Convert to PDF</h3>
                  <p>Convert images to PDF format</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('convert')}>
                  <div className="tool-icon">🔄</div>
                  <h3>Convert Format</h3>
                  <p>Convert between JPEG, PNG, WebP and GIF</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('rotate')}>
                  <div className="tool-icon">🔁</div>
                  <h3>Rotate Image</h3>
                  <p>Rotate and flip your images</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('watermark')}>
                  <div className="tool-icon">💧</div>
                  <h3>Add Watermark</h3>
                  <p>Add text watermarks to your images</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('compress-pdf')}>
                  <div className="tool-icon">📎</div>
                  <h3>Compress PDF</h3>
                  <p>Reduce PDF file size while maintaining quality</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('batch')}>
                  <div className="tool-icon">🖼️</div>
                  <h3>Batch Processing</h3>
                  <p>Process multiple images with filters and effects</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('crop')}>
                  <div className="tool-icon">✂️</div>
                  <h3>Crop Image</h3>
                  <p>Crop images with preset aspect ratios</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('remove-bg')}>
                  <div className="tool-icon">🎭</div>
                  <h3>Remove Background</h3>
                  <p>AI-powered background removal</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('optimize')}>
                  <div className="tool-icon">🚀</div>
                  <h3>Web Optimizer</h3>
                  <p>Optimize images for web performance</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('color-picker')}>
                  <div className="tool-icon">🎨</div>
                  <h3>Color Picker</h3>
                  <p>Extract colors and generate palettes</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('qr-code')}>
                  <div className="tool-icon">📱</div>
                  <h3>QR Generator</h3>
                  <p>Create QR codes from images</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('ocr')}>
                  <div className="tool-icon">📝</div>
                  <h3>Text Extractor</h3>
                  <p>Extract text from images (OCR)</p>
                </div>
              </div>
            </div>
          </>
        )
    }
  }

  return renderContent()
}

export default App
