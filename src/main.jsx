import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ImageProcessingProvider } from './context/ImageProcessingContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImageProcessingProvider>
      <App />
    </ImageProcessingProvider>
  </StrictMode>,
)
