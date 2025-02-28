import { useState } from 'react'
import { jsPDF } from 'jspdf'

const ImageToPdf = ({ onBack }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [orientation, setOrientation] = useState('portrait')
  const [loading, setLoading] = useState(false)
  const [pageSize, setPageSize] = useState('a4')

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(files)
  }

  const convertToPdf = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image')
      return
    }

    try {
      setLoading(true)
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      })

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const imageUrl = URL.createObjectURL(file)

        // Convert image to base64
        const base64Image = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })

        // Add new page for each image except the first one
        if (i > 0) {
          pdf.addPage()
        }

        // Calculate dimensions to fit the page while maintaining aspect ratio
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = imageUrl
        })

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgRatio = img.width / img.height
        const pageRatio = pageWidth / pageHeight

        let finalWidth = pageWidth
        let finalHeight = pageWidth / imgRatio

        if (finalHeight > pageHeight) {
          finalHeight = pageHeight
          finalWidth = pageHeight * imgRatio
        }

        // Center the image on the page
        const x = (pageWidth - finalWidth) / 2
        const y = (pageHeight - finalHeight) / 2

        pdf.addImage(base64Image, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST')

        // Clean up object URL
        URL.revokeObjectURL(imageUrl)
      }

      // Save the PDF
      pdf.save('converted-images.pdf')
      setLoading(false)
    } catch (error) {
      console.error('Error converting to PDF:', error)
      alert('Error converting images to PDF. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="tool-container">
      <div className="tool-header">
        <button onClick={onBack} className="back-button">←</button>
        <h2>Convert to PDF</h2>
      </div>
      
      <div className="tool-content">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            multiple
            className="file-input"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="pdf-options">
            <div className="option-group">
              <label>Page Orientation:</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="pdf-select"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="option-group">
              <label>Page Size:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="pdf-select"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>

            <div className="selected-files">
              <h3>Selected Images ({selectedFiles.length}):</h3>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={convertToPdf}
              disabled={loading}
              className="action-button"
            >
              {loading ? 'Converting...' : 'Convert to PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageToPdf