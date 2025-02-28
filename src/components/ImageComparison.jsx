import { useImageProcessing } from '../context/ImageProcessingContext'

const ImageComparison = ({ originalImage, processedImage }) => {
  const { history, currentOperation, canUndo, canRedo, undo, redo } = useImageProcessing()

  return (
    <div className="comparison-container">
      <div className="comparison-controls">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="control-button"
          title="Undo last operation"
        >
          ↩ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="control-button"
          title="Redo last undone operation"
        >
          ↪ Redo
        </button>
      </div>

      <div className="image-comparison">
        <div className="image-container">
          <h4>Original</h4>
          <div className="image-wrapper">
            <img src={originalImage} alt="Original" className="comparison-image" />
          </div>
        </div>
        <div className="image-container">
          <h4>Processed</h4>
          <div className="image-wrapper">
            <img src={processedImage} alt="Processed" className="comparison-image" />
          </div>
        </div>
      </div>

      <div className="history-panel">
        <h3>History</h3>
        <div className="history-list">
          {history.map((operation, index) => (
            <div
              key={index}
              className={`history-item ${index === currentOperation ? 'active' : ''}`}
            >
              <span className="operation-type">{operation.type}</span>
              <span className="operation-details">{operation.details}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ImageComparison