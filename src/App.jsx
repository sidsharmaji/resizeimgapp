import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import './App.css'
import ImageResizer from './components/ImageResizer'
import ImageCompressor from './components/ImageCompressor'
import FormatConverter from './components/FormatConverter'
import ImageCropper from './components/ImageCropper'
import ImageRotator from './components/ImageRotator'
import Watermark from './components/Watermark'

const bytesToKB = bytes => Math.round(bytes / 1024)
const bytesToMB = bytes => (bytes / (1024 * 1024)).toFixed(2)
const KBToBytes = kb => kb * 1024
const MBToBytes = mb => mb * 1024 * 1024

function App() {
  const [activeView, setActiveView] = useState('home')

  const renderContent = () => {
    switch (activeView) {
      case 'resize':
        return <ImageResizer onBack={() => setActiveView('home')} />
      case 'compress':
        return <ImageCompressor onBack={() => setActiveView('home')} />
      case 'convert':
        return <FormatConverter onBack={() => setActiveView('home')} />
      case 'crop':
        return <ImageCropper onBack={() => setActiveView('home')} />
      case 'rotate':
        return <ImageRotator onBack={() => setActiveView('home')} />
      case 'watermark':
        return <Watermark onBack={() => setActiveView('home')} />
      default:
        return (
          <>
            <div className="hero-section">
              <h1>Transform Your Images with Ease</h1>
              <p className="hero-description">
                Powerful image resizing and compression tools at your fingertips.
                Optimize your images without compromising quality.
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
                <div className="tool-card" onClick={() => setActiveView('compress')}>
                  <div className="tool-icon">🗜️</div>
                  <h3>Compress Image</h3>
                  <p>Reduce file size with smart compression</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('convert')}>
                  <div className="tool-icon">🔄</div>
                  <h3>Convert Format</h3>
                  <p>Convert between JPEG, PNG, WebP and GIF</p>
                </div>
                <div className="tool-card" onClick={() => setActiveView('crop')}>
                  <div className="tool-icon">✂️</div>
                  <h3>Crop Image</h3>
                  <p>Crop and adjust image dimensions</p>
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
              </div>
            </div>
          </>
        )
    }
  }

  return renderContent()
}

export default App
