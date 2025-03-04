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
import { useEffect, useRef } from 'react';
import navigationManager from './utils/navigation';

function App() {
  const appContainerRef = useRef(null);
  const [activeView, setActiveView] = useState('home');
  const [transitionState, setTransitionState] = useState('idle');

  useEffect(() => {
    // Set up navigation change handler
    navigationManager.setNavigationChangeHandler((view) => {
      setActiveView(view);
      setTransitionState(navigationManager.getTransitionState());
    });

    if (appContainerRef.current) {
      const cleanup = navigationManager.setupMobileNavigation(
        appContainerRef.current,
        () => {
          navigationManager.goForward();
        },
        () => {
          navigationManager.goBack();
        }
      );

      return () => {
        if (cleanup) {
          cleanup.destroy();
        }
        // Clean up navigation handler
        navigationManager.setNavigationChangeHandler(null);
      };
    }
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    navigationManager.navigate(`/${view}`, '', view);
  };

  const renderContent = () => {
    switch(activeView) {
      case 'resize':
        return <ImageResizer onBack={() => handleViewChange('home')} />
      case 'pdf':
        return <ImageToPdf onBack={() => handleViewChange('home')} />
      case 'convert':
        return <FormatConverter onBack={() => handleViewChange('home')} />
      case 'rotate':
        return <ImageRotator onBack={() => handleViewChange('home')} />
      case 'watermark':
        return <Watermark onBack={() => handleViewChange('home')} />
      case 'compress-pdf':
        return <PdfCompressor onBack={() => handleViewChange('home')} />
      case 'batch':
        return <BatchProcessor onBack={() => handleViewChange('home')} />
      case 'crop':
        return <ImageCropper onBack={() => handleViewChange('home')} />
      case 'remove-bg':
        return <BackgroundRemover onBack={() => handleViewChange('home')} />
      case 'optimize':
        return <WebOptimizer onBack={() => handleViewChange('home')} />
      case 'color-picker':
        return <ColorPicker onBack={() => handleViewChange('home')} />
      case 'qr-code':
        return <QRGenerator onBack={() => handleViewChange('home')} />
      case 'ocr':
        return <TextExtractor onBack={() => handleViewChange('home')} />
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
                <div className="tool-card" onClick={() => handleViewChange('resize')}>
                  <div className="tool-icon">📐</div>
                  <h3>Resize Image</h3>
                  <p>Change image dimensions while preserving quality</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('pdf')}>
                  <div className="tool-icon">📄</div>
                  <h3>Convert to PDF</h3>
                  <p>Convert images to PDF format</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('convert')}>
                  <div className="tool-icon">🔄</div>
                  <h3>Convert Format</h3>
                  <p>Convert between JPEG, PNG, WebP and GIF</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('rotate')}>
                  <div className="tool-icon">🔁</div>
                  <h3>Rotate Image</h3>
                  <p>Rotate and flip your images</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('watermark')}>
                  <div className="tool-icon">💧</div>
                  <h3>Add Watermark</h3>
                  <p>Add text watermarks to your images</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('compress-pdf')}>
                  <div className="tool-icon">📎</div>
                  <h3>Compress PDF</h3>
                  <p>Reduce PDF file size while maintaining quality</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('batch')}>
                  <div className="tool-icon">🖼️</div>
                  <h3>Batch Processing</h3>
                  <p>Process multiple images with filters and effects</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('crop')}>
                  <div className="tool-icon">✂️</div>
                  <h3>Crop Image</h3>
                  <p>Crop images with preset aspect ratios</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('remove-bg')}>
                  <div className="tool-icon">🎭</div>
                  <h3>Remove Background</h3>
                  <p>AI-powered background removal</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('optimize')}>
                  <div className="tool-icon">🚀</div>
                  <h3>Web Optimizer</h3>
                  <p>Optimize images for web performance</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('color-picker')}>
                  <div className="tool-icon">🎨</div>
                  <h3>Color Picker</h3>
                  <p>Extract colors and generate palettes</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('qr-code')}>
                  <div className="tool-icon">📱</div>
                  <h3>QR Generator</h3>
                  <p>Create QR codes from images</p>
                </div>
                <div className="tool-card" onClick={() => handleViewChange('ocr')}>
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

  return (
    <div 
      className={`app-container ${transitionState !== 'idle' ? `transition-${transitionState}` : ''}`} 
      ref={appContainerRef}
    >
      {renderContent()}
    </div>
  );
}

export default App;
